/**
 * ページ上部のタイトルと「テスト問題」ボタン。
 * 状態は持たず、クリック時の挙動のみ親から受け取る Presentational Component。
 * main 側の幅（lg 以上でサイドバー分だけ広がる）に合わせて max-w を揃える。
 */
export function Header({ onLoadPreset }: { onLoadPreset: () => void }) {
  return (
    <header className="text-center mb-4 w-full max-w-md lg:max-w-3xl flex justify-between items-end px-1">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 text-left">ナンプレSolver</h1>
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