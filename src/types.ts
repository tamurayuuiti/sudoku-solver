// ============================================================
//  Board primitives
// ============================================================

/** 1マスの値。0 = 空, 1-9 = 入力済み。 */
export type CellValue = number;

/** 81マス分の盤面（行優先、長さ81の配列）。 */
export type Board = CellValue[];

/** 81マス分の候補数字。null = 入力済みセル（候補なし）。 */
export type Candidates = (number[] | null)[];

// ============================================================
//  Solving steps
// ============================================================

/** 1マスがどう確定したか。論理的解法 or 推測（バックトラック）。 */
export type StepMethod = "logic" | "guess";

/** ソルバーが1マス確定させた履歴の1件。 */
export interface SolutionStep {
  index: number;
  value: number;
  method: StepMethod;
}

// ============================================================
//  Status message (UI)
// ============================================================

/** ステータス表示に使う Tailwind のテキストカラークラス。 */
export type StatusColor =
  | "text-blue-600"
  | "text-red-500"
  | "text-green-600"
  | "text-orange-500";

/** 画面上部に表示するステータスメッセージ。 */
export interface StatusMessage {
  text: string;
  color: StatusColor;
}

// ============================================================
//  Cell rendering
// ============================================================

/**
 * セルの表示バリアント。
 * "empty" | "user" はマス自体の状態、"logic" | "guess" は
 * ソルバーによる確定方法（StepMethod と同じ意味）を表す。
 */
export type CellVariant = "empty" | "user" | StepMethod;

/** 1マスを描画するために必要な情報。 */
export interface CellRenderInfo {
  value: number;
  candidates: number[] | null;
  variant: CellVariant;
  isError: boolean;
}