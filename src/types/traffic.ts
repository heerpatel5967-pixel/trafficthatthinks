export type Approach = 'North' | 'East' | 'South' | 'West';

export type LightColor = 'RED' | 'YELLOW' | 'GREEN';

export type SignalPhaseStep = 'GREEN' | 'YELLOW' | 'ALL_RED';

export type PhaseId = 'Phase_N' | 'Phase_E' | 'Phase_S' | 'Phase_W';

export type VehicleType =
  | 'car'
  | 'bus'
  | 'truck'
  | 'two_wheeler'
  | 'auto_rickshaw'
  | 'ambulance'
  | 'fire_engine'
  | 'police';

export type TurnDirection = 'straight' | 'left' | 'right';

export interface Vehicle {
  id: string;
  type: VehicleType;
  approach: Approach;
  laneIndex: number; // 0: inner (straight/right), 1: outer (straight/left) - Indian LHT
  position: number; // Metres from road spawn towards stop line (stopLine is e.g. at position 160m)
  distanceToStopLine: number;
  speed: number; // m/s
  maxSpeed: number; // m/s
  acceleration: number; // m/s^2
  length: number; // metres
  width: number;
  color: string;
  isEmergency: boolean;
  emergencyType?: 'ambulance' | 'fire_engine' | 'police';
  turnDirection: TurnDirection;
  inIntersection: boolean;
  intersectionProgress: number; // 0 to 1
  hasExited: boolean;
  waitingTime: number; // seconds spent stopped (speed < 0.5 m/s)
  travelTime: number;
  stopped: boolean;
  detectedBySensor: boolean;
  detectionTimestamp?: number;
}

export interface SignalState {
  currentPhase: PhaseId;
  step: SignalPhaseStep;
  elapsedInStep: number;
  targetStepDuration: number;
  lights: Record<Approach, LightColor>;
  nextPhaseCandidate: PhaseId | null;
  emergencyActive: boolean;
  emergencyApproach: Approach | null;
  fault: boolean;
  faultReason?: string;
  cycleCount: number;
  totalPhaseChanges: number;
}

export interface ApproachCongestion {
  approach: Approach;
  vehicleCount: number;
  queueCount: number;
  queueMetres: number;
  avgSpeedKmh: number;
  queueSeverity: number; // 0 - 100
  volumeScore: number; // 0 - 100
  speedReduction: number; // 0 - 100
  totalScore: number; // 0 - 100 (weighted composite)
  starvationTimer: number; // seconds since last green
}

export type WeatherType = 'clear' | 'rain' | 'fog';

export type TimeOfDay = 'morning_peak' | 'normal' | 'evening_peak' | 'night';

export interface ContextState {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  incidentApproach: Approach | null;
  incidentDescription: string | null;
  incidentReductionRatio: number; // 0.0 - 0.7 capacity reduction
  pedestrianCall: boolean;
  pedestrianActive: boolean;
  pedestrianTimer: number;
}

export interface EmergencyMission {
  id: string;
  type: 'ambulance' | 'fire_engine' | 'police';
  approach: Approach;
  distanceMetres: number;
  speedKmh: number;
  etaSeconds: number;
  detectionZoneMetres: number;
  state:
    | 'SPAWNED'
    | 'DETECTED'
    | 'PREEMPTION_REQUESTED'
    | 'TRANSITIONING'
    | 'GREEN_GRANTED'
    | 'CROSSING'
    | 'CLEARED';
  detectedTime: number;
  clearedTime?: number;
  delayIncurredSeconds: number;
}

export interface DecisionRecord {
  id: string;
  simTime: number;
  actionType: 'PHASE_SWITCH' | 'EXTENSION' | 'EMERGENCY_PREEMPTION' | 'STARVATION_OVERRIDE' | 'PEDESTRIAN_HOLD';
  selectedApproach: Approach;
  allocatedGreenDuration: number;
  approachScores: Record<Approach, number>;
  primaryReason: string;
  safetyCheckResult: 'VERIFIED_SAFE' | 'CONFLICT_PREVENTED' | 'TRANSITION_ENFORCED';
  metricsBefore: {
    totalQueue: number;
    avgWait: number;
  };
}

export interface SimulationMetrics {
  simTimeSeconds: number;
  activeVehiclesCount: number;
  completedVehiclesCount: number;
  totalWaitingVehicles: number;
  avgWaitingTime: number; // seconds
  maxQueueLength: number; // vehicles
  avgQueueLength: number;
  totalThroughput: number; // vehicles exited
  emergencyDelaySeconds: number;
  emergencyClearedCount: number;
  phaseChangeCount: number;
  safetyRuleViolations: number;
  history: Array<{
    time: number;
    avgWait: number;
    maxQueue: number;
    totalQueue: number;
    throughput: number;
    activeGreen: Approach;
    congestionN: number;
    congestionE: number;
    congestionS: number;
    congestionW: number;
  }>;
}

export interface SimulationSettings {
  minGreenSeconds: number; // default 10
  maxGreenSeconds: number; // default 45
  yellowDurationSeconds: number; // default 3
  allRedDurationSeconds: number; // default 2
  emergencyDetectionDistance: number; // default 160m
  timeScale: number; // 1x, 2x, 4x
  randomSeed: number;
  arrivalRatePerMinute: number; // 20 - 90
  controllerMode: 'adaptive' | 'fixed';
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  category: 'Standard' | 'Emergency' | 'Adverse Weather' | 'Disruption';
  description: string;
  seed: number;
  arrivalRate: number;
  weather: WeatherType;
  incidentApproach: Approach | null;
  emergencyVehicle?: {
    type: 'ambulance' | 'fire_engine' | 'police';
    approach: Approach;
    speedKmh: number;
  };
  approachBias?: Partial<Record<Approach, number>>;
  durationSeconds: number;
}

export interface BenchmarkComparison {
  scenarioId: string;
  scenarioName: string;
  seed: number;
  durationSeconds: number;
  timestamp: string;
  fixed: {
    avgWaitingTime: number;
    maxQueueLength: number;
    avgQueueLength: number;
    throughput: number;
    emergencyDelay: number;
    phaseChanges: number;
    safetyViolations: number;
  };
  adaptive: {
    avgWaitingTime: number;
    maxQueueLength: number;
    avgQueueLength: number;
    throughput: number;
    emergencyDelay: number;
    phaseChanges: number;
    safetyViolations: number;
  };
  delta: {
    avgWaitingTime: number;
    maxQueueLength: number;
    avgQueueLength: number;
    throughput: number;
    emergencyDelay: number;
  };
  percentage: {
    avgWaitingTime: number;
    maxQueueLength: number;
    avgQueueLength: number;
    throughput: number;
    emergencyDelay: number;
  };
}
