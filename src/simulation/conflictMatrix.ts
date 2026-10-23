import { Approach, LightColor, PhaseId } from '../types/traffic';

/**
 * Strict 4-Way Signal Conflict Matrix & Safety Invariants
 *
 * Rule: Only one approach can possess non-red (GREEN or YELLOW) at any instant.
 * All other approaches MUST be RED.
 * During ALL_RED_CLEARANCE, every approach is RED.
 */
export class ConflictMatrix {
  public static readonly APPROACH_TO_PHASE: Record<Approach, PhaseId> = {
    North: 'Phase_N',
    East: 'Phase_E',
    South: 'Phase_S',
    West: 'Phase_W',
  };

  public static readonly PHASE_TO_APPROACH: Record<PhaseId, Approach> = {
    Phase_N: 'North',
    Phase_E: 'East',
    Phase_S: 'South',
    Phase_W: 'West',
  };

  /**
   * Validates whether a given signal state satisfies the fundamental traffic invariant:
   * 1. At most one approach may be GREEN or YELLOW.
   * 2. If one approach is GREEN or YELLOW, all other 3 approaches MUST be RED.
   * 3. No conflicting movements permitted under any circumstances.
   */
  public static validate(lights: Record<Approach, LightColor>): {
    valid: boolean;
    activeApproach: Approach | null;
    violation?: string;
  } {
    const approaches: Approach[] = ['North', 'East', 'South', 'West'];
    const activeNonRed = approaches.filter(
      (app) => lights[app] === 'GREEN' || lights[app] === 'YELLOW'
    );

    if (activeNonRed.length > 1) {
      return {
        valid: false,
        activeApproach: null,
        violation: `CRITICAL INVARIANT VIOLATION: Simultaneous non-red signals detected on [${activeNonRed.join(', ')}]! Conflicting traffic hazard.`,
      };
    }

    if (activeNonRed.length === 1) {
      const active = activeNonRed[0];
      const others = approaches.filter((a) => a !== active);
      const invalidOthers = others.filter((a) => lights[a] !== 'RED');
      if (invalidOthers.length > 0) {
        return {
          valid: false,
          activeApproach: active,
          violation: `Approach ${active} is ${lights[active]}, but [${invalidOthers.join(', ')}] are not RED!`,
        };
      }
      return { valid: true, activeApproach: active };
    }

    // All red (clearance interval)
    return { valid: true, activeApproach: null };
  }

  /**
   * Check if two approaches conflict with each other.
   * In our strict 4-phase safety design, any two distinct approaches conflict.
   */
  public static areApproachesConflicting(a: Approach, b: Approach): boolean {
    return a !== b;
  }
}
