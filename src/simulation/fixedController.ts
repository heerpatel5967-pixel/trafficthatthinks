import { Approach, PhaseId, SignalState } from '../types/traffic';
import { ConflictMatrix } from './conflictMatrix';
import { SignalStateMachine } from './signalStateMachine';

export class FixedTimeController {
  private fixedGreenSeconds: number = 25.0;

  constructor(fixedGreen: number = 25.0) {
    this.fixedGreenSeconds = fixedGreen;
  }

  public setFixedGreen(seconds: number): void {
    this.fixedGreenSeconds = Math.max(10, Math.min(60, seconds));
  }

  public getFixedGreen(): number {
    return this.fixedGreenSeconds;
  }

  /**
   * Evaluates fixed-cycle step. Fixed controller blindly cycles N -> E -> S -> W.
   */
  public step(fsm: SignalStateMachine, simTime: number): void {
    const state = fsm.getState();
    const currentApproach = ConflictMatrix.PHASE_TO_APPROACH[state.currentPhase];

    // Ensure current green is scheduled for the fixed interval
    if (state.step === 'GREEN' && state.targetStepDuration !== this.fixedGreenSeconds) {
      fsm.requestPhaseChange(currentApproach, this.fixedGreenSeconds, false);
    }
  }
}
