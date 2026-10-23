import * as THREE from 'three';
import { TurnDirection, Vehicle, VehicleType } from '../types/traffic';
import { IntersectionGeometry } from '../simulation/intersection';

export class VehicleMeshFactory {
  // Shared materials & geometries for maximum performance
  private static wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
  private static wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
  private static headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  private static taillightMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });

  public static createVehicleMesh(vehicle: Vehicle): THREE.Group {
    const group = new THREE.Group();
    group.name = vehicle.id;

    const baseColor = new THREE.Color(vehicle.color);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.3,
      metalness: 0.2,
    });

    switch (vehicle.type) {
      case 'bus':
        this.buildBus(group, bodyMat);
        break;
      case 'truck':
        this.buildTruck(group, bodyMat);
        break;
      case 'auto_rickshaw':
        this.buildAutoRickshaw(group);
        break;
      case 'two_wheeler':
        this.buildTwoWheeler(group, bodyMat);
        break;
      case 'ambulance':
        this.buildAmbulance(group);
        break;
      case 'fire_engine':
        this.buildFireEngine(group);
        break;
      case 'police':
        this.buildPolice(group);
        break;
      case 'car':
      default:
        this.buildCar(group, bodyMat);
        break;
    }

    return group;
  }

  private static buildCar(group: THREE.Group, bodyMat: THREE.Material): void {
    // Lower chassis
    const chassisGeo = new THREE.BoxGeometry(2.0, 0.65, 4.2);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    group.add(chassis);

    // Cabin / roof
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.55, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.05, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const hlL = new THREE.Mesh(hlGeo, this.headlightMat);
    hlL.position.set(-0.65, 0.55, -2.1);
    const hlR = new THREE.Mesh(hlGeo, this.headlightMat);
    hlR.position.set(0.65, 0.55, -2.1);
    group.add(hlL, hlR);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const tlL = new THREE.Mesh(tlGeo, this.taillightMat);
    tlL.position.set(-0.65, 0.55, 2.1);
    const tlR = new THREE.Mesh(tlGeo, this.taillightMat);
    tlR.position.set(0.65, 0.55, 2.1);
    group.add(tlL, tlR);
  }

  private static buildBus(group: THREE.Group, bodyMat: THREE.Material): void {
    const busGeo = new THREE.BoxGeometry(2.6, 2.6, 9.8);
    const busMesh = new THREE.Mesh(busGeo, bodyMat);
    busMesh.position.y = 1.6;
    busMesh.castShadow = true;
    group.add(busMesh);

    // Windows band
    const winMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1 });
    const winGeo = new THREE.BoxGeometry(2.62, 0.9, 8.8);
    const winMesh = new THREE.Mesh(winGeo, winMat);
    winMesh.position.y = 1.9;
    group.add(winMesh);
  }

  private static buildTruck(group: THREE.Group, bodyMat: THREE.Material): void {
    // Cab
    const cabGeo = new THREE.BoxGeometry(2.4, 2.2, 2.6);
    const cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(0, 1.4, -2.6);
    cab.castShadow = true;
    group.add(cab);

    // Cargo Container
    const contMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const contGeo = new THREE.BoxGeometry(2.5, 2.6, 5.8);
    const cont = new THREE.Mesh(contGeo, contMat);
    cont.position.set(0, 1.7, 1.3);
    cont.castShadow = true;
    group.add(cont);
  }

  private static buildAutoRickshaw(group: THREE.Group): void {
    // Distinct Indian Auto-rickshaw (Yellow top, green lower body)
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });

    const lowerGeo = new THREE.BoxGeometry(1.4, 0.7, 2.6);
    const lower = new THREE.Mesh(lowerGeo, greenMat);
    lower.position.y = 0.55;
    lower.castShadow = true;
    group.add(lower);

    const canopyGeo = new THREE.BoxGeometry(1.35, 0.8, 2.0);
    const canopy = new THREE.Mesh(canopyGeo, yellowMat);
    canopy.position.set(0, 1.25, 0.2);
    canopy.castShadow = true;
    group.add(canopy);
  }

  private static buildTwoWheeler(group: THREE.Group, bodyMat: THREE.Material): void {
    // Scooter / Motorcycle
    const frameGeo = new THREE.BoxGeometry(0.5, 0.8, 1.8);
    const frame = new THREE.Mesh(frameGeo, bodyMat);
    frame.position.y = 0.6;
    frame.castShadow = true;
    group.add(frame);

    // Rider silhouette
    const riderMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const riderGeo = new THREE.BoxGeometry(0.55, 0.9, 0.55);
    const rider = new THREE.Mesh(riderGeo, riderMat);
    rider.position.set(0, 1.25, -0.1);
    group.add(rider);
  }

  private static buildAmbulance(group: THREE.Group): void {
    // White body
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const bodyGeo = new THREE.BoxGeometry(2.2, 1.8, 5.2);
    const body = new THREE.Mesh(bodyGeo, whiteMat);
    body.position.y = 1.15;
    body.castShadow = true;
    group.add(body);

    // Red emergency cross / stripe
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const stripeGeo = new THREE.BoxGeometry(2.22, 0.35, 4.8);
    const stripe = new THREE.Mesh(stripeGeo, redMat);
    stripe.position.y = 1.15;
    group.add(stripe);

    // Emergency Flashing Beacon Lights (Red & Blue)
    const beaconGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 8);
    const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const blueLightMat = new THREE.MeshBasicMaterial({ color: 0x0066ff });

    const beaconL = new THREE.Mesh(beaconGeo, redLightMat);
    beaconL.position.set(-0.45, 2.2, -0.6);
    beaconL.name = 'beacon_red';

    const beaconR = new THREE.Mesh(beaconGeo, blueLightMat);
    beaconR.position.set(0.45, 2.2, -0.6);
    beaconR.name = 'beacon_blue';

    group.add(beaconL, beaconR);
  }

  private static buildFireEngine(group: THREE.Group): void {
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const bodyGeo = new THREE.BoxGeometry(2.6, 2.4, 9.0);
    const body = new THREE.Mesh(bodyGeo, redMat);
    body.position.y = 1.5;
    body.castShadow = true;
    group.add(body);

    // Silver ladder on top
    const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const ladderGeo = new THREE.BoxGeometry(1.2, 0.15, 7.5);
    const ladder = new THREE.Mesh(ladderGeo, silverMat);
    ladder.position.set(0, 2.8, 0);
    group.add(ladder);

    // Rooftop emergency strobe
    const strobeMat = new THREE.MeshBasicMaterial({ color: 0xff1100 });
    const strobeGeo = new THREE.BoxGeometry(1.6, 0.25, 0.4);
    const strobe = new THREE.Mesh(strobeGeo, strobeMat);
    strobe.position.set(0, 2.85, -3.2);
    strobe.name = 'beacon_fire';
    group.add(strobe);
  }

  private static buildPolice(group: THREE.Group): void {
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const chassisGeo = new THREE.BoxGeometry(2.0, 0.65, 4.4);
    const chassis = new THREE.Mesh(chassisGeo, blackMat);
    chassis.position.y = 0.55;
    group.add(chassis);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.55, 2.4);
    const cabin = new THREE.Mesh(cabinGeo, whiteMat);
    cabin.position.set(0, 1.05, -0.2);
    group.add(cabin);

    // Police lightbar
    const barGeo = new THREE.BoxGeometry(1.2, 0.15, 0.25);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 1.45, -0.2);
    bar.name = 'beacon_police';
    group.add(bar);
  }

  /**
   * Updates mesh transform from vehicle simulation data.
   */
  public static updateMeshTransform(group: THREE.Group, vehicle: Vehicle, simTime: number): void {
    const transform = IntersectionGeometry.getVehicleWorldTransform(
      vehicle.approach,
      vehicle.laneIndex,
      vehicle.position,
      vehicle.inIntersection,
      vehicle.intersectionProgress,
      vehicle.turnDirection
    );

    group.position.set(transform.x, transform.y, transform.z);
    group.rotation.y = transform.rotationY;

    // Animate emergency beacons if emergency vehicle
    if (vehicle.isEmergency) {
      const flash = Math.sin(simTime * 15) > 0;
      const redBeacon = group.getObjectByName('beacon_red') as THREE.Mesh;
      const blueBeacon = group.getObjectByName('beacon_blue') as THREE.Mesh;
      if (redBeacon && blueBeacon) {
        redBeacon.visible = flash;
        blueBeacon.visible = !flash;
      }

      const fireBeacon = group.getObjectByName('beacon_fire') as THREE.Mesh;
      if (fireBeacon) {
        fireBeacon.visible = Math.sin(simTime * 18) > 0;
      }

      const policeBar = group.getObjectByName('beacon_police') as THREE.Mesh;
      if (policeBar) {
        policeBar.visible = Math.sin(simTime * 20) > 0;
      }
    }
  }
}
