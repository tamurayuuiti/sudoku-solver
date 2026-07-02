import type { Board, Candidates } from "../types";

// ============================================================
//  Coordinate helpers
//
//  9x9 盤面（長さ81の1次元配列、行優先）における
//  行・列・3x3ブロックのインデックス計算をまとめたもの。
//  isValidMove / getUnits / Pointing / Claiming / Hidden Single
//  など複数のロジックで共通して使われている座標変換を1か所に集約する。
// ============================================================

/** セルインデックスから (row, col) を求める。 */
export function toRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / 9), col: index % 9 };
}

/** (row, col) からそのセルが属する 3x3 ブロックの開始 (row, col) を求める。 */
export function blockOrigin(row: number, col: number): { startRow: number; startCol: number } {
  return { startRow: Math.floor(row / 3) * 3, startCol: Math.floor(col / 3) * 3 };
}

/** ブロック開始位置 (startRow, startCol) に属する9セルのインデックスを列挙する。 */
export function blockCellIndices(startRow: number, startCol: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < 9; i++) {
    indices.push((startRow + Math.floor(i / 3)) * 9 + (startCol + (i % 3)));
  }
  return indices;
}

/** 行インデックス r が属する9セルのインデックスを列挙する。 */
export function rowCellIndices(r: number): number[] {
  const indices: number[] = [];
  for (let c = 0; c < 9; c++) indices.push(r * 9 + c);
  return indices;
}

/** 列インデックス c が属する9セルのインデックスを列挙する。 */
export function colCellIndices(c: number): number[] {
  const indices: number[] = [];
  for (let r = 0; r < 9; r++) indices.push(r * 9 + c);
  return indices;
}

/**
 * 盤面全体の「ユニット」（行9本・列9本・3x3ブロック9個 = 27ユニット）を
 * セルインデックスの配列として返す。Naked Subsets や Hidden Single など、
 * 「行・列・ブロックそれぞれについて同じ処理を行う」系のロジックから利用する。
 */
export function getAllUnits(): number[][] {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) units.push(rowCellIndices(r));
  for (let c = 0; c < 9; c++) units.push(colCellIndices(c));
  for (let b = 0; b < 9; b++) {
    const startRow = Math.floor(b / 3) * 3;
    const startCol = (b % 3) * 3;
    units.push(blockCellIndices(startRow, startCol));
  }
  return units;
}

/** 盤面の指定セル (row, col) が同じ行・列・ブロックで使用済みの数字集合を求める。 */
export function usedNumbersAt(board: Board, row: number, col: number): Set<number> {
  const { startRow, startCol } = blockOrigin(row, col);
  const used = new Set<number>();
  for (let i = 0; i < 9; i++) {
    used.add(board[row * 9 + i]);
    used.add(board[i * 9 + col]);
    used.add(board[(startRow + Math.floor(i / 3)) * 9 + (startCol + (i % 3))]);
  }
  return used;
}

/**
 * 2つのセルが同じ行・列・3x3ブロックのいずれかを共有している（Peer関係にある）かを判定する。
 * 選択中セルとの関連性をハイライト表示するために UI 側（SudokuBoard）から利用する。
 */
export function arePeers(a: number, b: number): boolean {
  if (a === b) return false;
  const { row: rowA, col: colA } = toRowCol(a);
  const { row: rowB, col: colB } = toRowCol(b);
  if (rowA === rowB || colA === colB) return true;
  const originA = blockOrigin(rowA, colA);
  const originB = blockOrigin(rowB, colB);
  return originA.startRow === originB.startRow && originA.startCol === originB.startCol;
}

/**
 * 指定セルから数字 num の候補を取り除く。取り除けた（実際に候補に含まれていた）
 * 場合は true を返す。Locked Candidates / Naked Subsets など、複数の候補消去系
 * ロジックで繰り返し使われている「候補から除外して変更有無を返す」パターンを
 * 1箇所にまとめたもの。
 */
export function eliminateCandidate(candidates: Candidates, index: number, num: number): boolean {
  const cell = candidates[index];
  if (!cell || !cell.includes(num)) return false;
  candidates[index] = cell.filter((n) => n !== num);
  return true;
}

/**
 * targetIndices に含まれる各セルから、excludeIndices に含まれないもの限定で
 * num を候補から取り除く。Locked Candidates（ブロック内の対象外セルから除外）
 * のような「ある範囲から、除外リストを除いて一括消去する」処理を共通化する。
 * 1つでも変更があれば true を返す。
 */
export function eliminateCandidateFromCells(
  candidates: Candidates,
  targetIndices: number[],
  excludeIndices: number[],
  num: number,
): boolean {
  let changed = false;
  for (const idx of targetIndices) {
    if (!excludeIndices.includes(idx) && eliminateCandidate(candidates, idx, num)) {
      changed = true;
    }
  }
  return changed;
}