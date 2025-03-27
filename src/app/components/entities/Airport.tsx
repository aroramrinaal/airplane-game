'use client';

import * as THREE from 'three';

export class Airport {
  private scene: THREE.Scene;
  private runway: THREE.Group;
  private buildings: THREE.Group;
  private terrain: THREE.Mesh;
  private runwayLights: THREE.PointLight[];
  private controlTower: THREE.Group;
  private hangars: THREE.Group;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.runway = new THREE.Group();
    this.buildings = new THREE.Group();
    this.hangars = new THREE.Group();
    this.controlTower = new THREE.Group();
    this.runwayLights = [];
    
    // Initialize terrain with a default mesh to avoid linter errors
    this.terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    
    this.createTerrain();
    this.createRunway();
    this.createBuildings();
    this.createControlTower();
    this.createHangars();
    this.createRunwayLights();
    
    scene.add(this.runway);
    scene.add(this.buildings);
    scene.add(this.controlTower);
    scene.add(this.hangars);
    scene.add(this.terrain);
  }
  
  private createTerrain(): void {
    // Create a large flat terrain with texture
    const terrainGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    
    // Create a canvas for the terrain texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Fill with base grass color
      context.fillStyle = '#4CAF50';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add some texture to make it more interesting
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        const color = Math.random() > 0.5 ? '#3E8E41' : '#5CBF60';
        context.fillStyle = color;
        context.fillRect(x, y, size, size);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
    });
    
    this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    this.terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.terrain.position.y = -0.1; // Slightly below the runway
    this.terrain.receiveShadow = true;
  }
  
  private createRunway(): void {
    // Create the main runway strip
    const runwayLength = 200;
    const runwayWidth = 20;
    
    // Create a more detailed runway texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Dark asphalt background
      context.fillStyle = '#333333';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle texture/grain
      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 0.5;
        const gray = Math.floor(Math.random() * 20 + 40);
        context.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        context.fillRect(x, y, size, size);
      }
    }
    
    const runwayTexture = new THREE.CanvasTexture(canvas);
    runwayTexture.wrapS = runwayTexture.wrapT = THREE.RepeatWrapping;
    runwayTexture.repeat.set(1, 10);
    
    const runwayGeometry = new THREE.PlaneGeometry(runwayWidth, runwayLength, 1, 10);
    const runwayMaterial = new THREE.MeshStandardMaterial({
      map: runwayTexture,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const runwayStrip = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runwayStrip.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    runwayStrip.position.z = -runwayLength / 2; // Center the runway with the start at z=0
    runwayStrip.receiveShadow = true;
    
    this.runway.add(runwayStrip);
    
    // Add runway markings
    this.addRunwayMarkings(runwayLength, runwayWidth);
    
    // Add taxiways
    this.addTaxiways(runwayLength, runwayWidth);
  }
  
  private addRunwayMarkings(runwayLength: number, runwayWidth: number): void {
    // Create center line markings
    const centerLineCount = Math.floor(runwayLength / 10);
    const centerLineWidth = 0.5;
    const centerLineLength = 5;
    
    const centerLineGeometry = new THREE.PlaneGeometry(centerLineWidth, centerLineLength);
    const centerLineMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, // White
      roughness: 0.5,
      metalness: 0.1,
    });
    
    for (let i = 0; i < centerLineCount; i++) {
      const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
      centerLine.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      centerLine.position.z = -i * 10 - 5; // Position along the runway
      centerLine.position.y = 0.01; // Slightly above the runway
      centerLine.receiveShadow = true;
      
      this.runway.add(centerLine);
    }
    
    // Create threshold markings at the start of the runway
    const thresholdCount = 8;
    const thresholdWidth = 1;
    const thresholdLength = runwayWidth / thresholdCount;
    const thresholdSpacing = thresholdLength;
    
    const thresholdGeometry = new THREE.PlaneGeometry(thresholdWidth, thresholdLength - 0.5);
    const thresholdMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, // White
      roughness: 0.5,
      metalness: 0.1,
    });
    
    for (let i = 0; i < thresholdCount; i++) {
      const threshold = new THREE.Mesh(thresholdGeometry, thresholdMaterial);
      threshold.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      threshold.position.z = -5; // Near the start of the runway
      threshold.position.x = -runwayWidth / 2 + thresholdSpacing / 2 + i * thresholdSpacing;
      threshold.position.y = 0.01; // Slightly above the runway
      threshold.receiveShadow = true;
      
      this.runway.add(threshold);
    }
    
    // Create edge markings
    const edgeGeometry = new THREE.PlaneGeometry(0.5, runwayLength);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, // White
      roughness: 0.5,
      metalness: 0.1,
    });
    
    // Left edge
    const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    leftEdge.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    leftEdge.position.x = -runwayWidth / 2;
    leftEdge.position.z = -runwayLength / 2;
    leftEdge.position.y = 0.01; // Slightly above the runway
    leftEdge.receiveShadow = true;
    
    // Right edge
    const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    rightEdge.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    rightEdge.position.x = runwayWidth / 2;
    rightEdge.position.z = -runwayLength / 2;
    rightEdge.position.y = 0.01; // Slightly above the runway
    rightEdge.receiveShadow = true;
    
    this.runway.add(leftEdge);
    this.runway.add(rightEdge);
    
    // Create runway numbers
    this.createRunwayNumber(runwayWidth);
  }
  
  private createRunwayNumber(runwayWidth: number): void {
    // Create a simple "36" marking at the start of the runway
    // (Runway numbers are based on magnetic heading, 360 degrees = 36)
    
    // Create the "3" shape
    const threeShape = new THREE.Shape();
    threeShape.moveTo(0, 0);
    threeShape.lineTo(2, 0);
    threeShape.lineTo(2, 1);
    threeShape.lineTo(1, 1);
    threeShape.lineTo(2, 1);
    threeShape.lineTo(2, 2);
    threeShape.lineTo(0, 2);
    threeShape.lineTo(0, 1.5);
    threeShape.lineTo(1, 1.5);
    threeShape.lineTo(0, 1.5);
    threeShape.lineTo(0, 0);
    
    // Create the "6" shape
    const sixShape = new THREE.Shape();
    sixShape.moveTo(0, 0);
    sixShape.lineTo(2, 0);
    sixShape.lineTo(2, 1);
    sixShape.lineTo(1, 1);
    sixShape.lineTo(1, 0.5);
    sixShape.lineTo(2, 0.5);
    sixShape.lineTo(2, 2);
    sixShape.lineTo(0, 2);
    sixShape.lineTo(0, 0);
    
    const numberGeometry3 = new THREE.ShapeGeometry(threeShape);
    const numberGeometry6 = new THREE.ShapeGeometry(sixShape);
    const numberMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF, // White
      roughness: 0.5,
      metalness: 0.1,
    });
    
    const number3 = new THREE.Mesh(numberGeometry3, numberMaterial);
    number3.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    number3.position.set(-4, 0.02, -15); // Position near the start of the runway
    number3.scale.set(2, 2, 1); // Scale up the number
    
    const number6 = new THREE.Mesh(numberGeometry6, numberMaterial);
    number6.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    number6.position.set(0, 0.02, -15); // Position near the start of the runway
    number6.scale.set(2, 2, 1); // Scale up the number
    
    this.runway.add(number3);
    this.runway.add(number6);
  }
  
  private addTaxiways(runwayLength: number, runwayWidth: number): void {
    // Create a taxiway connecting to the runway
    const taxiwayWidth = 10;
    const taxiwayLength = 50;
    
    const taxiwayGeometry = new THREE.PlaneGeometry(taxiwayWidth, taxiwayLength);
    const taxiwayMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray asphalt
      roughness: 0.7,
      metalness: 0.1,
    });
    
    const taxiway = new THREE.Mesh(taxiwayGeometry, taxiwayMaterial);
    taxiway.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    taxiway.rotation.z = Math.PI / 2; // Rotate to be perpendicular to the runway
    taxiway.position.x = runwayWidth / 2 + taxiwayLength / 2;
    taxiway.position.z = -30; // Position along the runway
    taxiway.receiveShadow = true;
    
    this.runway.add(taxiway);
    
    // Add taxiway markings
    const taxiwayEdgeGeometry = new THREE.PlaneGeometry(0.3, taxiwayLength);
    const taxiwayEdgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00, // Yellow
      roughness: 0.5,
      metalness: 0.1,
    });
    
    // Left edge
    const taxiwayLeftEdge = new THREE.Mesh(taxiwayEdgeGeometry, taxiwayEdgeMaterial);
    taxiwayLeftEdge.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    taxiwayLeftEdge.rotation.z = Math.PI / 2; // Rotate to be perpendicular to the runway
    taxiwayLeftEdge.position.x = runwayWidth / 2 + taxiwayLength / 2;
    taxiwayLeftEdge.position.z = -30 - taxiwayWidth / 2;
    taxiwayLeftEdge.position.y = 0.01; // Slightly above the taxiway
    taxiwayLeftEdge.receiveShadow = true;
    
    // Right edge
    const taxiwayRightEdge = new THREE.Mesh(taxiwayEdgeGeometry, taxiwayEdgeMaterial);
    taxiwayRightEdge.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    taxiwayRightEdge.rotation.z = Math.PI / 2; // Rotate to be perpendicular to the runway
    taxiwayRightEdge.position.x = runwayWidth / 2 + taxiwayLength / 2;
    taxiwayRightEdge.position.z = -30 + taxiwayWidth / 2;
    taxiwayRightEdge.position.y = 0.01; // Slightly above the taxiway
    taxiwayRightEdge.receiveShadow = true;
    
    this.runway.add(taxiwayLeftEdge);
    this.runway.add(taxiwayRightEdge);
  }
  
  private createBuildings(): void {
    // Create more varied airport buildings
    this.createTerminalBuilding();
    this.createAuxiliaryBuildings();
    this.createParkingLot();
  }
  
  private createTerminalBuilding(): void {
    // Main terminal building
    const terminalWidth = 40;
    const terminalHeight = 15;
    const terminalDepth = 25;
    
    const terminalGeometry = new THREE.BoxGeometry(terminalWidth, terminalHeight, terminalDepth);
    
    // Create a texture for the terminal windows
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = '#D3D3D3'; // Light gray
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw windows
      context.fillStyle = '#87CEEB'; // Sky blue for glass
      const windowSize = 40;
      const windowSpacing = 60;
      
      for (let x = 10; x < canvas.width; x += windowSpacing) {
        for (let y = 10; y < canvas.height; y += windowSpacing) {
          context.fillRect(x, y, windowSize, windowSize);
        }
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    
    const terminalMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.8,
    });
    
    const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
    terminal.position.set(50, terminalHeight / 2, -40);
    terminal.castShadow = true;
    terminal.receiveShadow = true;
    
    this.buildings.add(terminal);
    
    // Terminal roof
    const roofGeometry = new THREE.BoxGeometry(terminalWidth + 5, 2, terminalDepth + 5);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(50, terminalHeight + 1, -40);
    roof.castShadow = true;
    
    this.buildings.add(roof);
  }
  
  private createControlTower(): void {
    // Base of the control tower
    const baseGeometry = new THREE.CylinderGeometry(6, 8, 30, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xCECECE,
      roughness: 0.5,
      metalness: 0.3,
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(30, 15, -80);
    base.castShadow = true;
    base.receiveShadow = true;
    
    this.controlTower.add(base);
    
    // Tower cabin (top part)
    const cabinGeometry = new THREE.CylinderGeometry(10, 7, 8, 8);
    
    // Create a texture for the control tower windows
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = '#666666';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create a continuous window band
      context.fillStyle = '#87CEFA';
      context.fillRect(0, 20, canvas.width, 80);
      
      // Add window frames
      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 2;
      for (let x = 0; x < canvas.width; x += 64) {
        context.beginPath();
        context.moveTo(x, 20);
        context.lineTo(x, 100);
        context.stroke();
      }
    }
    
    const cabinTexture = new THREE.CanvasTexture(canvas);
    cabinTexture.wrapS = THREE.RepeatWrapping;
    cabinTexture.repeat.set(1, 1);
    
    const cabinMaterial = new THREE.MeshStandardMaterial({
      map: cabinTexture,
      roughness: 0.2,
      metalness: 0.8,
    });
    
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 20, 0);
    cabin.castShadow = true;
    
    this.controlTower.add(cabin);
    
    // Tower roof
    const roofGeometry = new THREE.ConeGeometry(10, 5, 8);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.3,
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 26, 0);
    roof.castShadow = true;
    
    this.controlTower.add(roof);
    
    // Antenna on top
    const antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.3,
      metalness: 0.9,
    });
    
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, 33, 0);
    antenna.castShadow = true;
    
    this.controlTower.add(antenna);
  }
  
  private createHangars(): void {
    // Create a few aircraft hangars
    for (let i = 0; i < 3; i++) {
      const hangarWidth = 20;
      const hangarHeight = 12;
      const hangarDepth = 25;
      
      // Hangar body
      const hangarGeometry = new THREE.BoxGeometry(hangarWidth, hangarHeight, hangarDepth);
      const hangarMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Brown
        roughness: 0.7,
        metalness: 0.2,
      });
      
      const hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
      hangar.position.set(-50 + i * 30, hangarHeight / 2, -80);
      hangar.castShadow = true;
      hangar.receiveShadow = true;
      
      this.hangars.add(hangar);
      
      // Hangar roof (arched)
      const archSegments = 8;
      const archRadius = hangarWidth / 2;
      const archGeometry = new THREE.BufferGeometry();
      const archVertices = [];
      const archIndices = [];
      
      // Create arch points
      for (let j = 0; j <= archSegments; j++) {
        const angle = (Math.PI / archSegments) * j;
        const x = Math.cos(angle) * archRadius;
        const y = Math.sin(angle) * archRadius + hangarHeight;
        
        // Front and back points
        archVertices.push(x, y, hangarDepth / 2);
        archVertices.push(x, y, -hangarDepth / 2);
      }
      
      // Create faces
      for (let j = 0; j < archSegments; j++) {
        const v0 = j * 2;
        const v1 = v0 + 1;
        const v2 = v0 + 2;
        const v3 = v0 + 3;
        
        // Two triangles per segment
        archIndices.push(v0, v2, v1);
        archIndices.push(v1, v2, v3);
      }
      
      archGeometry.setAttribute('position', new THREE.Float32BufferAttribute(archVertices, 3));
      archGeometry.setIndex(archIndices);
      archGeometry.computeVertexNormals();
      
      const archMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666, // Dark gray
        roughness: 0.6,
        metalness: 0.4,
      });
      
      const arch = new THREE.Mesh(archGeometry, archMaterial);
      arch.position.set(-50 + i * 30, 0, -80);
      arch.castShadow = true;
      
      this.hangars.add(arch);
    }
  }
  
  private createAuxiliaryBuildings(): void {
    // Small auxiliary buildings
    for (let i = 0; i < 4; i++) {
      const size = 5 + Math.random() * 5;
      const height = 3 + Math.random() * 3;
      
      const geometry = new THREE.BoxGeometry(size, height, size);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0xA9A9A9 : 0xD3D3D3,
        roughness: 0.7,
        metalness: 0.2,
      });
      
      const building = new THREE.Mesh(geometry, material);
      building.position.set(
        20 - Math.random() * 60,
        height / 2,
        -150 + Math.random() * 150
      );
      building.castShadow = true;
      building.receiveShadow = true;
      
      this.buildings.add(building);
    }
  }
  
  private createParkingLot(): void {
    // Parking lot
    const parkingLotWidth = 50;
    const parkingLotLength = 30;
    
    const parkingGeometry = new THREE.PlaneGeometry(parkingLotWidth, parkingLotLength);
    
    // Create a texture for the parking lot with spaces
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Asphalt background
      context.fillStyle = '#444444';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Parking spaces
      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 2;
      
      const spaceWidth = 40;
      const spaceHeight = 80;
      
      for (let x = 20; x < canvas.width - 100; x += spaceWidth + 10) {
        for (let y = 20; y < canvas.height - 20; y += spaceHeight + 20) {
          context.strokeRect(x, y, spaceWidth, spaceHeight);
        }
      }
    }
    
    const parkingTexture = new THREE.CanvasTexture(canvas);
    
    const parkingMaterial = new THREE.MeshStandardMaterial({
      map: parkingTexture,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    const parking = new THREE.Mesh(parkingGeometry, parkingMaterial);
    parking.rotation.x = -Math.PI / 2;
    parking.position.set(80, 0.01, -40); // Slightly above the ground
    parking.receiveShadow = true;
    
    this.buildings.add(parking);
  }
  
  private createRunwayLights(): void {
    // Enhanced runway lighting
    const runwayLength = 200;
    const runwayWidth = 20;
    
    // Edge lights
    const lightCount = 40;
    const lightSpacing = runwayLength / lightCount;
    
    // Light geometry (small cylinder for the base)
    const lightBaseGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.3, 8);
    const lightBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.5,
    });
    
    // Create lights on both sides of the runway
    for (let i = 0; i < lightCount; i++) {
      // Position on the runway
      const z = -i * lightSpacing;
      
      // Left side light
      const leftLightBase = new THREE.Mesh(lightBaseGeometry, lightBaseMaterial);
      leftLightBase.position.set(-runwayWidth / 2 - 1, 0.15, z);
      this.runway.add(leftLightBase);
      
      const leftLight = new THREE.PointLight(0xFFFFFF, 0.4, 10);
      leftLight.position.set(-runwayWidth / 2 - 1, 0.5, z);
      this.runway.add(leftLight);
      this.runwayLights.push(leftLight);
      
      // Right side light
      const rightLightBase = new THREE.Mesh(lightBaseGeometry, lightBaseMaterial);
      rightLightBase.position.set(runwayWidth / 2 + 1, 0.15, z);
      this.runway.add(rightLightBase);
      
      const rightLight = new THREE.PointLight(0xFFFFFF, 0.4, 10);
      rightLight.position.set(runwayWidth / 2 + 1, 0.5, z);
      this.runway.add(rightLight);
      this.runwayLights.push(rightLight);
    }
    
    // Approach lights (brighter at the start of the runway)
    for (let i = 1; i <= 5; i++) {
      const approachLightBase = new THREE.Mesh(lightBaseGeometry, lightBaseMaterial);
      approachLightBase.position.set(0, 0.15, i * 5);
      this.runway.add(approachLightBase);
      
      const approachLight = new THREE.PointLight(0xFFFFFF, 0.6, 15);
      approachLight.position.set(0, 0.5, i * 5);
      this.runway.add(approachLight);
      this.runwayLights.push(approachLight);
    }
  }
  
  public dispose(): void {
    // Dispose of all geometries and materials
    this.disposeObject(this.runway);
    this.disposeObject(this.buildings);
    this.disposeObject(this.controlTower);
    this.disposeObject(this.hangars);
    
    if (this.terrain.geometry) this.terrain.geometry.dispose();
    if (this.terrain.material instanceof THREE.Material) {
      this.terrain.material.dispose();
    }
    
    this.scene.remove(this.runway);
    this.scene.remove(this.buildings);
    this.scene.remove(this.controlTower);
    this.scene.remove(this.hangars);
    this.scene.remove(this.terrain);
    
    this.runwayLights.forEach(light => {
      this.scene.remove(light);
    });
  }
  
  private disposeObject(object: THREE.Object3D): void {
    object.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        }
      }
      
      if (child.children.length > 0) {
        this.disposeObject(child);
      }
    });
  }
}