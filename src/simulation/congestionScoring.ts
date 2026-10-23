import { Approach, ApproachCongestion, ContextState, Vehicle } from '../types/traffic';
import { IntersectionGeometry } from './intersection';

export interface CongestionModelWeights {
  queueWeight: number; // 0.50
  volumeWeight: number; // 0.30
  speedWeight: number; // 0.20
}

export class CongestionScorer {
  public static readonly DEFAULT_WEIGHTS: CongestionModelWeights = {
    queueWeight: 0.5,
    volumeWeight: 0.3,
    speedWeight: 0.2,
  };

  public static readonly MAX_EXPECTED_QUEUE = 12; // vehicles
  public static readonly MAX_EXPECTED_VOLUME = 20; // vehicles on approach road
  public static readonly FREE_FLOW_SPEED_KMH = 50.0; // km/h

  /**
   * Calculates transparent per-approach congestion metrics and composite score (0 - 100).
   */
  public static calculateApproachCongestion(
    approach: Approach,
    vehicles: Vehicle[],
    context: ContextState,
    starvationTimer: number,
    weights: CongestionModelWeights = this.DEFAULT_WEIGHTS
  ): ApproachCongestion {
    // Filter active vehicles on this approach that have not exited
    const approachVehicles = vehicles.filter(
      (v) => v.approach === approach && !v.hasExited && !v.inIntersection
    );

    const vehicleCount = approachVehicles.length;

    // Queue: vehicles with speed < 0.8 m/s within stop line zone
    const queueVehicles = approachVehicles.filter(
      (v) => v.stopped || (v.speed < 0.8 && v.distanceToStopLine <= IntersectionGeometry.ROAD_SPAWN_DISTANCE)
    );
    const queueCount = queueVehicles.length;

    // Calculate queue length in metres
    let queueMetres = 0;
    if (queueVehicles.length > 0) {
      queueMetres = queueVehicles.reduce((sum, v) => sum + v.length + 2.0, 0);
    }

    // Average speed
    let avgSpeedKmh = this.FREE_FLOW_SPEED_KMH;
    if (vehicleCount > 0) {
      const avgSpeedMs = approachVehicles.reduce((sum, v) => sum + v.speed, 0) / vehicleCount;
      avgSpeedKmh = avgSpeedMs * 3.6;
    }

    // Weather impact modifier
    let speedBaseline = this.FREE_FLOW_SPEED_KMH;
    if (context.weather === 'rain') {
      speedBaseline *= 0.8; // rain reduces safe free-flow speed to 40 km/h
    } else if (context.weather === 'fog') {
      speedBaseline *= 0.7;
    }

    // Incident modifier
    let incidentFactor = 1.0;
    if (context.incidentApproach === approach) {
      incidentFactor = 1.0 + context.incidentReductionRatio * 0.8; // increases queue severity perceived
    }

    // Normalized components (0 - 100)
    const queueSeverity = Math.min(
      100,
      Math.max(0, (queueCount / this.MAX_EXPECTED_QUEUE) * 100 * incidentFactor)
    );

    const volumeScore = Math.min(
      100,
      Math.max(0, (vehicleCount / this.MAX_EXPECTED_VOLUME) * 100)
    );

    const speedReduction = Math.min(
      100,
      Math.max(0, ((speedBaseline - Math.min(speedBaseline, avgSpeedKmh)) / speedBaseline) * 100)
    );

    // Composite weighted score
    let totalScore =
      queueSeverity * weights.queueWeight +
      volumeScore * weights.volumeWeight +
      speedReduction * weights.speedWeight;

    // Starvation bonus: if an approach waits a long time, boost score slightly to prevent starvation
    if (starvationTimer > 35) {
      const starvationBoost = Math.min(30, (starvationTimer - 35) * 1.0);
      totalScore = Math.min(100, totalScore + starvationBoost);
    }

    totalScore = Math.round(Math.min(100, Math.max(0, totalScore)) * 10) / 10;

    return {
      approach,
      vehicleCount,
      queueCount,
      queueMetres: Math.round(queueMetres * 10) / 10,
      avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
      queueSeverity: Math.round(queueSeverity * 10) / 10,
      volumeScore: Math.round(volumeScore * 10) / 10,
      speedReduction: Math.round(speedReduction * 10) / 10,
      totalScore,
      starvationTimer,
    };
  }

  /**
   * Evaluates all 4 approaches simultaneously.
   */
  public static evaluateAll(
    vehicles: Vehicle[],
    context: ContextState,
    starvationTimers: Record<Approach, number>,
    weights: CongestionModelWeights = this.DEFAULT_WEIGHTS
  ): Record<Approach, ApproachCongestion> {
    const approaches: Approach[] = ['North', 'East', 'South', 'West'];
    const results = {} as Record<Approach, ApproachCongestion>;

    for (const app of approaches) {
      results[app] = this.calculateApproachCongestion(
        app,
        vehicles,
        context,
        starvationTimers[app] || 0,
        weights
      );
    }

    return results;
  }
}
