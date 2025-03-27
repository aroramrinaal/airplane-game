'use client';

import * as THREE from 'three';

interface AirplaneControls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
}

export class Airplane {
  public mesh: THREE.Group;
  public velocity: THREE.Vector3;
  public controls: AirplaneControls;
  
  private readonly MAX_SPEED: number = 30;
  private readonly BOOST_SPEED: number = 50;
  private readonly ROTATION_SPEED: number = 2;
  private readonly TILT_FACTOR: number = 0.3;
  private readonly TAKEOFF_SPEED: number = 20; // Minimum speed needed for takeoff
  
  private propeller: THREE.Mesh;
  private engineParticles: THREE.Points;
  private particleSystem: THREE.BufferGeometry;
  private particlePositions: Float32Array;
  private particleCount: number = 100;
  
  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.Group();
    this.velocity = new THREE.Vector3(0, 0, 0); // Start with zero velocity
    
    this.controls = {
      up: false,
      down: false,
      left: false,
      right: false,
      boost: false,
    };
    
    // Initialize properties to avoid lint errors
    this.propeller = new THREE.Mesh();
    this.particleSystem = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.engineParticles = new THREE.Points(this.particleSystem);
    
    this.createAirplane();
    this.createEngineParticles();
    
    scene.add(this.mesh);
  }
  
  private createAirplane(): void {
    // Create airplane body - simplified, more cartoonish
    const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.4, 4, 8);
    bodyGeometry.rotateX(Math.PI / 2); // Rotate to align with z-axis
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF5733, // Bright orange
      metalness: 0.2,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);
    
    // Create wings - bright blue
    const wingGeometry = new THREE.BoxGeometry(7, 0.2, 1.5);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x4287f5, // Bright blue
      metalness: 0.2,
      roughness: 0.3,
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.castShadow = true;
    wings.receiveShadow = true;
    this.mesh.add(wings);
    
    // Create tail - yellow
    const tailGeometry = new THREE.BoxGeometry(2, 0.2, 1);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFC300, // Golden yellow
      metalness: 0.2,
      roughness: 0.3,
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, 1.5);
    tail.castShadow = true;
    tail.receiveShadow = true;
    this.mesh.add(tail);
    
    // Create vertical stabilizer - red
    const stabilizerGeometry = new THREE.BoxGeometry(0.2, 1, 1);
    const stabilizerMaterial = new THREE.MeshStandardMaterial({
      color: 0xE74C3C, // Bright red
      metalness: 0.2,
      roughness: 0.3,
    });
    const stabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
    stabilizer.position.set(0, 0.5, 1.5);
    stabilizer.castShadow = true;
    stabilizer.receiveShadow = true;
    this.mesh.add(stabilizer);
    
    // Create propeller
    const propellerGeometry = new THREE.BoxGeometry(4, 0.2, 0.1);
    const propellerMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5,
    });
    this.propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
    this.propeller.position.set(0, 0, -2);
    this.mesh.add(this.propeller);
    
    // Create cockpit - blue transparent
    const cockpitGeometry = new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x25CCF7, // Bright cyan
      transparent: true,
      opacity: 0.7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.4, -1);
    cockpit.rotation.x = Math.PI / 2;
    cockpit.castShadow = true;
    this.mesh.add(cockpit);
    
    // Create simplified landing gear
    this.createSimplifiedLandingGear();
  }
  
  private createSimplifiedLandingGear(): void {
    // Create main landing gear (wheels) - thicker and more cartoonish
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.3,
      roughness: 0.7,
    });
    
    // Left wheel
    const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    leftWheel.rotation.z = Math.PI / 2; // Rotate to align with x-axis
    leftWheel.position.set(-1.5, -0.8, 0);
    leftWheel.castShadow = true;
    this.mesh.add(leftWheel);
    
    // Right wheel
    const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rightWheel.rotation.z = Math.PI / 2; // Rotate to align with x-axis
    rightWheel.position.set(1.5, -0.8, 0);
    rightWheel.castShadow = true;
    this.mesh.add(rightWheel);
    
    // Front wheel
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2; // Rotate to align with x-axis
    frontWheel.position.set(0, -0.8, -1.5);
    frontWheel.scale.set(0.6, 0.6, 0.6); // Smaller front wheel
    frontWheel.castShadow = true;
    this.mesh.add(frontWheel);
  }
  
  private createEngineParticles(): void {
    // Create particle system for engine exhaust
    this.particleSystem = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    
    // Initialize particle positions
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      this.particlePositions[i3] = (Math.random() - 0.5) * 0.5;
      this.particlePositions[i3 + 1] = (Math.random() - 0.5) * 0.5;
      this.particlePositions[i3 + 2] = Math.random() * -2 - 2;
    }
    
    this.particleSystem.setAttribute(
      'position',
      new THREE.BufferAttribute(this.particlePositions, 3)
    );
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xFFAA00,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    this.engineParticles = new THREE.Points(this.particleSystem, particleMaterial);
    this.mesh.add(this.engineParticles);
  }
  
  // Update method for takeoff phase
  public updateTakeoff(deltaTime: number): void {
    // Update propeller rotation
    this.propeller.rotation.z += deltaTime * 20;
    
    // During takeoff, only allow throttle control and limited pitch control
    let acceleration = 0;
    
    if (this.controls.boost) {
      // Apply acceleration when throttle is engaged
      acceleration = 10;
      
      // Make engine particles more intense during acceleration
      (this.engineParticles.material as THREE.PointsMaterial).size = 0.3;
      (this.engineParticles.material as THREE.PointsMaterial).color.setHex(0xFF5500);
    } else {
      // Apply deceleration when throttle is not engaged
      acceleration = -5;
      
      // Make engine particles less intense
      (this.engineParticles.material as THREE.PointsMaterial).size = 0.2;
      (this.engineParticles.material as THREE.PointsMaterial).color.setHex(0xFFAA00);
    }
    
    // Update velocity based on acceleration
    this.velocity.z -= acceleration * deltaTime;
    
    // Clamp velocity to prevent going backwards on the runway
    this.velocity.z = Math.min(0, this.velocity.z);
    
    // Calculate current speed
    const currentSpeed = Math.abs(this.velocity.z);
    
    // Only apply physics if the airplane is actually moving
    if (currentSpeed > 0.1) {
      // Allow pitch control only if speed is sufficient
      if (currentSpeed > this.TAKEOFF_SPEED / 2) {
        if (this.controls.up) {
          // Pull up to take off
          this.mesh.rotation.x -= this.ROTATION_SPEED * 0.5 * deltaTime;
          
          // Limit rotation
          this.mesh.rotation.x = Math.max(this.mesh.rotation.x, -Math.PI / 4);
        }
        
        // Apply lift based on speed and pitch
        const liftFactor = (currentSpeed / this.TAKEOFF_SPEED) * Math.sin(-this.mesh.rotation.x);
        this.velocity.y += liftFactor * 5 * deltaTime;
      }
      
      // Apply gravity
      this.velocity.y -= 9.8 * deltaTime;
      
      // Update position
      this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    } else {
      // Reset vertical velocity when stationary to prevent unwanted movement
      this.velocity.y = 0;
      
      // Ensure plane stays perfectly on the runway when stationary
      if (Math.abs(this.mesh.position.y - 0.5) < 0.1) {
        this.mesh.position.y = 0.5;
      }
    }
    
    // Prevent going below the ground
    if (this.mesh.position.y < 0.5 && this.velocity.y < 0) {
      this.mesh.position.y = 0.5;
      this.velocity.y = 0;
    }
    
    // Update engine particles
    this.updateEngineParticles(deltaTime, currentSpeed / this.MAX_SPEED);
  }
  
  // Update method for flight phase
  public update(deltaTime: number): void {
    // Update propeller rotation
    this.propeller.rotation.z += deltaTime * 20;
    
    // Apply controls
    if (this.controls.up) {
      this.mesh.rotation.x -= this.ROTATION_SPEED * deltaTime;
    }
    if (this.controls.down) {
      this.mesh.rotation.x += this.ROTATION_SPEED * deltaTime;
    }
    if (this.controls.left) {
      this.mesh.rotation.z += this.ROTATION_SPEED * deltaTime;
      // Add a slight yaw when rolling
      this.mesh.rotation.y += this.ROTATION_SPEED * 0.5 * deltaTime;
    }
    if (this.controls.right) {
      this.mesh.rotation.z -= this.ROTATION_SPEED * deltaTime;
      // Add a slight yaw when rolling
      this.mesh.rotation.y -= this.ROTATION_SPEED * 0.5 * deltaTime;
    }
    
    // Limit rotation
    this.mesh.rotation.x = Math.max(Math.min(this.mesh.rotation.x, Math.PI / 4), -Math.PI / 4);
    this.mesh.rotation.z = Math.max(Math.min(this.mesh.rotation.z, Math.PI / 4), -Math.PI / 4);
    
    // Apply physics - convert airplane's rotation to direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.mesh.quaternion);
    
    // Set velocity based on direction and speed
    const targetSpeed = this.controls.boost ? this.BOOST_SPEED : this.MAX_SPEED;
    this.velocity.copy(direction.multiplyScalar(targetSpeed));
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Apply banking effect (tilt the airplane in the direction of turn)
    const targetBankZ = this.controls.left ? this.TILT_FACTOR : (this.controls.right ? -this.TILT_FACTOR : 0);
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, targetBankZ, deltaTime * 2);
    
    // Update engine particles
    this.updateEngineParticles(deltaTime, this.controls.boost ? 1.5 : 1.0);
  }
  
  private updateEngineParticles(deltaTime: number, intensityFactor: number): void {
    // Update engine particles
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Move particles backward
      this.particlePositions[i3 + 2] += deltaTime * 10 * intensityFactor;
      
      // If particle is too far, reset it
      if (this.particlePositions[i3 + 2] > 0) {
        this.particlePositions[i3] = (Math.random() - 0.5) * 0.5;
        this.particlePositions[i3 + 1] = (Math.random() - 0.5) * 0.5;
        this.particlePositions[i3 + 2] = Math.random() * -2 - 2;
      }
    }
    
    // Update particle system
    (this.particleSystem.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    
    // Adjust particle size and color based on intensity
    (this.engineParticles.material as THREE.PointsMaterial).size = 0.2 * intensityFactor;
    
    if (intensityFactor > 1.2) {
      (this.engineParticles.material as THREE.PointsMaterial).color.setHex(0xFF5500);
    } else {
      (this.engineParticles.material as THREE.PointsMaterial).color.setHex(0xFFAA00);
    }
  }
  
  public dispose(): void {
    // Dispose of all geometries and materials
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        }
      } else if (child instanceof THREE.Points) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    
    this.particleSystem.dispose();
  }
}