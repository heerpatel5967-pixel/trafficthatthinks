import {
  Approach,
  ApproachCongestion,
  ContextState,
  DecisionRecord,
  EmergencyMission,
  SimulationSettings,
  Vehicle,
} from '../types/traffic';
import { CongestionScorer } from './congestionScoring';
import { ConflictMatrix } from './conflictMatrix';
import { SignalStateMachine } from './signalStateMachine';

export class AdaptiveTrafficController {
  private decisions: DecisionRecord[] = [];
  private lastEvaluationTime: number = 0;
  private evaluationInterval: number = 1.0; // check every 1 second
  private starvationTimers: Record<Approach, number> = {
    North: 0,
    East: 0,
    South: 0,
    West: 0,
  };

  public step(
    fsm: SignalStateMachine,
    vehicles: Vehicle[],
    context: ContextState,
    emergencyMission: EmergencyMission | null,
    settings: SimulationSettings,
    simTime: number,
    totalQueueCount: number,
    avgWaitTime: number
  ): DecisionRecord | null {
    const dt = simTime - this.lastEvaluationTime;
    if (dt < this.evaluationInterval && this.lastEvaluationTime > 0) {
      return null;
    }
    this.lastEvaluationTime = simTime;

    const signalState = fsm.getState();
    const currentApproach = ConflictMatrix.PHASE_TO_APPROACH[signalState.currentPhase];

    // Update starvation timers: active green resets to 0, other approaches accumulate waiting time
    const approaches: Approach[] = ['North', 'East', 'South', 'West'];
    for (const app of approaches) {
      if (app === currentApproach && signalState.step === 'GREEN') {
        this.starvationTimers[app] = 0;
      } else {
        this.starvationTimers[app] += Math.max(1, dt);
      }
    }

    // 1. Evaluate real-time congestion scores for all approaches
    const congestionScores = CongestionScorer.evaluateAll(
      vehicles,
      context,
      this.starvationTimers
    );

    const scoresMap: Record<Approach, number> = {
      North: congestionScores.North.totalScore,
      East: congestionScores.East.totalScore,
      South: congestionScores.South.totalScore,
      West: congestionScores.West.totalScore,
    };

    // 2. High-priority EMERGENCY PREEMPTION HANDLING
    if (emergencyMission && emergencyMission.state !== 'CLEARED') {
      const targetApp = emergencyMission.approach;

      if (currentApproach === targetApp && signalState.step === 'GREEN') {
        // Already green for emergency approach: maintain corridor
        emergencyMission.state = 'GREEN_GRANTED';
        fsm.requestPhaseChange(targetApp, 25, true);
        return null;
      }

      // Need to transition safely to emergency approach
      emergencyMission.state = 'PREEMPTION_REQUESTED';
      const success = fsm.requestPhaseChange(targetApp, 30, true);

      if (success) {
        emergencyMission.state = 'TRANSITIONING';
        const decision: DecisionRecord = {
          id: `DEC-EMERG-${Math.floor(simTime * 10)}`,
          simTime: Math.round(simTime * 10) / 10,
          actionType: 'EMERGENCY_PREEMPTION',
          selectedApproach: targetApp,
          allocatedGreenDuration: 30,
          approachScores: scoresMap,
          primaryReason: `Emergency ${emergencyMission.type.toUpperCase()} early-detected on ${targetApp} approach at ${Math.round(
            emergencyMission.distanceMetres
          )}m (ETA: ${Math.round(emergencyMission.etaSeconds)}s). Prioritizing green corridor while enforcing safe transition.`,
          safetyCheckResult: 'TRANSITION_ENFORCED',
          metricsBefore: {
            totalQueue: totalQueueCount,
            avgWait: avgWaitTime,
          },
        };
        this.decisions.unshift(decision);
        if (this.decisions.length > 100) this.decisions.pop();
        return decision;
      }
      return null;
    }

    // 3. NORMAL ADAPTIVE CONTROL (when no emergency is overriding)
    // Only make switching decisions during GREEN step
    if (signalState.step !== 'GREEN') {
      return null;
    }

    // Check if current green has fulfilled minimum green time
    if (signalState.elapsedInStep < settings.minGreenSeconds) {
      return null;
    }

    // Rank competing approaches
    const currentScore = congestionScores[currentApproach].totalScore;
    const sortedCompeting = approaches
      .filter((app) => app !== currentApproach)
      .map((app) => ({ app, score: congestionScores[app].totalScore }))
      .sort((a, b) => b.score - a.score);

    const highestCompeting = sortedCompeting[0];

    // Starvation Override check
    const starvedApproach = approaches.find((app) => this.starvationTimers[app] > 55);
    if (starvedApproach && starvedApproach !== currentApproach && signalState.elapsedInStep >= settings.minGreenSeconds) {
      const allocatedGreen = settings.minGreenSeconds + 5;
      fsm.requestPhaseChange(starvedApproach, allocatedGreen, false);

      const decision: DecisionRecord = {
        id: `DEC-STARVE-${Math.floor(simTime * 10)}`,
        simTime: Math.round(simTime * 10) / 10,
        actionType: 'STARVATION_OVERRIDE',
        selectedApproach: starvedApproach,
        allocatedGreenDuration: allocatedGreen,
        approachScores: scoresMap,
        primaryReason: `Starvation threshold exceeded on ${starvedApproach} (waiting ${Math.round(
          this.starvationTimers[starvedApproach]
        )}s). Overriding cycle to prevent vehicle stagnation.`,
        safetyCheckResult: 'VERIFIED_SAFE',
        metricsBefore: { totalQueue: totalQueueCount, avgWait: avgWaitTime },
      };
      this.decisions.unshift(decision);
      if (this.decisions.length > 100) this.decisions.pop();
      return decision;
    }

    // Decide whether to extend current green or switch to highest competing
    const currentQueue = congestionScores[currentApproach].queueCount;
    const shouldExtend =
      currentQueue > 0 &&
      currentScore >= highestCompeting.score * 0.85 &&
      signalState.elapsedInStep < settings.maxGreenSeconds;

    if (shouldExtend) {
      // Extend current green proportionally to queue size
      const additionalSec = Math.min(6, Math.max(2, currentQueue * 1.5));
      const targetDuration = Math.min(settings.maxGreenSeconds, signalState.targetStepDuration + additionalSec);
      fsm.requestPhaseChange(currentApproach, targetDuration, false);
      return null;
    }

    // If competing approach has higher demand or current green reached max duration
    if (
      highestCompeting.score > currentScore + 8 ||
      currentQueue === 0 ||
      signalState.elapsedInStep >= settings.maxGreenSeconds
    ) {
      // Calculate bounded green duration for new candidate
      const targetScore = highestCompeting.score;
      const normalizedRatio = Math.max(0, Math.min(1, targetScore / 100));
      const calculatedGreen = Math.round(
        settings.minGreenSeconds + normalizedRatio * (settings.maxGreenSeconds - settings.minGreenSeconds)
      );

      fsm.requestPhaseChange(highestCompeting.app, calculatedGreen, false);

      const decision: DecisionRecord = {
        id: `DEC-${Math.floor(simTime * 10)}`,
        simTime: Math.round(simTime * 10) / 10,
        actionType: 'PHASE_SWITCH',
        selectedApproach: highestCompeting.app,
        allocatedGreenDuration: calculatedGreen,
        approachScores: scoresMap,
        primaryReason: `${highestCompeting.app} selected: congestion score ${targetScore.toFixed(
          1
        )} exceeds ${currentApproach} (${currentScore.toFixed(1)}). Allocated ${calculatedGreen}s green. Clearance transition active.`,
        safetyCheckResult: 'VERIFIED_SAFE',
        metricsBefore: { totalQueue: totalQueueCount, avgWait: avgWaitTime },
      };
      this.decisions.unshift(decision);
      if (this.decisions.length > 100) this.decisions.pop();
      return decision;
    }

    return null;
  }

  public getDecisions(): DecisionRecord[] {
    return [...this.decisions];
  }

  public clearDecisions(): void {
    this.decisions = [];
  }
}
