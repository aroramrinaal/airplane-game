'use client';

import * as THREE from 'three';

export class Airport {
  private scene: THREE.Scene;
  private runway: THREE.Group;
  private buildings: THREE.Group;
  private terrain: THREE.Mesh;
  private runwayLights: THREE.PointLight[];
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.runway = new THREE.Group();
    this.buildings = new THREE.Group();
    this.runwayLights = [];
    
    this.createTerrain();
    this.createRunway();
    this.createBuildings();
    this.createRunwayLights();
    
    scene.add(this.runway);
    scene.add(this.buildings);
    scene.add(this.terrain);
  }
  
  private createTerrain(): void {
    // Create a large flat terrain
    const terrainGeometry = new THREE.PlaneGeometry(1000, 1000);
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x4CAF50, // Green grass
      roughness: 0.8,
      metalness: 0.2,
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
    
    const runwayGeometry = new THREE.PlaneGeometry(runwayWidth, runwayLength);
    const runwayMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333, // Dark gray asphalt
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
    // Create control tower
    const towerBaseGeometry = new THREE.BoxGeometry(10, 15, 10);
    const towerTopGeometry = new THREE.CylinderGeometry(6, 8, 5, 8);
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0E0E0, // Light gray
      roughness: 0.7,
      metalness: 0.3,
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x88CCFF, // Light blue
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.7,
    });
    
    // Tower base
    const towerBase = new THREE.Mesh(towerBaseGeometry, buildingMaterial);
    towerBase.position.set(40, 7.5, -30);
    towerBase.castShadow = true;
    towerBase.receiveShadow = true;
    
    // Tower top (control room)
    const towerTop = new THREE.Mesh(towerTopGeometry, glassMaterial);
    towerTop.position.set(40, 17.5, -30);
    towerTop.castShadow = true;
    
    this.buildings.add(towerBase);
    this.buildings.add(towerTop);
    
    // Create terminal building
    const terminalGeometry = new THREE.BoxGeometry(60, 10, 20);
    const terminalMaterial = new THREE.MeshStandardMaterial({
      color: 0xBDBDBD, // Gray
      roughness: 0.7,
      metalness: 0.3,
    });
    
    const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
    terminal.position.set(60, 5, -50);
    terminal.castShadow = true;
    terminal.receiveShadow = true;
    
    this.buildings.add(terminal);
    
    // Create hangar
    const hangarBaseGeometry = new THREE.BoxGeometry(30, 10, 25);
    const hangarRoofGeometry = new THREE.CylinderGeometry(12.5, 12.5, 30, 16, 1, false, 0, Math.PI);
    
    const hangarBase = new THREE.Mesh(hangarBaseGeometry, buildingMaterial);
    hangarBase.position.set(50, 5, 20);
    hangarBase.castShadow = true;
    hangarBase.receiveShadow = true;
    
    const hangarRoof = new THREE.Mesh(hangarRoofGeometry, buildingMaterial);
    hangarRoof.rotation.z = Math.PI / 2;
    hangarRoof.rotation.y = Math.PI / 2;
    hangarRoof.position.set(50, 10, 20);
    hangarRoof.castShadow = true;
    
    this.buildings.add(hangarBase);
    this.buildings.add(hangarRoof);
    
    // Create smaller buildings
    for (let i = 0; i < 5; i++) {
      const size = 5 + Math.random() * 10;
      const height = 5 + Math.random() * 10;
      const buildingGeometry = new THREE.BoxGeometry(size, height, size);
      
      const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      building.position.set(
        70 + Math.random() * 30 - 15,
        height / 2,
        -80 + Math.random() * 60
      );
      building.castShadow = true;
      building.receiveShadow = true;
      
      this.buildings.add(building);
    }
  }
  
  private createRunwayLights(): void {
    // Create runway edge lights
    const runwayLength = 200;
    const runwayWidth = 20;
    const lightSpacing = 10;
    const lightCount = Math.floor(runwayLength / lightSpacing);
    
    for (let i = 0; i < lightCount; i++) {
      // Left edge lights
      const leftLight = new THREE.PointLight(0xFFFFFF, 0.5, 10);
      leftLight.position.set(-runwayWidth / 2, 0.5, -i * lightSpacing);
      this.scene.add(leftLight);
      this.runwayLights.push(leftLight);
      
      // Create a small sphere to represent the light fixture
      const leftLightMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      leftLightMesh.position.copy(leftLight.position);
      this.scene.add(leftLightMesh);
      
      // Right edge lights
      const rightLight = new THREE.PointLight(0xFFFFFF, 0.5, 10);
      rightLight.position.set(runwayWidth / 2, 0.5, -i * lightSpacing);
      this.scene.add(rightLight);
      this.runwayLights.push(rightLight);
      
      // Create a small sphere to represent the light fixture
      const rightLightMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      );
      rightLightMesh.position.copy(rightLight.position);
      this.scene.add(rightLightMesh);
    }
    
    // Create approach lights (red)
    for (let i = 1; i <= 5; i++) {
      const approachLight = new THREE.PointLight(0xFF0000, 0.8, 15);
      approachLight.position.set(0, 0.5, -runwayLength - i * 5);
      this.scene.add(approachLight);
      this.runwayLights.push(approachLight);
      
      // Create a small sphere to represent the light fixture
      const approachLightMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xFF0000 })
      );
      approachLightMesh.position.copy(approachLight.position);
      this.scene.add(approachLightMesh);
    }
  }
  
  public dispose(): void {
    // Dispose of all geometries and materials
    this.runway.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        }
      }
    });
    
    this.buildings.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        }
      }
    });
    
    if (this.terrain.geometry) this.terrain.geometry.dispose();
    if (this.terrain.material instanceof THREE.Material) {
      this.terrain.material.dispose();
    }
    
    // Remove lights
    this.runwayLights.forEach(light => {
      this.scene.remove(light);
    });
    
    // Remove objects from scene
    this.scene.remove(this.runway);
    this.scene.remove(this.buildings);
    this.scene.remove(this.terrain);
  }
}