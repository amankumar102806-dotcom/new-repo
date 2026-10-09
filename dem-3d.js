// GeoGuard AI - Digital Elevation Model (DEM) & 3D Topography Runout Simulator
// High-performance Three.js 3D Slope Profiler with Steepness Heatmaps, Drainage Vectors & Debris Avalanche Simulation

class DEM3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.terrainMesh = null;
    this.drainageLines = [];
    this.infrastructureMarkers = [];
    this.debrisParticles = null;
    this.isSimulationRunning = false;
    this.simulationTime = 0;
    this.activeMode = 'heatmap'; // 'satellite', 'heatmap', 'contours'
    this.currentStationId = 'NODE-DHN-JHR01';
    this.animationFrameId = null;

    this.init();
  }

  init() {
    // Container dimensions
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.002);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    this.camera.position.set(220, 180, 260);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear old canvases
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
      this.controls.minDistance = 50;
      this.controls.maxDistance = 600;
      this.controls.target.set(0, 40, 0);
    }

    // Lighting
    this.setupLighting();

    // Build 3D Terrain
    this.buildTerrain();

    // Add Drainage Lines
    this.buildDrainageFlowPaths();

    // Add Roads and Settlements Markers
    this.buildInfrastructure();

    // Setup Debris Particle System
    this.initDebrisSimulation();

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());

    // Start render loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional Sun Light
    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    sunLight.position.set(150, 250, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 600;
    sunLight.shadow.camera.left = -180;
    sunLight.shadow.camera.right = 180;
    sunLight.shadow.camera.top = 180;
    sunLight.shadow.camera.bottom = -180;
    this.scene.add(sunLight);

    // Tactical Blue Rim Light
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 0.5);
    rimLight.position.set(-150, 100, -150);
    this.scene.add(rimLight);
  }

  buildTerrain() {
    const gridX = 90;
    const gridZ = 90;
    const sizeX = 320;
    const sizeZ = 320;

    const geometry = new THREE.PlaneGeometry(sizeX, sizeZ, gridX, gridZ);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];

    // Generate realistic slope topography
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Height formula: High ridge on North-West (+z, -x), cascading down to South-East
      const distFromCrest = (x * 0.45 - z * 0.85);
      let elev = 35 + 55 * Math.sin((distFromCrest / 180) + 1.2);

      // Overburden bench profiling
      elev += Math.sin(x * 0.08) * 8 + Math.cos(z * 0.06) * 12;

      // Steep escarpment fissure zone
      if (distFromCrest > -30 && distFromCrest < 60) {
        elev += (60 - distFromCrest) * 0.75 + Math.sin(x * 0.2) * 5;
      }

      // Valley floor flattening
      if (distFromCrest <= -40) {
        elev = Math.max(10, elev * 0.4);
      }

      pos.setY(i, Math.max(5, elev));
    }

    geometry.computeVertexNormals();

    // Compute slope angles for steepness heatmap
    const normals = geometry.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      const ny = normals.getY(i);
      // Slope angle in degrees: arccos(Ny)
      const slopeDeg = Math.acos(Math.min(1, Math.max(0, ny))) * (180 / Math.PI);

      const color = this.getSlopeColor(slopeDeg, this.activeMode);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: false,
      wireframe: false
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);

    // Add Base Grid Baseplate
    const gridHelper = new THREE.GridHelper(360, 36, 0x1e293b, 0x0f172a);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);
  }

  getSlopeColor(slopeDeg, mode) {
    if (mode === 'heatmap') {
      // 0 - 15 deg: Safe Green
      if (slopeDeg < 15) {
        return new THREE.Color(0x10b981);
      }
      // 15 - 30 deg: Moderate Yellow
      else if (slopeDeg < 30) {
        return new THREE.Color(0xf59e0b);
      }
      // 30 - 42 deg: High Orange
      else if (slopeDeg < 42) {
        return new THREE.Color(0xf97316);
      }
      // > 42 deg: Critical Failure Crimson Red
      else {
        return new THREE.Color(0xef4444);
      }
    } else if (mode === 'contours') {
      // Contour elevation banding
      const band = Math.floor(slopeDeg / 5) % 2;
      return band === 0 ? new THREE.Color(0x38bdf8) : new THREE.Color(0x0369a1);
    } else {
      // Realistic Sat/Geology Spoil
      const t = Math.min(1, slopeDeg / 50);
      return new THREE.Color().lerpColors(new THREE.Color(0x475569), new THREE.Color(0x78350f), t);
    }
  }

  setRenderMode(mode) {
    this.activeMode = mode;
    if (!this.terrainMesh) return;

    const geometry = this.terrainMesh.geometry;
    const normals = geometry.attributes.normal;
    const colors = [];

    for (let i = 0; i < normals.count; i++) {
      const ny = normals.getY(i);
      const slopeDeg = Math.acos(Math.min(1, Math.max(0, ny))) * (180 / Math.PI);
      const color = this.getSlopeColor(slopeDeg, mode);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.color.needsUpdate = true;
    this.terrainMesh.material.wireframe = (mode === 'contours');
  }

  buildDrainageFlowPaths() {
    // Blue pulsating streamlines indicating surface runoff paths
    const flowPaths = [
      [
        new THREE.Vector3(-40, 85, 90),
        new THREE.Vector3(-25, 70, 60),
        new THREE.Vector3(-10, 50, 20),
        new THREE.Vector3(5, 30, -25),
        new THREE.Vector3(20, 18, -75),
        new THREE.Vector3(45, 12, -120)
      ],
      [
        new THREE.Vector3(30, 80, 80),
        new THREE.Vector3(20, 65, 50),
        new THREE.Vector3(15, 48, 15),
        new THREE.Vector3(25, 28, -30),
        new THREE.Vector3(40, 16, -80),
        new THREE.Vector3(60, 10, -125)
      ]
    ];

    flowPaths.forEach(pts => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeometry = new THREE.TubeGeometry(curve, 40, 1.2, 8, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
        wireframe: false
      });
      const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      this.scene.add(tube);
      this.drainageLines.push(tube);
    });
  }

  buildInfrastructure() {
    // 1. Rupture Scarp Marker (Red Pulsing Ring)
    const crownGeo = new THREE.RingGeometry(6, 9, 32);
    crownGeo.rotateX(-Math.PI / 2);
    const crownMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const crownMesh = new THREE.Mesh(crownGeo, crownMat);
    crownMesh.position.set(-20, 82, 75);
    this.scene.add(crownMesh);

    // 2. Primary Road (Katras Link Bypass) that gets severed
    const roadPts = [
      new THREE.Vector3(-120, 18, -20),
      new THREE.Vector3(-60, 22, -22),
      new THREE.Vector3(0, 28, -25), // Direct breach point
      new THREE.Vector3(60, 24, -28),
      new THREE.Vector3(120, 16, -30)
    ];
    const roadCurve = new THREE.CatmullRomCurve3(roadPts);
    const roadGeo = new THREE.TubeGeometry(roadCurve, 30, 2.5, 6, false);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 }); // Red indicating breached
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.scene.add(roadMesh);

    // 3. Alternate High Ridge Road (Safe Corridor)
    const altRoadPts = [
      new THREE.Vector3(-130, 45, -90),
      new THREE.Vector3(-70, 38, -95),
      new THREE.Vector3(0, 32, -100),
      new THREE.Vector3(80, 28, -105),
      new THREE.Vector3(130, 24, -110)
    ];
    const altRoadCurve = new THREE.CatmullRomCurve3(altRoadPts);
    const altRoadGeo = new THREE.TubeGeometry(altRoadCurve, 30, 2.5, 6, false);
    const altRoadMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7 }); // Green Safe
    const altRoadMesh = new THREE.Mesh(altRoadGeo, altRoadMat);
    this.scene.add(altRoadMesh);

    // 4. Village Settlement Marker (Baniahir Basti)
    const villageGeo = new THREE.BoxGeometry(18, 8, 14);
    const villageMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const villageMesh = new THREE.Mesh(villageGeo, villageMat);
    villageMesh.position.set(10, 18, -60);
    this.scene.add(villageMesh);
  }

  initDebrisSimulation() {
    // 350 particles cascading down slope
    const particleCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const initialPositions = [];

    for (let i = 0; i < particleCount; i++) {
      // Spawn around rupture scarp
      const x = -20 + (Math.random() - 0.5) * 35;
      const y = 80 + Math.random() * 8;
      const z = 75 + (Math.random() - 0.5) * 25;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions.push({ x, y, z });
      velocities.push({
        vx: (Math.random() - 0.3) * 0.4,
        vy: -0.8 - Math.random() * 0.6,
        vz: -1.2 - Math.random() * 0.8
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xef4444,
      size: 4.5,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.debrisParticles = new THREE.Points(geometry, material);
    this.debrisParticles.visible = false;
    this.scene.add(this.debrisParticles);

    this.debrisData = {
      velocities,
      initialPositions,
      count: particleCount
    };
  }

  startRunoutSimulation(onMilestoneCallback) {
    this.isSimulationRunning = true;
    this.simulationTime = 0;
    this.debrisParticles.visible = true;

    // Reset particles to initial crown
    const pos = this.debrisParticles.geometry.attributes.position;
    for (let i = 0; i < this.debrisData.count; i++) {
      const init = this.debrisData.initialPositions[i];
      pos.setXYZ(i, init.x, init.y, init.z);
    }
    pos.needsUpdate = true;

    this.onMilestoneCallback = onMilestoneCallback;
  }

  stopRunoutSimulation() {
    this.isSimulationRunning = false;
    if (this.debrisParticles) {
      this.debrisParticles.visible = false;
    }
  }

  updateSimulation(delta) {
    if (!this.isSimulationRunning || !this.debrisParticles) return;

    this.simulationTime += delta * 15; // Accelerated simulation time in seconds
    const pos = this.debrisParticles.geometry.attributes.position;

    let anyActive = false;

    for (let i = 0; i < this.debrisData.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const v = this.debrisData.velocities[i];

      // Gravity and slope resistance
      if (z > -110 && y > 10) {
        anyActive = true;
        x += v.vx * delta * 45;
        y += v.vy * delta * 45;
        z += v.vz * delta * 45;

        // Frictional spreading into fan
        v.vx += (Math.random() - 0.5) * 0.1;
        v.vy *= 0.99;
      }

      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;

    // Milestones trigger
    if (this.onMilestoneCallback) {
      this.onMilestoneCallback(Math.floor(this.simulationTime));
    }

    if (!anyActive && this.simulationTime > 120) {
      this.isSimulationRunning = false;
    }
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    // Pulse drainage streamlines
    const time = Date.now() * 0.003;
    this.drainageLines.forEach(line => {
      line.material.opacity = 0.5 + 0.4 * Math.sin(time);
    });

    // Update Debris Flow
    this.updateSimulation(0.016);

    this.renderer.render(this.scene, this.camera);
  }

  resetCamera() {
    if (!this.camera || !this.controls) return;
    this.camera.position.set(220, 180, 260);
    this.controls.target.set(0, 40, 0);
    this.controls.update();
  }

  setTopView() {
    if (!this.camera || !this.controls) return;
    this.camera.position.set(0, 320, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement && this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// Global Export
window.DEM3DViewer = DEM3DViewer;
