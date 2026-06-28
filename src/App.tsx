import { useState, useMemo, useCallback, type JSX } from "react";
import type {
  Board,
  Candidates,
  CellRenderInfo,
  CellVariant,
  SolutionStep,
  StatusMessage,
  StepMethod,
} from "./types";

const BOARD_SIZE = 81;

const PRESET: Board = [
  0, 0, 0, 0, 0, 2, 0, 0, 0,
  0, 0, 8, 4, 0, 7, 0, 0, 0,
  9, 3, 0, 0, 0, 1, 0, 0, 7,
  0, 0, 0, 0, 5, 0, 3, 0, 0,
  0, 0, 7, 0, 0, 0, 9, 0, 0,
  0, 0, 0, 0, 4, 0, 0, 2, 0,
  0, 5, 0, 1, 0, 0, 8, 0, 9,
  0, 0, 4, 0, 6, 3, 0, 0, 5,
  8, 0, 0, 0, 0, 0, 2, 0, 0,
];

// ============================================================
//  Logic Core (pure functions, ported 1:1 from original logic)
// ============================================================

/** Row / column / 3x3 block index groups, computed once. */
function getUnits(): number[][] {
  const units: number[][] = [];
  // Rows
  for (let r = 0; r < 9; r++) {
    const row: number[] = [];
    for (let c = 0; c < 9; c++) row.push(r * 9 + c);
    units.push(row);
  }
  // Cols
  for (let c = 0; c < 9; c++) {
    const col: number[] = [];
    for (let r = 0; r < 9; r++) col.push(r * 9 + c);
    units.push(col);
  }
  // Blocks
  for (let b = 0; b < 9; b++) {
    const block: number[] = [];
    const startR = Math.floor(b / 3) * 3;
    const startC = (b % 3) * 3;
    for (let i = 0; i < 9; i++) {
      block.push((startR + Math.floor(i / 3)) * 9 + (startC + (i % 3)));
    }
    units.push(block);
  }
  return units;
}

const UNITS = getUnits();

function isValidMove(board: Board, index: number, num: number): boolean {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === num) return false;
    if (board[i * 9 + col] === num) return false;
    const r = startRow + Math.floor(i / 3);
    const c = startCol + (i % 3);
    if (board[r * 9 + c] === num) return false;
  }
  return true;
}

function isValidPlacement(board: Board, index: number, num: number): boolean {
  const tempVal = board[index];
  board[index] = 0;
  const valid = isValidMove(board, index, num);
  board[index] = tempVal;
  return valid;
}

function isValidBoard(board: Board): boolean {
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) {
      if (!isValidPlacement(board, i, board[i])) return false;
    }
  }
  return true;
}

