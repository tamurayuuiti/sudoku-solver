import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function isTypingTarget(el: Element | null): boolean {
  const tag = el?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

interface UseKeyboardControlParams {
  /** 現在キーボードカーソルが乗っているセル（未選択なら null）。 */
  selectedCell: number | null;
  setSelectedCell: Dispatch<SetStateAction<number | null>>;
  /** 数字キー入力・クリアが発生したときに呼ばれる（index, value）。 */
  onInputValue: (index: number, value: number) => void;
}

/**
 * 数独盤面に対するキーボード操作をまとめるカスタムHook。
 *
 * - 矢印キー: 選択セルを移動（盤面の外には出ない・ラップしない）
 * - 1〜9: 選択セルに数字を入力
 * - Delete / Backspace / 0: 選択セルをクリア
 *
 * リプレイパネルの range/checkbox など、他の input 要素にフォーカスがある間や
 * 修飾キー（Cmd/Ctrl/Alt）押下時はブラウザ標準の挙動を優先し、盤面操作としては扱わない。
 * マウス操作（セルクリックでの選択・入力）とは、selectedCell と入力処理（onInputValue）を
 * useSudokuBoard 側で共有することで自然に共存する——クリックは選択とペイントを同時に行い、
 * キーボードは選択移動と入力を独立して行える。
 */
export function useKeyboardControl({ selectedCell, setSelectedCell, onInputValue }: UseKeyboardControlParams) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (ARROW_KEYS.has(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          const current = prev ?? 40; // 未選択時は盤面中央から開始
          const row = Math.floor(current / 9);
          const col = current % 9;
          if (e.key === "ArrowUp") return Math.max(0, row - 1) * 9 + col;
          if (e.key === "ArrowDown") return Math.min(8, row + 1) * 9 + col;
          if (e.key === "ArrowLeft") return row * 9 + Math.max(0, col - 1);
          return row * 9 + Math.min(8, col + 1); // ArrowRight
        });
        return;
      }

      if (selectedCell === null) return;

      if (e.key >= "1" && e.key <= "9") {
        onInputValue(selectedCell, Number(e.key));
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        onInputValue(selectedCell, 0);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, setSelectedCell, onInputValue]);
}