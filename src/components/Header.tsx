/**
 * ページ上部のタイトルと「テスト問題」ボタン。
 * 状態は持たず、クリック時の挙動のみ親から受け取る Presentational Component。
 */
export function Header({ onLoadPreset }: { onLoadPreset: () => void }) {
  return (
    <header className="text-center mb-4 w-full max-w-md flex justify-between items-end px-1">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 text-left">ナンプレSolver</h1>
        <p className="text-[10px] text-slate-500 text-left">v7: +Claiming (Locked Candidates Type 2)</p>
      </div>
      <button
        onClick={onLoadPreset}
        className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded font-bold transition-colors mb-1"
      >
        テスト問題
      </button>
    </header>
  );
}