function solveBacktrack(board: Board): boolean {
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) {
      for (let num = 1; num <= 9; num++) {
        if (isValidMove(board, i, num)) {
          board[i] = num;
          if (solveBacktrack(board)) return true;
          board[i] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function getBasicCandidates(board: Board, index: number): number[] {
  if (board[index] !== 0) return [];
  const row = Math.floor(index / 9);
  const col = index % 9;
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  const used = new Set<number>();
  for (let i = 0; i < 9; i++) {
    used.add(board[row * 9 + i]);
    used.add(board[i * 9 + col]);
    const r = startRow + Math.floor(i / 3);
    const c = startCol + (i % 3);
    used.add(board[r * 9 + c]);
  }
  const possible: number[] = [];
  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) possible.push(n);
  }
  return possible;
}

/** Naked Pairs / Triples elimination. Mutates `candidates` in place. */
function solveNakedSubsets(candidates: Candidates): boolean {
  let changed = false;
  for (const unit of UNITS) {
    const potentialCells: { index: number; cands: number[] }[] = [];
    for (const idx of unit) {
      const c = candidates[idx];
      if (c && c.length >= 2 && c.length <= 3) {
        potentialCells.push({ index: idx, cands: c });
      }
    }

    // Pairs
    const pairCells = potentialCells.filter((p) => p.cands.length === 2);
    for (let i = 0; i < pairCells.length; i++) {
      for (let j = i + 1; j < pairCells.length; j++) {
        const a = pairCells[i];
        const b = pairCells[j];
        if (a.cands[0] === b.cands[0] && a.cands[1] === b.cands[1]) {
          const nums = a.cands;
          const indices = [a.index, b.index];
          for (const idx of unit) {
            if (!indices.includes(idx) && candidates[idx]) {
              const oldLen = candidates[idx]!.length;
              candidates[idx] = candidates[idx]!.filter((n) => !nums.includes(n));
              if (candidates[idx]!.length !== oldLen) changed = true;
            }
          }
        }
      }
    }

    // Triples
    if (potentialCells.length >= 3) {
      for (let i = 0; i < potentialCells.length; i++) {
        for (let j = i + 1; j < potentialCells.length; j++) {
          for (let k = j + 1; k < potentialCells.length; k++) {
            const group = [potentialCells[i], potentialCells[j], potentialCells[k]];
            const union = new Set<number>();
            group.forEach((g) => g.cands.forEach((n) => union.add(n)));
            if (union.size === 3) {
              const nums = Array.from(union);
              const indices = group.map((g) => g.index);
              for (const idx of unit) {
                if (!indices.includes(idx) && candidates[idx]) {
                  const oldLen = candidates[idx]!.length;
                  candidates[idx] = candidates[idx]!.filter((n) => !nums.includes(n));
                  if (candidates[idx]!.length !== oldLen) changed = true;
                }
              }
            }
          }
        }
      }
    }
  }
  return changed;
}

/** Locked Candidates Type 2 (Claiming): Line -> Block elimination. */
function solveLockedCandidatesClaiming(candidates: Candidates): boolean {
  let changed = false;

  // Rows
  for (let r = 0; r < 9; r++) {
    for (let num = 1; num <= 9; num++) {
      const cols: number[] = [];
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        if (candidates[idx]?.includes(num)) cols.push(c);
      }
      if (cols.length === 0) continue;

      const blockColIndices = new Set(cols.map((c) => Math.floor(c / 3)));
      if (blockColIndices.size === 1) {
        const blockCol = [...blockColIndices][0];
        const blockRow = Math.floor(r / 3);
        const startR = blockRow * 3;
        const startC = blockCol * 3;

        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const targetR = startR + br;
            const targetC = startC + bc;
            if (targetR === r) continue;
            const idx = targetR * 9 + targetC;
            if (candidates[idx]?.includes(num)) {
              candidates[idx] = candidates[idx]!.filter((n) => n !== num);
              changed = true;
            }
          }
        }
      }
    }
  }

  // Cols
  for (let c = 0; c < 9; c++) {
    for (let num = 1; num <= 9; num++) {
      const rows: number[] = [];
      for (let r = 0; r < 9; r++) {
        const idx = r * 9 + c;
        if (candidates[idx]?.includes(num)) rows.push(r);
      }
      if (rows.length === 0) continue;

      const blockRowIndices = new Set(rows.map((r) => Math.floor(r / 3)));
      if (blockRowIndices.size === 1) {
        const blockRow = [...blockRowIndices][0];
        const blockCol = Math.floor(c / 3);
        const startR = blockRow * 3;
        const startC = blockCol * 3;

        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const targetR = startR + br;
            const targetC = startC + bc;
            if (targetC === c) continue;
            const idx = targetR * 9 + targetC;
            if (candidates[idx]?.includes(num)) {
              candidates[idx] = candidates[idx]!.filter((n) => n !== num);
              changed = true;
            }
          }
        }
      }
    }
  }
  return changed;
}

/** Computes fully-reduced candidates for every empty cell using iterative logic passes. */
function getAllSmartCandidates(board: Board): Candidates {
  const candidates: Candidates = Array(81).fill(null);

  // 1. Basic candidates
  for (let i = 0; i < 81; i++) {
    if (board[i] === 0) candidates[i] = getBasicCandidates(board, i);
  }

  // 2. Iterative reduction
  let changed = true;
  let loopCount = 0;
  while (changed && loopCount < 20) {
    changed = false;
    loopCount++;

    // A. Locked Candidates Type 1 (Pointing)
    for (let b = 0; b < 9; b++) {
      const startR = Math.floor(b / 3) * 3;
      const startC = (b % 3) * 3;
      const cells: number[] = [];
      for (let i = 0; i < 9; i++) {
        cells.push((startR + Math.floor(i / 3)) * 9 + (startC + (i % 3)));
      }

      for (let num = 1; num <= 9; num++) {
        const possibleCells = cells.filter((idx) => candidates[idx]?.includes(num));
        if (possibleCells.length <= 1 || possibleCells.length > 3) continue;

        const rows = new Set(possibleCells.map((idx) => Math.floor(idx / 9)));
        if (rows.size === 1) {
          const r = [...rows][0];
          for (let c = 0; c < 9; c++) {
            const idx = r * 9 + c;
            if (!cells.includes(idx) && candidates[idx]?.includes(num)) {
              candidates[idx] = candidates[idx]!.filter((n) => n !== num);
              changed = true;
            }
          }
        }

        const cols = new Set(possibleCells.map((idx) => idx % 9));
        if (cols.size === 1) {
          const c = [...cols][0];
          for (let r = 0; r < 9; r++) {
            const idx = r * 9 + c;
            if (!cells.includes(idx) && candidates[idx]?.includes(num)) {
              candidates[idx] = candidates[idx]!.filter((n) => n !== num);
              changed = true;
            }
          }
        }
      }
    }

    // B. Locked Candidates Type 2 (Claiming)
    if (solveLockedCandidatesClaiming(candidates)) {
      changed = true;
    }

    // C. Naked Subsets
    if (solveNakedSubsets(candidates)) {
      changed = true;
    }
  }
  return candidates;
}

