import { type JSX } from "react";
import type { CellRenderInfo } from "./types";
import { useSudokuBoard } from "./hooks/useSudokuBoard";
import { getCellBorderClasses, getFilledTextClasses } from "./utils/cellRender";

// ============================================================
//  Sub-components
// ============================================================

function SudokuCell({
  info,
  showCandidates,
  onClick,
}: {
  info: CellRenderInfo;
  showCandidates: boolean;
  onClick: () => void;
}): JSX.Element {
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

function ToolButton({
  value,
  active,
  onClick,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  const isErase = value === 0;

  return (
    <button
      onClick={onClick}
      title={isErase ? "消去" : undefined}
      className={`h-12 rounded border font-bold text-xl transition-all duration-100 ${
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

// ============================================================
//  Main App
// ============================================================

export default function App(): JSX.Element {
  const {
    cellInfos,
    selectedTool,
    setSelectedTool,
    showCandidates,
    setShowCandidates,
    status,
    replayActive,
    replayStep,
    setReplayStep,
    solutionSteps,
    handleCellClick,
    loadPreset,
    resetBoard,
    clearSolutionOnly,
    runSolver,
  } = useSudokuBoard();

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center py-6 px-4">
      <header className="text-center mb-4 w-full max-w-md flex justify-between items-end px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 text-left">ナンプレSolver</h1>
          <p className="text-[10px] text-slate-500 text-left">v7: +Claiming (Locked Candidates Type 2)</p>
        </div>
        <button
          onClick={loadPreset}
          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded font-bold transition-colors mb-1"
        >
          テスト問題
        </button>
      </header>

      <main className="w-full max-w-md bg-white rounded-xl shadow-xl p-4 md:p-6 relative">
        <div
          className={`h-6 mb-2 text-center text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis transition-all ${
            status ? status.color : "text-transparent"
          }`}
        >
          {status ? status.text : "Ready"}
        </div>

        <div className="grid grid-cols-9 border-2 border-slate-700 bg-white mb-6 select-none">
          {cellInfos.map((info, i) => (
            <div key={i} className={getCellBorderClasses(i)}>
              <SudokuCell
                info={info}
                showCandidates={showCandidates}
                onClick={() => handleCellClick(i)}
              />
            </div>
          ))}
        </div>

        {replayActive && (
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 transition-all animate-pop">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs font-bold text-slate-500 flex items-center">
                REPLAY
                <span className="ml-2 text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {replayStep} / {solutionSteps.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Memo</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCandidates}
                    onChange={(e) => setShowCandidates(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={solutionSteps.length}
              value={replayStep}
              onChange={(e) => setReplayStep(parseInt(e.target.value, 10))}
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
        )}

        <div className="grid grid-cols-5 gap-2 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((val) => (
            <ToolButton
              key={val}
              value={val}
              active={selectedTool === val}
              onClick={() => setSelectedTool(val)}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetBoard}
            className="flex-1 py-3 rounded-lg border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
          >
            全消去
          </button>
          <button
            onClick={runSolver}
            className="flex-2 py-3 rounded-lg bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
          >
            解く
          </button>
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={clearSolutionOnly}
            className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
          >
            AI入力のみクリア
          </button>
        </div>
      </main>
    </div>
  );
}