import type { Board, Candidates, SolutionStep } from "../types";
import {
  blockCellIndices,
  blockOrigin,
  colCellIndices,
  eliminateCandidate,
  eliminateCandidateFromCells,
  getAllUnits,
  rowCellIndices,
  usedNumbersAt,
} from "./sudokuUnits";

// ============================================================
//  Logic Core (pure functions, ported 1:1 from original logic)
// ============================================================

export const BOARD_SIZE = 81;

export const PRESET: Board = [
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

const UNITS = getAllUnits();

export function isValidMove(board: Board, index: number, num: number): boolean {
  const row = Math.floor(index / 9);
  const col = index % 9;
  return !usedNumbersAt(board, row, col).has(num);
}

export function isValidPlacement(board: Board, index: number, num: number): boolean {
  const tempVal = board[index];
  board[index] = 0;
  const valid = isValidMove(board, index, num);
  board[index] = tempVal;
  return valid;
}

export function isValidBoard(board: Board): boolean {
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) {
      if (!isValidPlacement(board, i, board[i])) return false;
    }
  }
  return true;
}

export function solveBacktrack(board: Board): boolean {
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
  const used = usedNumbersAt(board, row, col);
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
          const indices = [a.index, b.index];
          for (const num of a.cands) {
            if (eliminateCandidateFromCells(candidates, unit, indices, num)) changed = true;
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
              const indices = group.map((g) => g.index);
              for (const num of union) {
                if (eliminateCandidateFromCells(candidates, unit, indices, num)) changed = true;
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
        const { startRow } = blockOrigin(r, 0);
        const startCol = blockCol * 3;

        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const targetR = startRow + br;
            const targetC = startCol + bc;
            if (targetR === r) continue;
            if (eliminateCandidate(candidates, targetR * 9 + targetC, num)) changed = true;
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
        const { startCol } = blockOrigin(0, c);
        const startRow = blockRow * 3;

        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const targetR = startRow + br;
            const targetC = startCol + bc;
            if (targetC === c) continue;
            if (eliminateCandidate(candidates, targetR * 9 + targetC, num)) changed = true;
          }
        }
      }
    }
  }
  return changed;
}

/** Computes fully-reduced candidates for every empty cell using iterative logic passes. */
export function getAllSmartCandidates(board: Board): Candidates {
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
      const cells = blockCellIndices(startR, startC);

      for (let num = 1; num <= 9; num++) {
        const possibleCells = cells.filter((idx) => candidates[idx]?.includes(num));
        if (possibleCells.length <= 1 || possibleCells.length > 3) continue;

        const rows = new Set(possibleCells.map((idx) => Math.floor(idx / 9)));
        if (rows.size === 1) {
          const r = [...rows][0];
          if (eliminateCandidateFromCells(candidates, rowCellIndices(r), cells, num)) {
            changed = true;
          }
        }

        const cols = new Set(possibleCells.map((idx) => idx % 9));
        if (cols.size === 1) {
          const c = [...cols][0];
          if (eliminateCandidateFromCells(candidates, colCellIndices(c), cells, num)) {
            changed = true;
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
  for (const region of UNITS) {
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
export function generateStepsWithSmartLogic(initialBoard: Board, finalBoard: Board): SolutionStep[] {
  const currentBoard = [...initialBoard];
  const steps: SolutionStep[] = [];
  let emptyCount = currentBoard.filter((n) => n === 0).length;
  let loopGuard = 0;

  while (emptyCount > 0 && loopGuard < 1000) {
    loopGuard++;

    const candidates = getAllSmartCandidates(currentBoard);

    // Strategy 1: Naked Single
    let foundNakedSingle = false;
    for (let i = 0; i < 81; i++) {
      const c = candidates[i];
      if (currentBoard[i] === 0 && c && c.length === 1) {
        const val = c[0];
        currentBoard[i] = val;
        steps.push({ index: i, value: val, method: "logic" });
        emptyCount--;
        foundNakedSingle = true;
      }
    }
    if (foundNakedSingle) continue;

    // Strategy 2: Hidden Single
    let foundHiddenSingle = false;
    for (let num = 1; num <= 9; num++) {
      if (applyHiddenSingle(currentBoard, steps, num, candidates)) {
        emptyCount--;
        foundHiddenSingle = true;
        break;
      }
    }
    if (foundHiddenSingle) continue;

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
    } else {
      for (let i = 0; i < 81; i++) {
        if (currentBoard[i] === 0) {
          const correctVal = finalBoard[i];
          currentBoard[i] = correctVal;
          steps.push({ index: i, value: correctVal, method: "guess" });
          emptyCount--;
          break;
        }
      }
    }
  }
  return steps;
}