/** Hidden Single: mutates board + steps if found. Returns true if a step was applied. */
function applyHiddenSingle(
  board: Board,
  steps: SolutionStep[],
  num: number,
  allCandidates: Candidates,
): boolean {
  const regions: number[][] = [];
  for (let r = 0; r < 9; r++) {
    const indices: number[] = [];
    for (let c = 0; c < 9; c++) indices.push(r * 9 + c);
    regions.push(indices);
  }
  for (let c = 0; c < 9; c++) {
    const indices: number[] = [];
    for (let r = 0; r < 9; r++) indices.push(r * 9 + c);
    regions.push(indices);
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const indices: number[] = [];
      const startR = br * 3;
      const startC = bc * 3;
      for (let i = 0; i < 9; i++) {
        indices.push((startR + Math.floor(i / 3)) * 9 + (startC + (i % 3)));
      }
      regions.push(indices);
    }
  }

  for (const region of regions) {
    let alreadyHas = false;
    const possibleCells: number[] = [];
    for (const idx of region) {
      if (board[idx] === num) {
        alreadyHas = true;
        break;
      }
      if (board[idx] === 0 && allCandidates[idx]?.includes(num)) {
        possibleCells.push(idx);
      }
    }
    if (!alreadyHas && possibleCells.length === 1) {
      const targetIdx = possibleCells[0];
      board[targetIdx] = num;
      steps.push({ index: targetIdx, value: num, method: "logic" });
      return true;
    }
  }
  return false;
}

/** Replays the backtracking solution as a sequence of human-style logical steps + guesses. */
function generateStepsWithSmartLogic(initialBoard: Board, finalBoard: Board): SolutionStep[] {
  const currentBoard = [...initialBoard];
  const steps: SolutionStep[] = [];
  let emptyCount = currentBoard.filter((n) => n === 0).length;
  let loopGuard = 0;

  while (emptyCount > 0 && loopGuard < 1000) {
    loopGuard++;
    let madeProgress = false;

    const candidates = getAllSmartCandidates(currentBoard);

    // Strategy 1: Naked Single
    for (let i = 0; i < 81; i++) {
      const c = candidates[i];
      if (currentBoard[i] === 0 && c && c.length === 1) {
        const val = c[0];
        currentBoard[i] = val;
        steps.push({ index: i, value: val, method: "logic" });
        emptyCount--;
        madeProgress = true;
      }
    }
    if (madeProgress) continue;

    // Strategy 2: Hidden Single
    for (let num = 1; num <= 9; num++) {
      if (applyHiddenSingle(currentBoard, steps, num, candidates)) {
        emptyCount--;
        madeProgress = true;
        break;
      }
    }
    if (madeProgress) continue;

    // Fallback (Guess): pick the cell with fewest candidates
    let bestCell = -1;
    let minCandidates = 10;
    for (let i = 0; i < 81; i++) {
      const c = candidates[i];
      if (currentBoard[i] === 0 && c) {
        const len = c.length;
        if (len > 0 && len < minCandidates) {
          minCandidates = len;
          bestCell = i;
        }
      }
    }

    if (bestCell !== -1) {
      const correctVal = finalBoard[bestCell];
      currentBoard[bestCell] = correctVal;
      steps.push({ index: bestCell, value: correctVal, method: "guess" });
      emptyCount--;
      madeProgress = true;
    } else {
      for (let i = 0; i < 81; i++) {
        if (currentBoard[i] === 0) {
          const correctVal = finalBoard[i];
          currentBoard[i] = correctVal;
          steps.push({ index: i, value: correctVal, method: "guess" });
          emptyCount--;
          madeProgress = true;
          break;
        }
      }
    }
  }
  return steps;
}

// ============================================================
//  Cell rendering helpers
// ============================================================

/** 9x9 grid border classes: thick lines every 3 cells, like the original .sudoku-cell rules. */
function getCellBorderClasses(index: number): string {
  const col = index % 9;
  const row = Math.floor(index / 9);
  const classes: string[] = ["border-t", "border-l", "border-slate-300"];

  // Right border: thick every 3rd column, thin otherwise; outer border handled by board wrapper
  if (col % 3 === 2 && col !== 8) {
    classes.push("border-r-2", "border-r-slate-700");
  } else if (col !== 8) {
    classes.push("border-r", "border-r-slate-300");
  }

  // Bottom border: thick every 3rd row, thin otherwise
  if (row % 3 === 2 && row !== 8) {
    classes.push("border-b-2", "border-b-slate-700");
  } else if (row !== 8) {
    classes.push("border-b", "border-b-slate-300");
  }

  return classes.join(" ");
}

