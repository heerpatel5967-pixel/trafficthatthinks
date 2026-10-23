import { Approach, EmergencyMission, Vehicle } from '../types/traffic';

export class EmergencyDetectionSystem {
  private activeMissions: Map<string, EmergencyMission> = new Map();
  private detectionThresholdMetres: number = 150.0;
  private onEmergencyDetected?: (mission: EmergencyMission) => void;
  private onEmergencyCleared?: (mission: EmergencyMission) => void;

  constructor(
    detectionThreshold: number = 150.0,
    callbacks?: {
      onDetected?: (m: EmergencyMission) => void;
      onCleared?: (m: EmergencyMission) => void;
    }
  ) {
    this.detectionThresholdMetres = detectionThreshold;
    this.onEmergencyDetected = callbacks?.onDetected;
    this.onEmergencyCleared = callbacks?.onCleared;
  }

  public setDetectionDistance(distance: number): void {
    this.detectionThresholdMetres = Math.max(50, Math.min(250, distance));
  }

  public getDetectionDistance(): number {
    return this.detectionThresholdMetres;
  }

  public getActiveMissions(): EmergencyMission[] {
    return Array.from(this.activeMissions.values());
  }

  public getPrimaryPriorityMission(): EmergencyMission | null {
    const list = Array.from(this.activeMissions.values()).filter(
      (m) => m.state !== 'CLEARED'
    );
    if (list.length === 0) return null;

    // Rank by priority tier: ambulance > fire_engine > police, then by ETA
    const rankTier = (type: string) => {
      if (type === 'ambulance') return 1;
      if (type === 'fire_engine') return 2;
      return 3;
    };

    list.sort((a, b) => {
      const tierDiff = rankTier(a.type) - rankTier(b.type);
      if (tierDiff !== 0) return tierDiff;
      return a.etaSeconds - b.etaSeconds;
    });

    return list[0];
  }

  public scanVehicles(vehicles: Vehicle[], simTime: number): EmergencyMission | null {
    for (const vehicle of vehicles) {
      if (!vehicle.isEmergency || vehicle.hasExited) continue;

      const dist = Math.max(0, vehicle.distanceToStopLine);
      const speedKmh = vehicle.speed * 3.6;
      const speedSafe = Math.max(1.0, vehicle.speed);
      const eta = dist / speedSafe;

      let mission = this.activeMissions.get(vehicle.id);

      // Check detection trigger
      if (!mission && dist <= this.detectionThresholdMetres) {
        mission = {
          id: vehicle.id,
          type: (vehicle.emergencyType || 'ambulance') as any,
          approach: vehicle.approach,
          distanceMetres: dist,
          speedKmh,
          etaSeconds: eta,
          detectionZoneMetres: this.detectionThresholdMetres,
          state: 'DETECTED',
          detectedTime: simTime,
          delayIncurredSeconds: 0,
        };
        vehicle.detectedBySensor = true;
        vehicle.detectionTimestamp = simTime;
        this.activeMissions.set(vehicle.id, mission);

        if (this.onEmergencyDetected) {
          this.onEmergencyDetected(mission);
        }
      }

      if (mission) {
        mission.distanceMetres = dist;
        mission.speedKmh = speedKmh;
        mission.etaSeconds = eta;
        mission.delayIncurredSeconds = vehicle.waitingTime;

        // Update states
        if (vehicle.inIntersection && mission.state !== 'CROSSING' && mission.state !== 'CLEARED') {
          mission.state = 'CROSSING';
        }
      }
    }

    // Check clearances
    for (const [id, mission] of this.activeMissions.entries()) {
      const v = vehicles.find((veh) => veh.id === id);
      if (!v || v.hasExited) {
        if (mission.state !== 'CLEARED') {
          mission.state = 'CLEARED';
          mission.clearedTime = simTime;
          if (this.onEmergencyCleared) {
            this.onEmergencyCleared(mission);
          }
        }
      }
    }

    return this.getPrimaryPriorityMission();
  }

  public removeMission(vehicleId: string): void {
    this.activeMissions.delete(vehicleId);
  }

  public clearAll(): void {
    this.activeMissions.clear();
  }
}
