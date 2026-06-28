import type { CellVariant } from "../types";

// ============================================================
//  Cell rendering helpers (pure functions, no React dependency)
// ============================================================

/** 9x9 grid border classes: thick lines every 3 cells, like the original .sudoku-cell rules. */
export function getCellBorderClasses(index: number): string {
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

export function getFilledTextClasses(variant: CellVariant, isError: boolean): string {
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