function getFilledTextClasses(variant: CellVariant, isError: boolean): string {
  if (isError) return "text-red-600 bg-red-100";
  switch (variant) {
    case "user":
      return "font-bold text-slate-800";
    case "logic":
      return "font-bold text-green-600 bg-green-50/30";
    case "guess":
      return "font-bold text-orange-500 bg-orange-50/30";
    default:
      return "";
  }
}

// ============================================================
//  Sub-components
// ============================================================

function SudokuCell({
  info,
  showCandidates,
  onClick,
}: {
  info: CellRenderInfo;
  showCandidates: boolean;
  onClick: () => void;
}): JSX.Element {
  const isEmpty = info.value === 0;

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center bg-white p-0 m-0 select-none cursor-pointer aspect-square text-[clamp(1.2rem,4vw,1.5rem)] ${
        isEmpty ? "hover:bg-slate-50" : "animate-pop"
      } ${getFilledTextClasses(info.variant, info.isError)}`}
    >
      {!isEmpty && info.value}
      {isEmpty && showCandidates && info.candidates && info.candidates.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
            <span
              key={num}
              className="flex items-center justify-center text-[clamp(8px,2vw,10px)] leading-none text-slate-400"
            >
              {info.candidates!.includes(num) ? num : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolButton({
  value,
  active,
  onClick,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  const isErase = value === 0;

  return (
    <button
      onClick={onClick}
      title={isErase ? "消去" : undefined}
      className={`h-12 rounded border font-bold text-xl transition-all duration-100 ${
        active
          ? "bg-blue-600 text-white border-blue-600 -translate-y-0.5 shadow-md"
          : `bg-white border-slate-300 hover:bg-slate-50 ${isErase ? "text-slate-500" : "text-slate-700"}`
      } ${isErase ? "flex items-center justify-center" : ""}`}
    >
      {isErase ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z"
          />
        </svg>
      ) : (
        value
      )}
    </button>
  );
}

// ============================================================
//  Main App
// ============================================================

export default function App(): JSX.Element {
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

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center py-6 px-4">
      <header className="text-center mb-4 w-full max-w-md flex justify-between items-end px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 text-left">ナンプレSolver</h1>
          <p className="text-[10px] text-slate-500 text-left">v7: +Claiming (Locked Candidates Type 2)</p>
        </div>
        <button
          onClick={loadPreset}
          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded font-bold transition-colors mb-1"
        >
          テスト問題
        </button>
      </header>

      <main className="w-full max-w-md bg-white rounded-xl shadow-xl p-4 md:p-6 relative">
        <div
          className={`h-6 mb-2 text-center text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis transition-all ${
            status ? status.color : "text-transparent"
          }`}
        >
          {status ? status.text : "Ready"}
        </div>

        <div className="grid grid-cols-9 border-2 border-slate-700 bg-white mb-6 select-none">
          {cellInfos.map((info, i) => (
            <div key={i} className={getCellBorderClasses(i)}>
              <SudokuCell
                info={info}
                showCandidates={showCandidates}
                onClick={() => handleCellClick(i)}
              />
            </div>
          ))}
        </div>

        {replayActive && (
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 transition-all animate-pop">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs font-bold text-slate-500 flex items-center">
                REPLAY
                <span className="ml-2 text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {replayStep} / {solutionSteps.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Memo</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCandidates}
                    onChange={(e) => setShowCandidates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={solutionSteps.length}
              value={replayStep}
              onChange={(e) => setReplayStep(parseInt(e.target.value, 10))}
              className="w-full h-6 focus:outline-none block sudoku-range"
            />

            <div className="flex justify-center gap-4 mt-2 text-[10px]">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-sm" />
                <span className="text-slate-600">論理的推論</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-orange-500 rounded-sm" />
                <span className="text-slate-600">推測・総当り</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((val) => (
            <ToolButton
              key={val}
              value={val}
              active={selectedTool === val}
              onClick={() => setSelectedTool(val)}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetBoard}
            className="flex-1 py-3 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
          >
            全消去
          </button>
          <button
            onClick={runSolver}
            className="flex-2 py-3 rounded-lg bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
          >
            解く
          </button>
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={clearSolutionOnly}
            className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
          >
            AI入力のみクリア
          </button>
        </div>
      </main>
    </div>
  );
}