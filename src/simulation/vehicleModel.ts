import { Approach, LightColor, TurnDirection, Vehicle, VehicleType } from '../types/traffic';
import { IntersectionGeometry } from './intersection';
import { SeededRandom } from './seededRandom';

export interface VehiclePhysicsConfig {
  desiredSpeed: number; // m/s
  maxAcceleration: number; // m/s^2
  comfortableDeceleration: number; // m/s^2
  minGap: number; // metres (s0)
  timeHeadway: number; // seconds (T)
  length: number;
  width: number;
}

export class VehicleModel {
  public static readonly STOP_LINE_POSITION = IntersectionGeometry.ROAD_SPAWN_DISTANCE;

  public static getPhysicsConfig(type: VehicleType): VehiclePhysicsConfig {
    switch (type) {
      case 'bus':
        return {
          desiredSpeed: 11.1, // 40 km/h
          maxAcceleration: 1.6,
          comfortableDeceleration: 2.0,
          minGap: 2.5,
          timeHeadway: 1.8,
          length: 10.5,
          width: 2.6,
        };
      case 'truck':
        return {
          desiredSpeed: 10.0, // 36 km/h
          maxAcceleration: 1.4,
          comfortableDeceleration: 1.8,
          minGap: 3.0,
          timeHeadway: 2.0,
          length: 9.0,
          width: 2.5,
        };
      case 'two_wheeler':
        return {
          desiredSpeed: 14.5, // 52 km/h
          maxAcceleration: 3.2,
          comfortableDeceleration: 3.5,
          minGap: 1.2,
          timeHeadway: 1.0,
          length: 2.0,
          width: 1.0,
        };
      case 'auto_rickshaw':
        return {
          desiredSpeed: 11.5, // 42 km/h
          maxAcceleration: 2.2,
          comfortableDeceleration: 2.5,
          minGap: 1.5,
          timeHeadway: 1.3,
          length: 2.8,
          width: 1.4,
        };
      case 'ambulance':
        return {
          desiredSpeed: 18.0, // 65 km/h
          maxAcceleration: 3.5,
          comfortableDeceleration: 4.0,
          minGap: 2.0,
          timeHeadway: 1.1,
          length: 5.5,
          width: 2.2,
        };
      case 'fire_engine':
        return {
          desiredSpeed: 16.0, // 58 km/h
          maxAcceleration: 2.8,
          comfortableDeceleration: 3.2,
          minGap: 2.5,
          timeHeadway: 1.3,
          length: 9.5,
          width: 2.6,
        };
      case 'police':
        return {
          desiredSpeed: 19.0, // 68 km/h
          maxAcceleration: 3.6,
          comfortableDeceleration: 4.0,
          minGap: 1.8,
          timeHeadway: 1.1,
          length: 4.6,
          width: 2.0,
        };
      case 'car':
      default:
        return {
          desiredSpeed: 13.8, // 50 km/h
          maxAcceleration: 2.5,
          comfortableDeceleration: 2.8,
          minGap: 2.0,
          timeHeadway: 1.4,
          length: 4.4,
          width: 2.0,
        };
    }
  }

  public static createVehicle(
    id: string,
    type: VehicleType,
    approach: Approach,
    laneIndex: number,
    rng: SeededRandom,
    speedModifier: number = 1.0
  ): Vehicle {
    const config = this.getPhysicsConfig(type);
    const isEmergency = type === 'ambulance' || type === 'fire_engine' || type === 'police';

    let color = '#38bdf8'; // cyan car
    if (type === 'car') {
      const carColors = ['#e2e8f0', '#0284c7', '#3b82f6', '#475569', '#f8fafc', '#dc2626'];
      color = rng.choice(carColors);
    } else if (type === 'bus') {
      color = '#eab308'; // Indian city bus yellow/amber
    } else if (type === 'truck') {
      color = '#f97316'; // orange cargo
    } else if (type === 'auto_rickshaw') {
      color = '#10b981'; // Green-yellow CNG auto
    } else if (type === 'two_wheeler') {
      color = '#a855f7'; // purple bike
    } else if (type === 'ambulance') {
      color = '#ef4444'; // white/red ambulance
    } else if (type === 'fire_engine') {
      color = '#dc2626'; // intense red
    } else if (type === 'police') {
      color = '#2563eb'; // blue
    }

    // Determine turn direction: outer lane (1) can turn left or straight, inner (0) straight or right
    let turnDirection: TurnDirection = 'straight';
    const turnRoll = rng.next();
    if (laneIndex === 1 && turnRoll < 0.35) {
      turnDirection = 'left';
    } else if (laneIndex === 0 && turnRoll < 0.3) {
      turnDirection = 'right';
    }

    const desiredSpeed = config.desiredSpeed * speedModifier;

    return {
      id,
      type,
      approach,
      laneIndex,
      position: 0,
      distanceToStopLine: this.STOP_LINE_POSITION,
      speed: desiredSpeed * 0.8,
      maxSpeed: desiredSpeed,
      acceleration: 0,
      length: config.length,
      width: config.width,
      color,
      isEmergency,
      emergencyType: isEmergency ? (type as any) : undefined,
      turnDirection,
      inIntersection: false,
      intersectionProgress: 0,
      hasExited: false,
      waitingTime: 0,
      travelTime: 0,
      stopped: false,
      detectedBySensor: false,
    };
  }

