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

/**
 * 数独盤面の状態・ユーザー操作・ソルバー実行・リプレイ表示までを
 * まとめて扱うカスタムHook。App コンポーネントが直接 useState/useCallback
 * を多数抱えていた状態を、盤面に関する一つの責務としてここに集約する。
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

  const hideReplay = useCallback(() => {
    setReplayActive(false);
    setSolutionSteps([]);
    setReplayStep(0);
  }, []);

  const handleCellClick = useCallback(
    (index: number) => {
      if (replayActive) hideReplay();

      const next = [...boardState];
      next[index] = selectedTool;
      setBoardState(next);

      if (selectedTool === 0) {
        setUserInputIndices((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(index);
          return nextSet;
        });
        setStatus(null);
      } else {
        setUserInputIndices((prev) => new Set(prev).add(index));
        if (!isValidPlacement(next, index, selectedTool)) {
          setStatus({ text: "矛盾があります", color: "text-red-500" });
        } else {
          setStatus(null);
        }
      }
    },
    [replayActive, selectedTool, hideReplay, boardState],
  );

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
    handleCellClick,
    loadPreset,
    resetBoard,
    clearSolutionOnly,
    runSolver,
  };
}