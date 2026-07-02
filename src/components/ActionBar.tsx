/**
 * 盤面に対する主要な操作（全消去・解く・AI入力のみクリア）をまとめたアクション群。
 * いずれも状態を持たず、クリック時の挙動を親から受け取るだけの Presentational Component。
 */
export function ActionBar({
  onReset,
  onSolve,
  onClearSolutionOnly,
}: {
  onReset: () => void;
  onSolve: () => void;
  onClearSolutionOnly: () => void;
}) {
  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 lg:py-3.5 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 active:scale-95 transition-all"
        >
          全消去
        </button>
        <button
          onClick={onSolve}
          className="flex-2 py-3 lg:py-3.5 rounded-lg bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
        >
          解く
        </button>
      </div>

      <div className="mt-3 text-center">
        <button
          onClick={onClearSolutionOnly}
          className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer py-1 px-2"
        >
          AI入力のみクリア
        </button>
      </div>
    </>
  );
}