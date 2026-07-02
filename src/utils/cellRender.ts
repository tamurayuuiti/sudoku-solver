import type { CellVariant } from "../types";

// ============================================================
//  Cell rendering helpers (pure functions, no React dependency)
// ============================================================

/**
 * 9x9 grid の細線（セル同士の区切り）。太い3x3ブロック境界線はここでは描画しない
 * （SudokuBoard 側で盤面全体を覆う独立したオーバーレイとして描画する。理由は後述）。
 *
 * 以前は3x3ブロック境界だけ border-r-2/border-b-2 をそのセル自身に持たせていたが、
 * これだと border-box に太さが加算されるセルとされないセルが混在し、
 * セルごとに box の内側の余白が微妙に異なってしまっていた（box-sizing: border-box
 * のため外側サイズは揃うが、線の位置がセルの「片側」に寄っている状態）。
 * 選択セルの outline（getSelectionOutlineClasses）は border-box の外周を基準に
 * 描画されるため、この太さの違いが太枠線とoutlineの重なり方のズレとして
 * 視認できてしまっていた。
 *
 * 全セルの border を「1px の薄い線のみ」に統一することで、81マスすべての
 * border-box が完全に均一になり、この不整合が構造的に解消される。
 */
export function getCellBorderClasses(index: number): string {
  const col = index % 9;
  const row = Math.floor(index / 9);
  const classes: string[] = ["border-t", "border-l", "border-slate-300"];

  if (col !== 8) classes.push("border-r", "border-r-slate-300");
  if (row !== 8) classes.push("border-b", "border-b-slate-300");

  return classes.join(" ");
}

/** 文字色のみを扱う。背景色は getCellBackgroundClass に一本化し、bg-* クラス同士の
 *  衝突（Tailwind はクラス記述順ではなく生成後の CSS 順で勝敗が決まるため事故りやすい）を避ける。 */
export function getFilledTextClasses(variant: CellVariant, isError: boolean): string {
  if (isError) return "text-red-600";
  switch (variant) {
    case "user":
      return "font-bold text-slate-800";
    case "logic":
      return "font-bold text-green-600";
    case "guess":
      return "font-bold text-orange-500";
    default:
      return "";
  }
}

/**
 * セル背景色を「選択中 > 入力エラー > 同じ数字 > 同じ行/列/ブロック(Peer) > 確定方法 > 通常」
 * の優先順位で1つだけ決定する。bg-* を複数同時に付けると Tailwind の生成順依存で
 * どちらが勝つか読めなくなるため、必ずこの関数の戻り値ひとつだけを bg クラスとして使う。
 */
export function getCellBackgroundClass(
  variant: CellVariant,
  isError: boolean,
  isSelected: boolean,
  isPeer: boolean,
  isSameValue: boolean,
): string {
  if (isSelected) return "bg-indigo-50";
  if (isError) return "bg-red-100";
  if (isSameValue) return "bg-indigo-100/70";
  if (isPeer) return "bg-slate-100";
  if (variant === "logic") return "bg-green-50/40";
  if (variant === "guess") return "bg-orange-50/40";
  return "bg-white";
}

/**
 * 選択セルであることを示す枠線。
 *
 * この盤面は 3x3 ブロック境界だけ border-2（2px）、それ以外は border（1px）と
 * 辺によって枠線の太さが異なる。ring-inset（box-shadow）は「border-box から
 * 実際の border-width 分だけ内側 = padding-box」を基準に描画されるため、太い辺と
 * 細い辺とで内側への食い込み量が微妙に変わり、選択セルの四辺で太さが揃わず
 * ズレて見えてしまっていた。
 *
 * outline + 負の outline-offset は border-width の違いに影響されず、常に
 * 「border-box の外周から一律◯px内側」を基準に描画されるため、辺ごとの太さが
 * 異なっていても均一な位置・太さで表示できる。
 *
 * 同じ数字のセルへの副次的な枠線は、太いブロック境界の近くで視覚的なノイズに
 * なりやすいため廃止し、背景色の濃淡（getCellBackgroundClass）のみで示す。
 */
export function getSelectionOutlineClasses(isSelected: boolean): string {
  return isSelected ? "outline outline-2 outline-offset-[-2px] outline-indigo-500" : "";
}