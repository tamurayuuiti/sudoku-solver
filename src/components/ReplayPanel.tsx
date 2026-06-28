/**
 * ソルバー実行後のリプレイ操作 UI。
 * 現在のステップ位置・候補メモ表示の ON/OFF・凡例をまとめて扱う。
 * replayActive が false の間は親側で非表示にするため、この中では常に表示状態を前提とする。
 */
export function ReplayPanel({
  replayStep,
  totalSteps,
  showCandidates,
  onShowCandidatesChange,
  onReplayStepChange,
}: {
  replayStep: number;
  totalSteps: number;
  showCandidates: boolean;
  onShowCandidatesChange: (next: boolean) => void;
  onReplayStepChange: (next: number) => void;
}) {
  return (
    <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 transition-all animate-pop">
      <div className="flex justify-between items-center mb-3">
        <div className="text-xs font-bold text-slate-500 flex items-center">
          REPLAY
          <span className="ml-2 text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
            {replayStep} / {totalSteps}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Memo</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showCandidates}
              onChange={(e) => onShowCandidatesChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
          </label>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={totalSteps}
        value={replayStep}
        onChange={(e) => onReplayStepChange(parseInt(e.target.value, 10))}
        className="w-full h-6 focus:outline-none block sudoku-range"
      />

      <div className="flex justify-center gap-4 mt-2 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded-sm" />
          <span className="text-slate-600">論理的推論</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-500 rounded-sm" />
          <span className="text-slate-600">推測・総当り</span>
        </div>
      </div>
    </div>
  );
}