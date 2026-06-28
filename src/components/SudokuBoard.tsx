import type { CellRenderInfo } from "../types";
import { getCellBorderClasses, getFilledTextClasses } from "../utils/cellRender";

/**
 * 盤面1マスの表示。盤面グリッド (SudokuBoard) からしか使われない
 * 内部部品のため、本ファイル内に留めて非公開（export しない）にする。
 */
function SudokuCell({
  info,
  showCandidates,
  onClick,
}: {
  info: CellRenderInfo;
  showCandidates: boolean;
  onClick: () => void;
}) {
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

/**
 * 9x9 の数独盤面グリッド全体。各マスの描画情報 (cellInfos) を受け取って
 * 並べるだけで、盤面のロジック（候補計算・確定処理）は持たない。
 */
export function SudokuBoard({
  cellInfos,
  showCandidates,
  onCellClick,
}: {
  cellInfos: CellRenderInfo[];
  showCandidates: boolean;
  onCellClick: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-9 border-2 border-slate-700 bg-white mb-6 select-none">
      {cellInfos.map((info, i) => (
        <div key={i} className={getCellBorderClasses(i)}>
          <SudokuCell
            info={info}
            showCandidates={showCandidates}
            onClick={() => onCellClick(i)}
          />
        </div>
      ))}
    </div>
  );
}