  /**
   * Updates vehicle kinematics using the Intelligent Driver Model (IDM).
   */
  public static updateKinematics(
    vehicle: Vehicle,
    leader: Vehicle | null,
    lightColor: LightColor,
    dt: number,
    speedFactor: number = 1.0
  ): void {
    if (vehicle.hasExited) return;

    vehicle.travelTime += dt;
    const config = this.getPhysicsConfig(vehicle.type);
    const v0 = vehicle.maxSpeed * speedFactor;
    const v = vehicle.speed;
    const aMax = config.maxAcceleration;
    const b = config.comfortableDeceleration;
    const s0 = config.minGap;
    const T = config.timeHeadway;

    // Check if stop line acts as virtual obstacle
    let virtualLeaderGap = Infinity;
    let virtualLeaderSpeed = 0;

    const distToStopLine = this.STOP_LINE_POSITION - vehicle.position;
    vehicle.distanceToStopLine = distToStopLine;

    if (!vehicle.inIntersection) {
      if (distToStopLine > 0) {
        // Upstream of stop line
        if (lightColor === 'RED') {
          virtualLeaderGap = Math.max(0.1, distToStopLine - 1.0);
          virtualLeaderSpeed = 0;
        } else if (lightColor === 'YELLOW') {
          // Can vehicle stop safely before stop line?
          const stoppingDist = (v * v) / (2 * b);
          if (distToStopLine > stoppingDist + 2.0) {
            virtualLeaderGap = Math.max(0.1, distToStopLine - 1.0);
            virtualLeaderSpeed = 0;
          }
          // Otherwise, committed to crossing yellow clearance
        }
      } else {
        // Crossed stop line into intersection
        vehicle.inIntersection = true;
      }
    }

    // Determine actual effective leader (real vehicle ahead OR stop line)
    let effectiveGap = Infinity;
    let deltaV = 0;

    if (leader && !leader.hasExited) {
      const leaderFront = leader.position;
      const leaderBack = leaderFront - leader.length;
      const physicalGap = Math.max(0.1, leaderBack - vehicle.position);
      effectiveGap = physicalGap;
      deltaV = v - leader.speed;
    }

    if (virtualLeaderGap < effectiveGap) {
      effectiveGap = virtualLeaderGap;
      deltaV = v - virtualLeaderSpeed;
    }

    // IDM acceleration formula
    let desiredGap = s0 + v * T;
    if (deltaV !== 0) {
      desiredGap += (v * deltaV) / (2 * Math.sqrt(aMax * b));
    }
    desiredGap = Math.max(s0, desiredGap);

    const freeRoadTerm = 1 - Math.pow(v / Math.max(0.1, v0), 4);
    const interactionTerm = Math.pow(desiredGap / Math.max(0.1, effectiveGap), 2);
    let accel = aMax * (freeRoadTerm - interactionTerm);

    // Clamp acceleration within realistic physical bounds
    accel = Math.max(-b * 2.5, Math.min(aMax, accel));
    vehicle.acceleration = accel;

    // Integrate speed
    let newSpeed = v + accel * dt;
    newSpeed = Math.max(0, Math.min(v0 * 1.1, newSpeed));
    vehicle.speed = newSpeed;

    // Advance position
    const distanceMoved = newSpeed * dt;
    vehicle.position += distanceMoved;

    // Track stopped state and waiting duration
    if (newSpeed < 0.6 && !vehicle.inIntersection) {
      vehicle.stopped = true;
      vehicle.waitingTime += dt;
    } else {
      vehicle.stopped = false;
    }

    // Advance intersection progress if inside
    if (vehicle.inIntersection) {
      const intersectionSpan = IntersectionGeometry.INTERSECTION_LENGTH * 2.5;
      vehicle.intersectionProgress += distanceMoved / intersectionSpan;
      if (vehicle.intersectionProgress >= 1.0) {
        vehicle.hasExited = true;
      }
    }
  }
}
