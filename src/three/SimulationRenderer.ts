import * as THREE from 'three';
import { Approach, LightColor, SignalState, Vehicle } from '../types/traffic';
import { SimulationEngine } from '../simulation/engine';
import { IntersectionGeometry } from '../simulation/intersection';
import { VehicleMeshFactory } from './VehicleMeshes';

export type CameraPreset = 'isometric' | 'topdown' | 'approach' | 'chase';

export class SimulationRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private engine: SimulationEngine;
  private animFrameId: number | null = null;
  private isDisposed: boolean = false;

  // Vehicle meshes map: vehicle.id -> THREE.Group
  private vehicleMeshes: Map<string, THREE.Group> = new Map();

  // Traffic signal light meshes: approach -> { red, yellow, green }
  private signalLamps: Record<Approach, { red: THREE.Mesh; yellow: THREE.Mesh; green: THREE.Mesh }>;

  // Upstream detection radar rings
  private detectionRings: Record<Approach, THREE.Mesh>;

  // Emergency corridor glow mesh
  private emergencyCorridorMesh: THREE.Mesh;

  // Rain particle system
  private rainPoints: THREE.Points;

  // Camera preset & orbit controls
  private cameraPreset: CameraPreset = 'isometric';
  private targetPosition = new THREE.Vector3(55, 65, 55);
  private targetLookAt = new THREE.Vector3(0, 0, 0);
  private currentLookAt = new THREE.Vector3(0, 0, 0);

  // Mouse orbit state
  private isDragging = false;
  private prevMouseX = 0;
  private prevMouseY = 0;
  private spherical = { radius: 95, theta: Math.PI / 4, phi: Math.PI / 3 };

  constructor(container: HTMLElement, engine: SimulationEngine) {
    this.container = container;
    this.engine = engine;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b14);
    this.scene.fog = new THREE.FogExp2(0x070b14, 0.005);

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    this.camera.position.set(55, 65, 55);
    this.camera.lookAt(0, 0, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLighting();

    // 5. Environment & Roads
    this.buildGroundAndRoads();
    this.buildSurroundingBuildings();

    // 6. Signal Heads
    this.signalLamps = this.buildTrafficSignalPoles();

    // 7. Detection Rings & Radar
    this.detectionRings = this.buildDetectionZones();

    // 8. Emergency Corridor Mesh
    this.emergencyCorridorMesh = this.buildEmergencyCorridorMesh();

    // 9. Rain Particle System
    this.rainPoints = this.buildRainSystem();

    // 10. Mouse interaction handlers
    this.setupMouseEvents();

    // 11. Resize observer
    window.addEventListener('resize', this.onWindowResize);

    // 12. Start render loop
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa5f3fc, 1.8);
    dirLight.position.set(60, 100, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    const d = 90;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Accent junction ground point lights
    const junctionLight = new THREE.PointLight(0x00f2fe, 1.2, 50);
    junctionLight.position.set(0, 12, 0);
    this.scene.add(junctionLight);
  }

  private buildGroundAndRoads(): void {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(350, 350);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090e1a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid helper subtle
    const grid = new THREE.GridHelper(300, 60, 0x1e293b, 0x0f172a);
    grid.position.y = -0.04;
    this.scene.add(grid);

    // Asphalt Road Cross (16m wide, 300m long)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x131a29,
      roughness: 0.65,
      metalness: 0.05,
    });

    // NS Road
    const nsRoadGeo = new THREE.PlaneGeometry(16, 300);
    const nsRoad = new THREE.Mesh(nsRoadGeo, roadMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.receiveShadow = true;
    this.scene.add(nsRoad);

    // EW Road
    const ewRoadGeo = new THREE.PlaneGeometry(300, 16);
    const ewRoad = new THREE.Mesh(ewRoadGeo, roadMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.receiveShadow = true;
    this.scene.add(ewRoad);

    // Markings: Stop lines, medians, dashed lane lines, zebra crossings
    this.buildRoadMarkings();
  }

  private buildRoadMarkings(): void {
    const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });

    // Double yellow center divider lines (outside the 28m intersection box)
    const lineThickness = 0.22;
    const dividerLength = 135;

    // North & South medians
    const nMedian = new THREE.Mesh(new THREE.PlaneGeometry(lineThickness, dividerLength), yellowMat);
    nMedian.rotation.x = -Math.PI / 2;
    nMedian.position.set(0, 0.02, 14 + dividerLength / 2);
    const sMedian = new THREE.Mesh(new THREE.PlaneGeometry(lineThickness, dividerLength), yellowMat);
    sMedian.rotation.x = -Math.PI / 2;
    sMedian.position.set(0, 0.02, -(14 + dividerLength / 2));
    this.scene.add(nMedian, sMedian);

    // East & West medians
    const eMedian = new THREE.Mesh(new THREE.PlaneGeometry(dividerLength, lineThickness), yellowMat);
    eMedian.rotation.x = -Math.PI / 2;
    eMedian.position.set(14 + dividerLength / 2, 0.02, 0);
    const wMedian = new THREE.Mesh(new THREE.PlaneGeometry(dividerLength, lineThickness), yellowMat);
    wMedian.rotation.x = -Math.PI / 2;
    wMedian.position.set(-(14 + dividerLength / 2), 0.02, 0);
    this.scene.add(eMedian, wMedian);

    // Stop Lines (at 14m from center across incoming lanes)
    const stopLineWidth = 8.0;
    const stopLineThickness = 0.7;

    // North stop line (on left side: x: 0 to 8)
    const nStop = new THREE.Mesh(new THREE.PlaneGeometry(stopLineWidth, stopLineThickness), whiteMat);
    nStop.rotation.x = -Math.PI / 2;
    nStop.position.set(4, 0.03, 14);

    // South stop line (on left side: x: -8 to 0)
    const sStop = new THREE.Mesh(new THREE.PlaneGeometry(stopLineWidth, stopLineThickness), whiteMat);
    sStop.rotation.x = -Math.PI / 2;
    sStop.position.set(-4, 0.03, -14);

    // East stop line (on left side: z: -8 to 0)
    const eStop = new THREE.Mesh(new THREE.PlaneGeometry(stopLineThickness, stopLineWidth), whiteMat);
    eStop.rotation.x = -Math.PI / 2;
    eStop.position.set(14, 0.03, -4);

    // West stop line (on left side: z: 0 to 8)
    const wStop = new THREE.Mesh(new THREE.PlaneGeometry(stopLineThickness, stopLineWidth), whiteMat);
    wStop.rotation.x = -Math.PI / 2;
    wStop.position.set(-14, 0.03, 4);

    this.scene.add(nStop, sStop, eStop, wStop);

    // Zebra Crossings (pedestrian stripes at each approach)
    this.buildZebraCrossing(0, 16.5, 'horizontal');
    this.buildZebraCrossing(0, -16.5, 'horizontal');
    this.buildZebraCrossing(16.5, 0, 'vertical');
    this.buildZebraCrossing(-16.5, 0, 'vertical');
  }

  private buildZebraCrossing(centerX: number, centerZ: number, orientation: 'horizontal' | 'vertical'): void {
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const stripesCount = 8;
    const stripeWidth = 1.0;
    const stripeLength = 3.2;

    for (let i = 0; i < stripesCount; i++) {
      const offset = (i - (stripesCount - 1) / 2) * 1.8;
      if (orientation === 'horizontal') {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeWidth, stripeLength), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(centerX + offset, 0.025, centerZ);
        this.scene.add(stripe);
      } else {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeLength, stripeWidth), stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(centerX, 0.025, centerZ + offset);
        this.scene.add(stripe);
      }
    }
  }

  private buildSurroundingBuildings(): void {
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x111c33,
      roughness: 0.3,
      metalness: 0.5,
    });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });

    const cornerOffsets = [
      { x: 38, z: 38 },
      { x: -38, z: 38 },
      { x: 38, z: -38 },
      { x: -38, z: -38 },
      { x: 75, z: 42 },
      { x: -75, z: 42 },
      { x: 42, z: 75 },
      { x: -42, z: 75 },
    ];

    cornerOffsets.forEach((pos, idx) => {
      const height = 25 + (idx % 4) * 18;
      const width = 24 + (idx % 3) * 6;
      const bGeo = new THREE.BoxGeometry(width, height, width);
      const bMesh = new THREE.Mesh(bGeo, buildingMat);
      bMesh.position.set(pos.x, height / 2, pos.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.scene.add(bMesh);

      // Glowing decorative accent bands
      const accentGeo = new THREE.BoxGeometry(width + 0.2, 0.4, width + 0.2);
      const accent = new THREE.Mesh(accentGeo, windowMat);
      accent.position.set(pos.x, height * 0.75, pos.z);
      this.scene.add(accent);
    });
  }

  private buildTrafficSignalPoles(): Record<
    Approach,
    { red: THREE.Mesh; yellow: THREE.Mesh; green: THREE.Mesh }
  > {
    const poles: Record<Approach, { red: THREE.Mesh; yellow: THREE.Mesh; green: THREE.Mesh }> = {} as any;

    const configs: Array<{ app: Approach; x: number; z: number; rotY: number }> = [
      { app: 'North', x: 8.8, z: 14.5, rotY: 0 },
      { app: 'South', x: -8.8, z: -14.5, rotY: Math.PI },
      { app: 'East', x: 14.5, z: -8.8, rotY: -Math.PI / 2 },
      { app: 'West', x: -14.5, z: 8.8, rotY: Math.PI / 2 },
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    for (const c of configs) {
      const group = new THREE.Group();
      group.position.set(c.x, 0, c.z);
      group.rotation.y = c.rotY;

      // Vertical Pole (8m tall)
      const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 8, 12);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 4;
      group.add(pole);

      // Horizontal Arm (mast) extending towards lane
      const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 8);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(-2.2, 7.5, 0);
      group.add(arm);

      // Signal Head Housing
      const headGeo = new THREE.BoxGeometry(0.8, 2.2, 0.6);
      const head = new THREE.Mesh(headGeo, housingMat);
      head.position.set(-3.8, 6.8, 0);
      group.add(head);

      // Red, Yellow, Green Circular Lenses
      const lensGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16);
      lensGeo.rotateX(Math.PI / 2);

      const redMat = new THREE.MeshStandardMaterial({
        color: 0x330000,
        emissive: 0xff0000,
        emissiveIntensity: 0.1,
      });
      const yellowMat = new THREE.MeshStandardMaterial({
        color: 0x332200,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.1,
      });
      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x003311,
        emissive: 0x10b981,
        emissiveIntensity: 0.1,
      });

      const redLens = new THREE.Mesh(lensGeo, redMat);
      redLens.position.set(-3.8, 7.4, 0.3);

      const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
      yellowLens.position.set(-3.8, 6.8, 0.3);

      const greenLens = new THREE.Mesh(lensGeo, greenMat);
      greenLens.position.set(-3.8, 6.2, 0.3);

      group.add(redLens, yellowLens, greenLens);
      this.scene.add(group);

      poles[c.app] = { red: redLens, yellow: yellowLens, green: greenLens };
    }

    return poles;
  }

  private buildDetectionZones(): Record<Approach, THREE.Mesh> {
    const rings = {} as Record<Approach, THREE.Mesh>;
    const approaches: Approach[] = ['North', 'East', 'South', 'West'];

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });

    for (const app of approaches) {
      const ringGeo = new THREE.RingGeometry(6, 7.8, 24);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      this.scene.add(ring);
      rings[app] = ring;
    }

    return rings;
  }

  private buildEmergencyCorridorMesh(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(8, 140);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.04;
    this.scene.add(mesh);
    return mesh;
  }

  private buildRainSystem(): THREE.Points {
    const count = 3000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 250;
      positions[i * 3 + 1] = Math.random() * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 250;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.5,
      transparent: true,
      opacity: 0.45,
    });

    const rain = new THREE.Points(geometry, mat);
    rain.visible = false;
    this.scene.add(rain);
    return rain;
  }

  private setupMouseEvents(): void {
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.prevMouseX;
      const deltaY = e.clientY - this.prevMouseY;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      this.spherical.theta -= deltaX * 0.008;
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.spherical.phi - deltaY * 0.008));
      this.updateCameraFromSpherical();
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.spherical.radius = Math.max(20, Math.min(220, this.spherical.radius + e.deltaY * 0.08));
      this.updateCameraFromSpherical();
    });
  }

  private updateCameraFromSpherical(): void {
    const sinPhi = Math.sin(this.spherical.phi);
    const cosPhi = Math.cos(this.spherical.phi);
    const sinTheta = Math.sin(this.spherical.theta);
    const cosTheta = Math.cos(this.spherical.theta);

    this.targetPosition.x = this.spherical.radius * sinPhi * sinTheta;
    this.targetPosition.y = this.spherical.radius * cosPhi;
    this.targetPosition.z = this.spherical.radius * sinPhi * cosTheta;
  }

  public setCameraPreset(preset: CameraPreset): void {
    this.cameraPreset = preset;
    switch (preset) {
      case 'isometric':
        this.spherical = { radius: 95, theta: Math.PI / 4, phi: Math.PI / 3 };
        this.targetLookAt.set(0, 0, 0);
        this.updateCameraFromSpherical();
        break;
      case 'topdown':
        this.targetPosition.set(0.1, 130, 0.1);
        this.targetLookAt.set(0, 0, 0);
        break;
      case 'approach':
        this.targetPosition.set(12, 6, 42);
        this.targetLookAt.set(0, 3, 0);
        break;
      case 'chase':
        // Will dynamically follow active emergency vehicle in render loop
        break;
    }
  }

  private onWindowResize = (): void => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Main animation and render update loop.
   */
  private animate = (): void => {
    if (this.isDisposed) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    // 1. Advance simulation if running
    if (this.engine.getIsRunning()) {
      const dt = SimulationEngine.TICK_DELTA_TIME * this.engine.getSettings().timeScale;
      this.engine.step(dt);
    }

    const simTime = this.engine.getSimTime();
    const signalState = this.engine.getSignalState();
    const vehicles = this.engine.getVehicles();
    const context = this.engine.getContext();
    const emergencyMission = this.engine.getActiveEmergencyMission();

    // 2. Synchronize vehicle 3D meshes
    this.syncVehicleMeshes(vehicles, simTime);

    // 3. Update traffic signal head lamp intensities
    this.updateTrafficSignals(signalState);

    // 4. Update detection zones positions & radar animation
    this.updateDetectionZones(simTime);

    // 5. Update emergency corridor highlight
    this.updateEmergencyCorridor(emergencyMission, simTime);

    // 6. Update rain weather particle system
    this.updateWeatherEffects(context);

    // 7. Smooth camera interpolation (lerp)
    if (this.cameraPreset === 'chase' && emergencyMission) {
      const ambMesh = this.vehicleMeshes.get(emergencyMission.id);
      if (ambMesh) {
        this.targetPosition.set(ambMesh.position.x + 8, ambMesh.position.y + 12, ambMesh.position.z + 18);
        this.targetLookAt.copy(ambMesh.position);
      }
    }

    this.camera.position.lerp(this.targetPosition, 0.08);
    this.currentLookAt.lerp(this.targetLookAt, 0.08);
    this.camera.lookAt(this.currentLookAt);

    // 8. Render WebGL
    this.renderer.render(this.scene, this.camera);
  };

  private syncVehicleMeshes(vehicles: Vehicle[], simTime: number): void {
    const currentIds = new Set(vehicles.map((v) => v.id));

    // Remove exited or despawned vehicle meshes
    for (const [id, mesh] of this.vehicleMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.vehicleMeshes.delete(id);
      }
    }

    // Add or update vehicles
    for (const vehicle of vehicles) {
      let mesh = this.vehicleMeshes.get(vehicle.id);
      if (!mesh) {
        mesh = VehicleMeshFactory.createVehicleMesh(vehicle);
        this.scene.add(mesh);
        this.vehicleMeshes.set(vehicle.id, mesh);
      }
      VehicleMeshFactory.updateMeshTransform(mesh, vehicle, simTime);
    }
  }

  private updateTrafficSignals(signalState: SignalState): void {
    const approaches: Approach[] = ['North', 'East', 'South', 'West'];

    for (const app of approaches) {
      const color = signalState.lights[app];
      const lamps = this.signalLamps[app];
      if (!lamps) continue;

      const setLamp = (mesh: THREE.Mesh, active: boolean, intensity: number) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = active ? intensity : 0.08;
      };

      setLamp(lamps.red, color === 'RED', 2.2);
      setLamp(lamps.yellow, color === 'YELLOW', 2.0);
      setLamp(lamps.green, color === 'GREEN', 2.5);
    }
  }

  private updateDetectionZones(simTime: number): void {
    const detectionDist = this.engine.getSettings().emergencyDetectionDistance;
    const approaches: Approach[] = ['North', 'East', 'South', 'West'];

    for (const app of approaches) {
      const ring = this.detectionRings[app];
      if (!ring) continue;

      // Position ring at upstream detection distance along incoming lane
      switch (app) {
        case 'North':
          ring.position.set(4, 0.03, 14 + detectionDist);
          break;
        case 'South':
          ring.position.set(-4, 0.03, -(14 + detectionDist));
          break;
        case 'East':
          ring.position.set(14 + detectionDist, 0.03, -4);
          break;
        case 'West':
          ring.position.set(-(14 + detectionDist), 0.03, 4);
          break;
      }

      // Subtle pulse
      const scale = 1.0 + Math.sin(simTime * 4) * 0.05;
      ring.scale.set(scale, scale, 1);
    }
  }

  private updateEmergencyCorridor(emergencyMission: any, simTime: number): void {
    if (emergencyMission && emergencyMission.state !== 'CLEARED') {
      const app = emergencyMission.approach;
      const mat = this.emergencyCorridorMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(simTime * 8) * 0.15; // pulsing corridor highlight

      switch (app) {
        case 'North':
          this.emergencyCorridorMesh.rotation.z = 0;
          this.emergencyCorridorMesh.position.set(4, 0.04, 80);
          break;
        case 'South':
          this.emergencyCorridorMesh.rotation.z = 0;
          this.emergencyCorridorMesh.position.set(-4, 0.04, -80);
          break;
        case 'East':
          this.emergencyCorridorMesh.rotation.z = Math.PI / 2;
          this.emergencyCorridorMesh.position.set(80, 0.04, -4);
          break;
        case 'West':
          this.emergencyCorridorMesh.rotation.z = Math.PI / 2;
          this.emergencyCorridorMesh.position.set(-80, 0.04, 4);
          break;
      }
      this.emergencyCorridorMesh.visible = true;
    } else {
      this.emergencyCorridorMesh.visible = false;
    }
  }

  private updateWeatherEffects(context: any): void {
    if (context.weather === 'rain') {
      this.rainPoints.visible = true;
      const positions = this.rainPoints.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 1.8;
        if (positions[i] < 0) positions[i] = 80;
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    } else {
      this.rainPoints.visible = false;
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
