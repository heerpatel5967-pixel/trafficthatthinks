import { Approach, LightColor, PhaseId, SignalPhaseStep, SignalState } from '../types/traffic';
import { ConflictMatrix } from './conflictMatrix';

export interface TransitionEvent {
  fromPhase: PhaseId;
  toPhase: PhaseId;
  timestamp: number;
  reason: string;
}

export class SignalStateMachine {
  private state: SignalState;
  private yellowDuration: number = 3.0;
  private allRedDuration: number = 2.0;
  private minGreenDuration: number = 8.0;
  private maxGreenDuration: number = 45.0;
  private onPhaseChanged?: (event: TransitionEvent) => void;

  constructor(
    initialApproach: Approach = 'North',
    config?: {
      yellowSec?: number;
      allRedSec?: number;
      minGreenSec?: number;
      maxGreenSec?: number;
      onPhaseChanged?: (event: TransitionEvent) => void;
    }
  ) {
    if (config?.yellowSec) this.yellowDuration = config.yellowSec;
    if (config?.allRedSec) this.allRedDuration = config.allRedSec;
    if (config?.minGreenSec) this.minGreenDuration = config.minGreenSec;
    if (config?.maxGreenSec) this.maxGreenDuration = config.maxGreenSec;
    if (config?.onPhaseChanged) this.onPhaseChanged = config.onPhaseChanged;

    const initialPhase = ConflictMatrix.APPROACH_TO_PHASE[initialApproach];

    this.state = {
      currentPhase: initialPhase,
      step: 'GREEN',
      elapsedInStep: 0,
      targetStepDuration: this.minGreenDuration,
      lights: this.buildLights(initialApproach, 'GREEN'),
      nextPhaseCandidate: null,
      emergencyActive: false,
      emergencyApproach: null,
      fault: false,
      cycleCount: 1,
      totalPhaseChanges: 0,
    };

    this.verifyInvariants();
  }

  public getState(): SignalState {
    return { ...this.state, lights: { ...this.state.lights } };
  }

  public updateConfig(config: {
    yellowSec?: number;
    allRedSec?: number;
    minGreenSec?: number;
    maxGreenSec?: number;
  }): void {
    if (config.yellowSec !== undefined) this.yellowDuration = Math.max(2, config.yellowSec);
    if (config.allRedSec !== undefined) this.allRedDuration = Math.max(1, config.allRedSec);
    if (config.minGreenSec !== undefined) this.minGreenDuration = Math.max(5, config.minGreenSec);
    if (config.maxGreenSec !== undefined) this.maxGreenDuration = Math.max(this.minGreenDuration, config.maxGreenSec);
  }

  /**
   * Request transition to next phase candidate.
   * If emergency is active, priority takes precedence.
   */
  public requestPhaseChange(
    targetApproach: Approach,
    allocatedGreenSeconds: number,
    isEmergency: boolean = false
  ): boolean {
    const targetPhase = ConflictMatrix.APPROACH_TO_PHASE[targetApproach];
    const currentApproach = ConflictMatrix.PHASE_TO_APPROACH[this.state.currentPhase];

    if (isEmergency) {
      this.state.emergencyActive = true;
      this.state.emergencyApproach = targetApproach;

      // If we are already green for this approach, simply extend green
      if (currentApproach === targetApproach && this.state.step === 'GREEN') {
        this.state.targetStepDuration = Math.max(this.state.targetStepDuration, this.state.elapsedInStep + allocatedGreenSeconds);
        return true;
      }

      // If we are green for a conflicting approach, enforce safe yellow transition
      if (this.state.step === 'GREEN') {
        // Can initiate yellow transition immediately for emergency
        this.state.nextPhaseCandidate = targetPhase;
        this.transitionTo('YELLOW', this.yellowDuration);
        return true;
      } else if (this.state.step === 'YELLOW' || this.state.step === 'ALL_RED') {
        // Safety lock: Allow clearance to finish, set emergency as next candidate
        this.state.nextPhaseCandidate = targetPhase;
        return true;
      }
    }

    // Normal controller request: check minimum green time first
    if (currentApproach === targetApproach) {
      // Extend or maintain current green
      if (this.state.step === 'GREEN') {
        const boundedGreen = Math.min(this.maxGreenDuration, Math.max(this.minGreenDuration, allocatedGreenSeconds));
        this.state.targetStepDuration = boundedGreen;
      }
      return true;
    }

    // Attempting to change to a different phase
    if (this.state.step === 'GREEN') {
      if (this.state.elapsedInStep >= this.minGreenDuration) {
        this.state.nextPhaseCandidate = targetPhase;
        this.transitionTo('YELLOW', this.yellowDuration);
        return true;
      } else {
        // Must wait for minimum green before starting transition
        this.state.nextPhaseCandidate = targetPhase;
        return false;
      }
    }

    // Already transitioning
    return false;
  }

