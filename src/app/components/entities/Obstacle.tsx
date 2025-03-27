'use client';

import * as THREE from 'three';

export class Obstacle {
  public mesh: THREE.Mesh;
  private boundingBox: THREE.Box3;
  
  constructor(position: THREE.Vector3) {
    // Create mountain-like obstacle
    this.mesh = this.createMountain();
    this.mesh.position.copy(position);
    
    // Create bounding box for collision detection
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }
  
  private createMountain(): THREE.Mesh {
    // Create a cone geometry for the mountain
    const height = Math.random() * 15 + 10;
    const radius = Math.random() * 10 + 5;
    const geometry = new THREE.ConeGeometry(radius, height, 8);
    
    // Create material with a rocky texture
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    
    // Create mesh
    const mountain = new THREE.Mesh(geometry, material);
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    
    // Rotate and position the mountain
    mountain.rotation.x = Math.PI;
    mountain.position.y = -height / 2;
    
    return mountain;
  }
  
  public update(deltaTime: number): void {
    // Update bounding box
    this.boundingBox.setFromObject(this.mesh);
  }
  
  public checkCollision(object: THREE.Object3D): boolean {
    // Create a bounding box for the object
    const objectBoundingBox = new THREE.Box3().setFromObject(object);
    
    // Check for intersection
    return this.boundingBox.intersectsBox(objectBoundingBox);
  }
  
  public dispose(): void {
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    
    if (this.mesh.material instanceof THREE.Material) {
      this.mesh.material.dispose();
    } else if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach(material => material.dispose());
    }
  }
}