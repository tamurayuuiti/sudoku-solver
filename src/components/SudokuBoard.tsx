import type { CellRenderInfo } from "../types";
import {
  getCellBackgroundClass,
  getCellBorderClasses,
  getFilledTextClasses,
  getSelectionOutlineClasses,
} from "../utils/cellRender";
import { arePeers } from "../utils/sudokuUnits";

/**
 * 盤面1マスの表示。盤面グリッド (SudokuBoard) からしか使われない
 * 内部部品のため、本ファイル内に留めて非公開（export しない）にする。
 *
 * 枠線・背景色・選択インジケーターはすべて「このdiv1つ」に対して描画する。
 * 以前は「枠線用の外側div」と「背景色・aspect-squareの内側div」に分かれており、
 * grid-cols-9 の列幅が1px単位でばらつく（9で割り切れない）ケースで
 * 内側の aspect-square が外側の枠線ボックスと僅かにズレる問題があったため、
 * 二重構造をやめて単一のボックスに統合した（サイズ決定は親の SudokuBoard 側で行う）。
 *
 * 選択セルの強調は ring（box-shadow）ではなく outline + 負の outline-offset を使う。
 * 理由は getSelectionOutlineClasses のコメントを参照。なお3x3ブロックの太線は
 * このセル自身の border ではなく、親の SudokuBoard 側で独立したオーバーレイとして
 * 描画しており、全セルの border-box は常に均一（1pxの薄線のみ）になっている。
 */
function SudokuCell({
  info,
  showCandidates,
  isSelected,
  isPeer,
  isSameValue,
  borderClass,
  onClick,
}: {
  info: CellRenderInfo;
  showCandidates: boolean;
  isSelected: boolean;
  isPeer: boolean;
  isSameValue: boolean;
  borderClass: string;
  onClick: () => void;
}) {
  const isEmpty = info.value === 0;
  const bgClass = getCellBackgroundClass(info.variant, info.isError, isSelected, isPeer, isSameValue);
  const outlineClass = getSelectionOutlineClasses(isSelected);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center ${bgClass} ${borderClass} select-none cursor-pointer text-[clamp(1.2rem,4vw,1.5rem)] ${
        isEmpty ? "hover:bg-slate-50" : "animate-pop"
      } ${getFilledTextClasses(info.variant, info.isError)} ${outlineClass}`}
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

/**
 * 9x9 の数独盤面グリッド全体。各マスの描画情報 (cellInfos) を受け取って
 * 並べるだけで、盤面のロジック（候補計算・確定処理）は持たない。
 *
 * セル単位の aspect-square ではなく、盤面コンテナ全体を aspect-square にして
 * auto-rows-fr で9行を均等分割する。これにより各セルは Grid の stretch で
 * ぴったり同じ矩形になり、枠線・背景色・選択インジケーターの位置がズレない。
 *
 * 3x3ブロックを区切る太線は、どのセルの border でもなく、盤面全体を覆う
 * 独立したオーバーレイ（4本の絶対配置div）として、セルとセルのちょうど境目
 * （1/3, 2/3 の位置）に描画する。こうすることで全セルの border-box が完全に
 * 均一になり、太線が「特定のセルの側面」に寄って選択インジケーターの見え方と
 * 食い違う問題が構造的に発生しなくなる。
 *
 * selectedCell を受け取り、選択セル本体・同じ行/列/ブロック(Peer)・
 * 同じ数字のセルをハイライトすることで、キーボード/マウスどちらの操作でも
 * 「今どこを触っているか」が一目で分かるようにする。
 */
export function SudokuBoard({
  cellInfos,
  showCandidates,
  selectedCell,
  onCellClick,
}: {
  cellInfos: CellRenderInfo[];
  showCandidates: boolean;
  selectedCell: number | null;
  onCellClick: (index: number) => void;
}) {
  const selectedValue = selectedCell !== null ? cellInfos[selectedCell].value : 0;

  return (
    <div className="relative grid grid-cols-9 auto-rows-fr aspect-square border-2 border-slate-700 bg-white mb-6 select-none">
      {cellInfos.map((info, i) => {
        const isSelected = i === selectedCell;
        const isPeer = !isSelected && selectedCell !== null && arePeers(i, selectedCell);
        const isSameValue = !isSelected && selectedValue !== 0 && info.value === selectedValue;

        return (
          <SudokuCell
            key={i}
            info={info}
            showCandidates={showCandidates}
            isSelected={isSelected}
            isPeer={isPeer}
            isSameValue={isSameValue}
            borderClass={getCellBorderClasses(i)}
            onClick={() => onCellClick(i)}
          />
        );
      })}

      {/* 3x3ブロック境界の太線（セルとは独立したオーバーレイ、クリックを妨げないよう pointer-events-none） */}
      <div className="absolute inset-y-0 left-1/3 w-0.5 -translate-x-1/2 bg-slate-700 pointer-events-none" />
      <div className="absolute inset-y-0 left-2/3 w-0.5 -translate-x-1/2 bg-slate-700 pointer-events-none" />
      <div className="absolute inset-x-0 top-1/3 h-0.5 -translate-y-1/2 bg-slate-700 pointer-events-none" />
      <div className="absolute inset-x-0 top-2/3 h-0.5 -translate-y-1/2 bg-slate-700 pointer-events-none" />
    </div>
  );
}