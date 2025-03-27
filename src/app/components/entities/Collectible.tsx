'use client';

import * as THREE from 'three';

export class Collectible {
  public mesh: THREE.Mesh;
  private boundingSphere: THREE.Sphere;
  private initialY: number;
  private rotationSpeed: THREE.Vector3;
  
  constructor(position: THREE.Vector3) {
    // Create star-shaped collectible
    this.mesh = this.createStar();
    this.mesh.position.copy(position);
    this.initialY = position.y;
    
    // Set random rotation speed
    this.rotationSpeed = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    
    // Create bounding sphere for collision detection
    const radius = 1.5; // Slightly larger than the actual star for easier collection
    this.boundingSphere = new THREE.Sphere(this.mesh.position, radius);
  }
  
  private createStar(): THREE.Mesh {
    // Create a star shape
    const starShape = new THREE.Shape();
    const outerRadius = 1;
    const innerRadius = 0.5;
    const spikes = 5;
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        starShape.moveTo(x, y);
      } else {
        starShape.lineTo(x, y);
      }
    }
    starShape.closePath();
    
    // Extrude the shape to create a 3D star
    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3,
    };
    
    const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    
    // Create material with a shiny gold appearance
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.5,
    });
    
    // Create mesh
    const star = new THREE.Mesh(geometry, material);
    star.castShadow = true;
    
    return star;
  }
  
  public update(deltaTime: number): void {
    // Rotate the star
    this.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
    this.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
    this.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
    
    // Make the star float up and down
    const floatOffset = Math.sin(Date.now() * 0.002) * 0.5;
    this.mesh.position.y = this.initialY + floatOffset;
    
    // Update bounding sphere
    this.boundingSphere.center.copy(this.mesh.position);
  }
  
  public checkCollision(object: THREE.Object3D): boolean {
    // Create a bounding sphere for the object
    const objectBoundingSphere = new THREE.Sphere(
      object.position.clone(),
      1.5 // Approximate radius of the airplane
    );
    
    // Check for intersection
    return this.boundingSphere.intersectsSphere(objectBoundingSphere);
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