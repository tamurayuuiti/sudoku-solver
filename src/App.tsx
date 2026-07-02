import { useSudokuBoard } from "./hooks/useSudokuBoard";
import { Header } from "./components/Header";
import { StatusBar } from "./components/StatusBar";
import { SudokuBoard } from "./components/SudokuBoard";
import { ReplayPanel } from "./components/ReplayPanel";
import { ToolPalette } from "./components/ToolPalette";
import { ActionBar } from "./components/ActionBar";

/**
 * アプリ全体の Container Component。
 * 盤面に関する状態・ロジックは useSudokuBoard に委譲し、
 * ここでは画面構成（どの部品にどの状態・操作を渡すか）のみを担う。
 *
 * レイアウトはモバイルでは縦積み（盤面 → リプレイ → 数字パネル → 操作ボタン）、
 * 広い画面（lg 以上）では盤面の横に数字パネル・操作ボタンを並べ、
 * 視線移動とマウス移動距離を減らす。
 */
export default function App() {
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
    selectedCell,
    handleCellClick,
    loadPreset,
    resetBoard,
    clearSolutionOnly,
    runSolver,
  } = useSudokuBoard();

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center py-6 px-4">
      <Header onLoadPreset={loadPreset} />

      <main className="w-full max-w-md lg:max-w-3xl bg-white rounded-xl shadow-xl p-4 md:p-6 lg:flex lg:items-start lg:gap-8 relative">
        <div className="lg:flex-1 lg:max-w-md">
          <StatusBar status={status} />

          <SudokuBoard
            cellInfos={cellInfos}
            showCandidates={showCandidates}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
          />

          {replayActive && (
            <ReplayPanel
              replayStep={replayStep}
              totalSteps={solutionSteps.length}
              showCandidates={showCandidates}
              onShowCandidatesChange={setShowCandidates}
              onReplayStepChange={setReplayStep}
            />
          )}
        </div>

        <div className="lg:w-64 lg:shrink-0 lg:flex lg:flex-col lg:justify-center lg:gap-6 lg:sticky lg:top-6">
          <ToolPalette selectedTool={selectedTool} onSelectTool={setSelectedTool} />

          <ActionBar
            onReset={resetBoard}
            onSolve={runSolver}
            onClearSolutionOnly={clearSolutionOnly}
          />
        </div>
      </main>
    </div>
  );
}