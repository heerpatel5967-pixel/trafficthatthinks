import { Approach, TurnDirection } from '../types/traffic';

/**
 * 4-Way Urban Intersection Geometry & Coordinate Mapping
 * Adheres to Indian Left-Hand Traffic (LHT) layout:
 * - Vehicles drive on the left side of the divider.
 * - Multi-lane roads (2 incoming lanes, 2 outgoing lanes per approach).
 * - Central conflict box [-14m, +14m].
 * - Stop lines located 14m before the center of the intersection.
 */
export class IntersectionGeometry {
  public static readonly ROAD_HALF_WIDTH = 8.0; // 16m total road width
  public static readonly LANE_WIDTH = 3.8;
  public static readonly STOP_LINE_OFFSET = 14.0; // metres from junction center
  public static readonly ROAD_SPAWN_DISTANCE = 160.0; // length of each incoming road arm
  public static readonly INTERSECTION_LENGTH = 28.0; // 2 * STOP_LINE_OFFSET
  public static readonly EXIT_DISTANCE = 140.0; // distance after intersection to despawn

  /**
   * Returns lane lateral offset from center divider for Left-Hand Traffic.
   * On incoming side, left lane (outer, left-turn/straight) is further left,
   * right lane (inner, straight/right-turn) is closer to the median divider.
   */
  public static getLaneOffset(laneIndex: number): number {
    // lane 0 is inner (near median): ~1.9m from center
    // lane 1 is outer (curb lane): ~5.7m from center
    return laneIndex === 0 ? 1.9 : 5.7;
  }

  /**
   * Computes 3D world position and heading angle (radians) for a vehicle.
   */
  public static getVehicleWorldTransform(
    approach: Approach,
    laneIndex: number,
    position: number, // 0 (spawn) -> ROAD_SPAWN_DISTANCE (stop line)
    inIntersection: boolean,
    intersectionProgress: number, // 0 -> 1
    turnDirection: TurnDirection
  ): { x: number; y: number; z: number; rotationY: number } {
    const laneOffset = this.getLaneOffset(laneIndex);
    const stopLineDist = this.ROAD_SPAWN_DISTANCE;

    if (!inIntersection) {
      // Vehicle is approaching the intersection stop line
      const distFromStop = stopLineDist - position;
      const distFromCenter = this.STOP_LINE_OFFSET + Math.max(0, distFromStop);

      switch (approach) {
        case 'North':
          // Coming from +Z towards -Z. Driving on LEFT side: in LHT, left side is +X
          return {
            x: laneOffset,
            y: 0,
            z: distFromCenter,
            rotationY: Math.PI, // Facing South (-Z)
          };

        case 'South':
          // Coming from -Z towards +Z. Driving on LEFT side: left side is -X
          return {
            x: -laneOffset,
            y: 0,
            z: -distFromCenter,
            rotationY: 0, // Facing North (+Z)
          };

        case 'East':
          // Coming from +X towards -X. Driving on LEFT side: left side is -Z
          return {
            x: distFromCenter,
            y: 0,
            z: -laneOffset,
            rotationY: Math.PI * 0.5, // Facing West (-X)
          };

        case 'West':
          // Coming from -X towards +X. Driving on LEFT side: left side is +Z
          return {
            x: -distFromCenter,
            y: 0,
            z: laneOffset,
            rotationY: -Math.PI * 0.5, // Facing East (+X)
          };
      }
    } else {
      // Vehicle is inside the intersection or exiting
      const progress = Math.min(1.0, Math.max(0, intersectionProgress));

      // Straight trajectory
      if (turnDirection === 'straight') {
        const offset = (progress - 0.5) * this.INTERSECTION_LENGTH * 2;
        switch (approach) {
          case 'North':
            return {
              x: laneOffset,
              y: 0,
              z: this.STOP_LINE_OFFSET - progress * (this.STOP_LINE_OFFSET * 2 + 100),
              rotationY: Math.PI,
            };
          case 'South':
            return {
              x: -laneOffset,
              y: 0,
              z: -this.STOP_LINE_OFFSET + progress * (this.STOP_LINE_OFFSET * 2 + 100),
              rotationY: 0,
            };
          case 'East':
            return {
              x: this.STOP_LINE_OFFSET - progress * (this.STOP_LINE_OFFSET * 2 + 100),
              y: 0,
              z: -laneOffset,
              rotationY: Math.PI * 0.5,
            };
          case 'West':
            return {
              x: -this.STOP_LINE_OFFSET + progress * (this.STOP_LINE_OFFSET * 2 + 100),
              y: 0,
              z: laneOffset,
              rotationY: -Math.PI * 0.5,
            };
        }
      }

      // Left Turn (Free/smooth curve in LHT)
      if (turnDirection === 'left') {
        const angle = (progress * Math.PI) / 2;
        switch (approach) {
          case 'North': // Turning East (+X)
            return {
              x: laneOffset + progress * 80,
              y: 0,
              z: this.STOP_LINE_OFFSET - progress * 25,
              rotationY: Math.PI - angle,
            };
          case 'South': // Turning West (-X)
            return {
              x: -laneOffset - progress * 80,
              y: 0,
              z: -this.STOP_LINE_OFFSET + progress * 25,
              rotationY: -angle,
            };
          case 'East': // Turning South (-Z)
            return {
              x: this.STOP_LINE_OFFSET - progress * 25,
              y: 0,
              z: -laneOffset - progress * 80,
              rotationY: Math.PI * 0.5 - angle,
            };
          case 'West': // Turning North (+Z)
            return {
              x: -this.STOP_LINE_OFFSET + progress * 25,
              y: 0,
              z: laneOffset + progress * 80,
              rotationY: -Math.PI * 0.5 - angle,
            };
        }
      }

      // Right Turn (Crossing junction in LHT)
      const angle = (progress * Math.PI) / 2;
      switch (approach) {
        case 'North': // Turning West (-X)
          return {
            x: laneOffset - progress * 80,
            y: 0,
            z: this.STOP_LINE_OFFSET - progress * 30,
            rotationY: Math.PI + angle,
          };
        case 'South': // Turning East (+X)
          return {
            x: -laneOffset + progress * 80,
            y: 0,
            z: -this.STOP_LINE_OFFSET + progress * 30,
            rotationY: angle,
          };
        case 'East': // Turning North (+Z)
          return {
            x: this.STOP_LINE_OFFSET - progress * 30,
            y: 0,
            z: -laneOffset + progress * 80,
            rotationY: Math.PI * 0.5 + angle,
          };
        case 'West': // Turning South (-Z)
          return {
            x: -this.STOP_LINE_OFFSET + progress * 30,
            y: 0,
            z: laneOffset - progress * 80,
            rotationY: -Math.PI * 0.5 + angle,
          };
      }
    }
  }
}
