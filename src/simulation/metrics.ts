import { Approach, ApproachCongestion, SignalState, SimulationMetrics, Vehicle } from '../types/traffic';
import { ConflictMatrix } from './conflictMatrix';

export class SimulationMetricsCollector {
  private metrics: SimulationMetrics;
  private peakQueue: number = 0;
  private queueSamples: number[] = [];
  private lastHistorySampleTime: number = 0;

  constructor() {
    this.metrics = {
      simTimeSeconds: 0,
      activeVehiclesCount: 0,
      completedVehiclesCount: 0,
      totalWaitingVehicles: 0,
      avgWaitingTime: 0,
      maxQueueLength: 0,
      avgQueueLength: 0,
      totalThroughput: 0,
      emergencyDelaySeconds: 0,
      emergencyClearedCount: 0,
      phaseChangeCount: 0,
      safetyRuleViolations: 0,
      history: [],
    };
  }

  public reset(): void {
    this.peakQueue = 0;
    this.queueSamples = [];
    this.lastHistorySampleTime = 0;
    this.metrics = {
      simTimeSeconds: 0,
      activeVehiclesCount: 0,
      completedVehiclesCount: 0,
      totalWaitingVehicles: 0,
      avgWaitingTime: 0,
      maxQueueLength: 0,
      avgQueueLength: 0,
      totalThroughput: 0,
      emergencyDelaySeconds: 0,
      emergencyClearedCount: 0,
      phaseChangeCount: 0,
      safetyRuleViolations: 0,
      history: [],
    };
  }

  public recordViolation(reason: string): void {
    this.metrics.safetyRuleViolations += 1;
    console.warn(`[SAFETY INVARIANT VIOLATION] ${reason}`);
  }

  public update(
    vehicles: Vehicle[],
    signalState: SignalState,
    congestion: Record<Approach, ApproachCongestion>,
    simTime: number,
    emergencyDelay: number,
    emergencyCleared: number
  ): SimulationMetrics {
    this.metrics.simTimeSeconds = Math.round(simTime * 10) / 10;

    const active = vehicles.filter((v) => !v.hasExited);
    const completed = vehicles.filter((v) => v.hasExited);

    this.metrics.activeVehiclesCount = active.length;
    this.metrics.completedVehiclesCount = completed.length;
    this.metrics.totalThroughput = completed.length;
    this.metrics.phaseChangeCount = signalState.totalPhaseChanges;
    this.metrics.emergencyDelaySeconds = Math.round(emergencyDelay * 10) / 10;
    this.metrics.emergencyClearedCount = emergencyCleared;

    // Waiting vehicles & total wait time
    let totalWaitTime = 0;
    let waitingCount = 0;

    for (const v of vehicles) {
      totalWaitTime += v.waitingTime;
      if (v.stopped && !v.hasExited) {
        waitingCount++;
      }
    }

    this.metrics.totalWaitingVehicles = waitingCount;

    const totalVehiclesEver = Math.max(1, vehicles.length);
    this.metrics.avgWaitingTime = Math.round((totalWaitTime / totalVehiclesEver) * 10) / 10;

    // Instantaneous queue across all approaches
    const currentTotalQueue =
      congestion.North.queueCount +
      congestion.East.queueCount +
      congestion.South.queueCount +
      congestion.West.queueCount;

    const currentMaxApproachQueue = Math.max(
      congestion.North.queueCount,
      congestion.East.queueCount,
      congestion.South.queueCount,
      congestion.West.queueCount
    );

    if (currentMaxApproachQueue > this.peakQueue) {
      this.peakQueue = currentMaxApproachQueue;
    }
    this.metrics.maxQueueLength = this.peakQueue;

    this.queueSamples.push(currentTotalQueue);
    if (this.queueSamples.length > 500) this.queueSamples.shift();
    const sumQueues = this.queueSamples.reduce((a, b) => a + b, 0);
    this.metrics.avgQueueLength = Math.round((sumQueues / this.queueSamples.length) * 10) / 10;

    // Verify signal safety invariant
    const safetyCheck = ConflictMatrix.validate(signalState.lights);
    if (!safetyCheck.valid) {
      this.recordViolation(safetyCheck.violation || 'Conflicting phase invariant violated');
    }

    // Sample history periodically (every 1.5 seconds)
    if (simTime - this.lastHistorySampleTime >= 1.5) {
      this.lastHistorySampleTime = simTime;
      const currentGreenApproach = ConflictMatrix.PHASE_TO_APPROACH[signalState.currentPhase];

      this.metrics.history.push({
        time: Math.round(simTime),
        avgWait: this.metrics.avgWaitingTime,
        maxQueue: currentMaxApproachQueue,
        totalQueue: currentTotalQueue,
        throughput: this.metrics.totalThroughput,
        activeGreen: signalState.step === 'GREEN' ? currentGreenApproach : ('None' as any),
        congestionN: congestion.North.totalScore,
        congestionE: congestion.East.totalScore,
        congestionS: congestion.South.totalScore,
        congestionW: congestion.West.totalScore,
      });

      // Keep last 80 history points for smooth charts
      if (this.metrics.history.length > 80) {
        this.metrics.history.shift();
      }
    }

    return { ...this.metrics };
  }

  public getMetrics(): SimulationMetrics {
    return { ...this.metrics };
  }
}
