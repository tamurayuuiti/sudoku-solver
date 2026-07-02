/**
 * ツールパレット1個のボタン。パレット (ToolPalette) からしか使われない
 * 内部部品のため、本ファイル内に留めて非公開（export しない）にする。
 */
function ToolButton({
  value,
  active,
  onClick,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  const isErase = value === 0;

  return (
    <button
      onClick={onClick}
      title={isErase ? "消去 (Delete / Backspace / 0)" : `${value} を入力`}
      className={`h-12 lg:h-14 rounded border font-bold text-xl lg:text-2xl transition-all duration-100 ${
        active
          ? "bg-blue-600 text-white border-blue-600 -translate-y-0.5 shadow-md"
          : `bg-white border-slate-300 hover:bg-slate-50 ${isErase ? "text-slate-500" : "text-slate-700"}`
      } ${isErase ? "flex items-center justify-center" : ""}`}
    >
      {isErase ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z"
          />
        </svg>
      ) : (
        value
      )}
    </button>
  );
}

/**
 * 1〜9 + 消去の入力ツールを選択するパレット。
 * 選択中のツール (selectedTool) は盤面操作と共有される状態のため、
 * このコンポーネント自身では持たず、親から受け取る。
 *
 * モバイル（狭い画面）では盤面下に 5x2 のグリッドで配置し、片手操作で
 * 親指が届きやすい従来のレイアウトを維持する。lg 以上の広い画面では
 * 盤面横のサイドバーに 3 列のグリッドで縦に配置し、ボタンサイズも
 * わずかに大きくしてクリック領域を確保する。
 */
export function ToolPalette({
  selectedTool,
  onSelectTool,
}: {
  selectedTool: number;
  onSelectTool: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 lg:grid-cols-3 gap-2 lg:gap-3 mb-6 lg:mb-0">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((val) => (
        <ToolButton
          key={val}
          value={val}
          active={selectedTool === val}
          onClick={() => onSelectTool(val)}
        />
      ))}
    </div>
  );
}