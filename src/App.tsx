import React from 'react';
import { ChessCanvas } from './components/ChessCanvas';
import { ChessHUD } from './components/ChessHUD';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { MoveHistoryDrawer } from './components/MoveHistoryDrawer';
import { ClockConfigModal } from './components/ClockConfigModal';
import { GameModeModal } from './components/GameModeModal';
import { HintBanner } from './components/HintBanner';
import { OnlineRoomModal } from './components/OnlineRoomModal';
import { DrawOfferModal } from './components/DrawOfferModal';
import { RematchModal } from './components/RematchModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { EvalBar } from './components/EvalBar';
import { RulesGuideModal } from './components/RulesGuideModal';
import { LoadPositionModal } from './components/LoadPositionModal';
import { GameReviewModal } from './components/GameReviewModal';
import { useGameStore } from './store/gameStore';

export default function App() {
  const isRulesModalOpen = useGameStore((state) => state.isRulesModalOpen);
  const setIsRulesModalOpen = useGameStore((state) => state.setIsRulesModalOpen);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <ChessCanvas />

      {/* Real-time Position Evaluation Bar */}
      <EvalBar />

      {/* Interactive HUD Overlay */}
      <ChessHUD />

      {/* Move History Drawer & Review */}
      <MoveHistoryDrawer />

      {/* Engine Hint Banner */}
      <HintBanner />

      {/* Modal Dialogs */}
      <PromotionModal />
      <GameOverModal />
      <ClockConfigModal />
      <GameModeModal />
      <OnlineRoomModal />
      <DrawOfferModal />
      <RematchModal />
      <ThemeSelectorModal />
      <LoadPositionModal />
      <GameReviewModal />
      <RulesGuideModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
    </main>
  );
}


