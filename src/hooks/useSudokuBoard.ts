import { useCallback, useMemo, useState } from "react";
import type { Board, CellRenderInfo, CellVariant, SolutionStep, StatusMessage, StepMethod } from "../types";
import {
  BOARD_SIZE,
  PRESET,
  generateStepsWithSmartLogic,
  getAllSmartCandidates,
  isValidBoard,
  isValidPlacement,
  solveBacktrack,
} from "../utils/sudokuLogic";
import { useKeyboardControl } from "./useKeyboardControl";

/** 初期選択セル（盤面中央）。ページを開いた直後からキーボード操作をすぐ使えるようにするため。 */
const DEFAULT_SELECTED_CELL = 40;

/**
 * 数独盤面の状態・ユーザー操作・ソルバー実行・リプレイ表示までを
 * まとめて扱うカスタムHook。App コンポーネントが直接 useState/useCallback
 * を多数抱えていた状態を、盤面に関する一つの責務としてここに集約する。
 *
 * マウス（クリック）とキーボードは同じ selectedCell / setCellValue を共有するため、
 * どちらで操作しても状態が食い違わない。
 */
export function useSudokuBoard() {
  const [boardState, setBoardState] = useState<Board>(() => Array<number>(BOARD_SIZE).fill(0));
  const [userInputIndices, setUserInputIndices] = useState<Set<number>>(() => new Set());
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([]);
  const [selectedTool, setSelectedTool] = useState<number>(1);
  const [showCandidates, setShowCandidates] = useState<boolean>(true);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [replayActive, setReplayActive] = useState<boolean>(false);
  const [replayStep, setReplayStep] = useState<number>(0);
  const [selectedCell, setSelectedCell] = useState<number | null>(DEFAULT_SELECTED_CELL);

  const hideReplay = useCallback(() => {
    setReplayActive(false);
    setSolutionSteps([]);
    setReplayStep(0);
  }, []);

  /**
   * 指定セルに値をセットする共通処理。クリック（ツールパレットの値）・
   * キーボード入力（数字キー / クリア）の両方から利用する単一の入力経路。
   */
  const setCellValue = useCallback(
    (index: number, value: number) => {
      if (replayActive) hideReplay();

      const next = [...boardState];
      next[index] = value;
      setBoardState(next);

      if (value === 0) {
        setUserInputIndices((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(index);
          return nextSet;
        });
        setStatus(null);
      } else {
        setUserInputIndices((prev) => new Set(prev).add(index));
        if (!isValidPlacement(next, index, value)) {
          setStatus({ text: "矛盾があります", color: "text-red-500" });
        } else {
          setStatus(null);
        }
      }
    },
    [replayActive, hideReplay, boardState],
  );

  const handleCellClick = useCallback(
    (index: number) => {
      setSelectedCell(index);
      setCellValue(index, selectedTool);
    },
    [setCellValue, selectedTool],
  );

  /**
   * キーボードでの数字入力・クリア。ツールパレットの選択状態（selectedTool）にも
   * 反映することで、キーボードとパレットの見た目・挙動の一貫性を保つ。
   */
  const handleKeyboardInput = useCallback(
    (index: number, value: number) => {
      setSelectedTool(value);
      setCellValue(index, value);
    },
    [setCellValue],
  );

  useKeyboardControl({
    selectedCell,
    setSelectedCell,
    onInputValue: handleKeyboardInput,
  });

  const loadPreset = useCallback(() => {
    const nextBoard = Array<number>(BOARD_SIZE).fill(0);
    const nextUserInputs = new Set<number>();
    for (let i = 0; i < 81; i++) {
      if (PRESET[i] !== 0) {
        nextBoard[i] = PRESET[i];
        nextUserInputs.add(i);
      }
    }
    setBoardState(nextBoard);
    setUserInputIndices(nextUserInputs);
    setStatus({ text: "テスト問題をロードしました", color: "text-blue-600" });
    hideReplay();
  }, [hideReplay]);

  const resetBoard = useCallback(() => {
    setBoardState(Array<number>(BOARD_SIZE).fill(0));
    setUserInputIndices(new Set());
    setStatus(null);
    hideReplay();
  }, [hideReplay]);

  const clearSolutionOnly = useCallback(() => {
    setBoardState((prev) => prev.map((v, i) => (userInputIndices.has(i) ? v : 0)));
    setStatus(null);
    hideReplay();
  }, [userInputIndices, hideReplay]);

  const runSolver = useCallback(() => {
    setStatus(null);
    hideReplay();

    if (!isValidBoard(boardState)) {
      setStatus({ text: "盤面に矛盾があります", color: "text-red-500" });
      return;
    }

    const initialBoard = [...boardState];
    const solveBoard = [...boardState];

    const startTime = performance.now();
    const solved = solveBacktrack(solveBoard);
    const endTime = performance.now();
    const elapsed = (endTime - startTime).toFixed(2);

    if (solved) {
      const steps = generateStepsWithSmartLogic(initialBoard, solveBoard);
      setSolutionSteps(steps);
      setReplayActive(true);
      setReplayStep(steps.length);
      setStatus({ text: `完了！ (${elapsed}ms)`, color: "text-green-600" });
    } else {
      setStatus({ text: `解なし (${elapsed}ms)`, color: "text-orange-500" });
    }
  }, [boardState, hideReplay]);

  // Derived render state for the 81 cells, recomputed whenever inputs that affect
  // the visible board change (board contents, replay position, candidate visibility).
  const cellInfos = useMemo<CellRenderInfo[]>(() => {
    if (replayActive) {
      const tempBoard = Array<number>(81).fill(0);
      const methods = new Map<number, StepMethod>();

      userInputIndices.forEach((idx) => {
        tempBoard[idx] = boardState[idx];
      });
      for (let k = 0; k < replayStep; k++) {
        const s = solutionSteps[k];
        tempBoard[s.index] = s.value;
        methods.set(s.index, s.method);
      }

      const candidatesMap = showCandidates ? getAllSmartCandidates(tempBoard) : [];

      return Array.from({ length: 81 }, (_, i) => {
        const val = tempBoard[i];
        if (val !== 0) {
          const variant: CellVariant = userInputIndices.has(i)
            ? "user"
            : methods.get(i) === "guess"
              ? "guess"
              : "logic";
          return { value: val, candidates: null, variant, isError: false };
        }
        return {
          value: 0,
          candidates: showCandidates ? candidatesMap[i] ?? [] : null,
          variant: "empty",
          isError: false,
        };
      });
    }

    // Normal (non-replay) board display
    return boardState.map((val, i) => {
      if (val === 0) {
        return { value: 0, candidates: null, variant: "empty", isError: false };
      }
      const isUser = userInputIndices.has(i);
      const isError = isUser && !isValidPlacement(boardState, i, val);
      return {
        value: val,
        candidates: null,
        variant: isUser ? "user" : "logic",
        isError,
      };
    });
  }, [boardState, userInputIndices, replayActive, replayStep, solutionSteps, showCandidates]);

  return {
    cellInfos,
    selectedTool,
    setSelectedTool,
    showCandidates,
    setShowCandidates,
    status,
    replayActive,
    replayStep,
    setReplayStep,
    solutionSteps,
    selectedCell,
    handleCellClick,
    loadPreset,
    resetBoard,
    clearSolutionOnly,
    runSolver,
  };
}