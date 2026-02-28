/**
 * Battle Mode Page
 *
 * Main orchestrator for Battle mode that manages the flow:
 * Mission Selection → Mission Detail → Drill Phase → Dialogue Phase → Feedback
 *
 * @module pages/BattleModePage
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Mission, BattlePhase, BattleResult } from '../types/mode';
import { MissionSelector } from '../components/Battle/MissionSelector';
import { MissionDetail } from '../components/Battle/MissionDetail';
import { DrillPhase } from '../components/Battle/DrillPhase';
import { DialoguePhase } from '../components/Battle/DialoguePhase';
import { FeedbackDashboard } from '../components/Battle/FeedbackDashboard';
import { Confetti } from '../components/ui';

export function BattleModePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<BattlePhase>('mission-selection');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleMissionSelect = (mission: Mission) => {
    setSelectedMission(mission);
    setPhase('mission-detail');
  };

  const handleStartMission = () => {
    setPhase('drill-phase');
  };

  const handleDrillComplete = (success: boolean) => {
    if (success) {
      setPhase('dialogue-phase');
    } else {
      // Failed drill - go back to mission selection
      setPhase('mission-selection');
      setSelectedMission(null);
    }
  };

  const handleDialogueComplete = (result: BattleResult) => {
    setBattleResult(result);
    setPhase('feedback');

    // Trigger confetti celebration on success
    if (result.overallScore >= 70) {
      setShowConfetti(true);
      // Auto-hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Save practice session to IndexedDB
    savePracticeSession(result);
  };

  const handleRetry = () => {
    setBattleResult(null);
    setPhase('drill-phase');
  };

  const handleNextMission = () => {
    setBattleResult(null);
    setSelectedMission(null);
    setPhase('mission-selection');
  };

  const handleCancel = () => {
    navigate('/mode/battle');
  };

  const renderPhase = () => {
    switch (phase) {
      case 'mission-selection':
        return <MissionSelector onMissionSelect={handleMissionSelect} />;

      case 'mission-detail':
        return selectedMission ? (
          <MissionDetail
            mission={selectedMission}
            onStart={handleStartMission}
            onBack={() => setPhase('mission-selection')}
          />
        ) : null;

      case 'drill-phase':
        return selectedMission ? (
          <DrillPhase
            mission={selectedMission}
            onComplete={handleDrillComplete}
            onCancel={handleCancel}
          />
        ) : null;

      case 'dialogue-phase':
        return selectedMission ? (
          <DialoguePhase
            mission={selectedMission}
            onComplete={handleDialogueComplete}
            onCancel={handleCancel}
          />
        ) : null;

      case 'feedback':
        return battleResult ? (
          <FeedbackDashboard
            result={battleResult}
            onRetry={handleRetry}
            onNext={handleNextMission}
            onCancel={handleCancel}
          />
        ) : null;

      default:
        return <MissionSelector onMissionSelect={handleMissionSelect} />;
    }
  };

  return (
    <div className="battle-mode-page overflow-y-auto overflow-x-hidden">
      {renderPhase()}

      {/* Confetti Celebration */}
      <Confetti trigger={showConfetti} particleCount={150} />
    </div>
  );
}

/**
 * Saves practice session to IndexedDB
 */
async function savePracticeSession(result: BattleResult) {
  try {
    const { savePracticeSession: saveSession, battleResultToPracticeSession } = await import('../services/db/chunkDatabase');
    const session = battleResultToPracticeSession(result);
    await saveSession(session);
    console.log('Practice session saved successfully');
  } catch (error) {
    console.error('Failed to save practice session:', error);
  }
}

export default BattleModePage;
