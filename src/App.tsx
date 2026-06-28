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
    handleCellClick,
    loadPreset,
    resetBoard,
    clearSolutionOnly,
    runSolver,
  } = useSudokuBoard();

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col items-center py-6 px-4">
      <Header onLoadPreset={loadPreset} />

      <main className="w-full max-w-md bg-white rounded-xl shadow-xl p-4 md:p-6 relative">
        <StatusBar status={status} />

        <SudokuBoard
          cellInfos={cellInfos}
          showCandidates={showCandidates}
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

        <ToolPalette selectedTool={selectedTool} onSelectTool={setSelectedTool} />

        <ActionBar
          onReset={resetBoard}
          onSolve={runSolver}
          onClearSolutionOnly={clearSolutionOnly}
        />
      </main>
    </div>
  );
}