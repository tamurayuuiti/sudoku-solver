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

        <div className="lg:w-64 lg:shrink-0 lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-14">
          {/* 盤面上辺とパレット上辺を揃えるための透明スペーサー。
              左カラムは StatusBar (h-6 + mb-2 = 2rem) の分だけ盤面が下にあるのに対し、
              右カラムはこのコンテナ自体の gap-6 (1.5rem) が spacer とパレットの間に
              自動で入るため、spacer 自身の高さは 2rem 全部ではなく、
              gap-6 で相殺しきれない差分 (2rem - 1.5rem = 0.5rem) だけで良い。 */}
          <div className="hidden lg:block lg:h-2" />
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