  /**
   * Step the finite-state machine by dt seconds.
   */
  public tick(dt: number, simTime: number): void {
    this.state.elapsedInStep += dt;

    // Check invariants every tick
    this.verifyInvariants();

    const currentApproach = ConflictMatrix.PHASE_TO_APPROACH[this.state.currentPhase];

    switch (this.state.step) {
      case 'GREEN':
        // If elapsed exceeds target duration or maximum green, initiate yellow transition
        if (this.state.elapsedInStep >= this.state.targetStepDuration || this.state.elapsedInStep >= this.maxGreenDuration) {
          if (!this.state.emergencyActive || (this.state.emergencyApproach && this.state.emergencyApproach !== currentApproach)) {
            // Determine next phase candidate if not already set
            if (!this.state.nextPhaseCandidate) {
              this.state.nextPhaseCandidate = this.getNextDefaultPhase(this.state.currentPhase);
            }
            this.transitionTo('YELLOW', this.yellowDuration);
          }
        }
        break;

      case 'YELLOW':
        // Yellow clearance timer elapsed -> ALL_RED_CLEARANCE
        if (this.state.elapsedInStep >= this.state.targetStepDuration) {
          this.transitionTo('ALL_RED', this.allRedDuration);
        }
        break;

      case 'ALL_RED':
        // All-red clearance elapsed -> activate next phase
        if (this.state.elapsedInStep >= this.state.targetStepDuration) {
          const nextPhase = this.state.nextPhaseCandidate || this.getNextDefaultPhase(this.state.currentPhase);
          const nextApproach = ConflictMatrix.PHASE_TO_APPROACH[nextPhase];
          const prevPhase = this.state.currentPhase;

          this.state.currentPhase = nextPhase;
          this.state.nextPhaseCandidate = null;
          this.state.totalPhaseChanges += 1;
          this.state.cycleCount = Math.floor(this.state.totalPhaseChanges / 4) + 1;

          // Default green duration (controller can adaptively lengthen)
          const greenSec = this.state.emergencyActive && this.state.emergencyApproach === nextApproach ? 25 : this.minGreenDuration;
          this.transitionTo('GREEN', greenSec);

          if (this.onPhaseChanged) {
            this.onPhaseChanged({
              fromPhase: prevPhase,
              toPhase: nextPhase,
              timestamp: simTime,
              reason: this.state.emergencyActive ? 'Emergency Priority Cleared Green' : 'Adaptive Cycle Transition',
            });
          }
        }
        break;
    }
  }

  public clearEmergency(): void {
    this.state.emergencyActive = false;
    this.state.emergencyApproach = null;
  }

  private transitionTo(nextStep: SignalPhaseStep, duration: number): void {
    const currentApproach = ConflictMatrix.PHASE_TO_APPROACH[this.state.currentPhase];
    this.state.step = nextStep;
    this.state.elapsedInStep = 0;
    this.state.targetStepDuration = duration;
    this.state.lights = this.buildLights(currentApproach, nextStep);
    this.verifyInvariants();
  }

  private buildLights(activeApproach: Approach, step: SignalPhaseStep): Record<Approach, LightColor> {
    const approaches: Approach[] = ['North', 'East', 'South', 'West'];
    const lights: Record<Approach, LightColor> = {
      North: 'RED',
      East: 'RED',
      South: 'RED',
      West: 'RED',
    };

    if (step === 'GREEN') {
      lights[activeApproach] = 'GREEN';
    } else if (step === 'YELLOW') {
      lights[activeApproach] = 'YELLOW';
    } else {
      // ALL_RED
      // all stay RED
    }

    return lights;
  }

  private verifyInvariants(): void {
    const result = ConflictMatrix.validate(this.state.lights);
    if (!result.valid) {
      this.state.fault = true;
      this.state.faultReason = result.violation;
      // Failsafe: force all RED
      this.state.lights = { North: 'RED', East: 'RED', South: 'RED', West: 'RED' };
      this.state.step = 'ALL_RED';
      console.error('[SignalSafetyFault]', result.violation);
    }
  }

  private getNextDefaultPhase(current: PhaseId): PhaseId {
    switch (current) {
      case 'Phase_N':
        return 'Phase_E';
      case 'Phase_E':
        return 'Phase_S';
      case 'Phase_S':
        return 'Phase_W';
      case 'Phase_W':
        return 'Phase_N';
    }
  }
}
