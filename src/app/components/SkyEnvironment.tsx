'use client';

import * as THREE from 'three';

export class SkyEnvironment {
  private scene: THREE.Scene;
  private clouds: THREE.Group[];
  private skybox: THREE.Mesh;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clouds = [];
    
    // Create skybox
    this.skybox = this.createSkybox();
    scene.add(this.skybox);
    
    // Create lighting
    this.directionalLight = this.createDirectionalLight();
    this.ambientLight = this.createAmbientLight();
    scene.add(this.directionalLight);
    scene.add(this.ambientLight);
    
    // Create clouds
    this.createClouds();
  }
  
  private createSkybox(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(500, 32, 32);
    // Invert the geometry so that the texture is on the inside
    geometry.scale(-1, 1, 1);
    
    const material = new THREE.MeshBasicMaterial({
      color: 0x87CEEB, // Sky blue
      side: THREE.BackSide,
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  private createDirectionalLight(): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(100, 100, 0);
    light.castShadow = true;
    
    // Configure shadow properties
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = -100;
    light.shadow.camera.right = 100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    
    return light;
  }
  
  private createAmbientLight(): THREE.AmbientLight {
    return new THREE.AmbientLight(0xFFFFFF, 0.3);
  }
  
  private createClouds(): void {
    // Create 50 cloud groups
    for (let i = 0; i < 50; i++) {
      const cloud = this.createCloudGroup();
      
      // Position clouds randomly in the sky
      cloud.position.set(
        Math.random() * 400 - 200,
        Math.random() * 50 + 50,
        Math.random() * 400 - 200
      );
      
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }
  
  private createCloudGroup(): THREE.Group {
    const group = new THREE.Group();
    
    // Cloud material
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x444444,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    // Create 5-10 cloud puffs per cloud
    const puffCount = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < puffCount; i++) {
      const puffSize = Math.random() * 5 + 5;
      const geometry = new THREE.SphereGeometry(puffSize, 7, 7);
      const puff = new THREE.Mesh(geometry, material);
      
      // Position puffs to form a cloud shape
      puff.position.set(
        Math.random() * 10 - 5,
        Math.random() * 5 - 2.5,
        Math.random() * 10 - 5
      );
      
      // Scale puffs randomly
      const scale = Math.random() * 0.5 + 0.5;
      puff.scale.set(scale, scale, scale);
      
      group.add(puff);
    }
    
    // Scale the entire cloud
    const cloudScale = Math.random() * 2 + 1;
    group.scale.set(cloudScale, cloudScale * 0.6, cloudScale);
    
    return group;
  }
  
  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Move clouds slowly
    this.clouds.forEach((cloud, index) => {
      cloud.position.z += deltaTime * 5;
      
      // If cloud is too far behind the player, move it ahead
      if (cloud.position.z > playerPosition.z + 200) {
        cloud.position.z = playerPosition.z - 200;
        cloud.position.x = Math.random() * 400 - 200;
        cloud.position.y = Math.random() * 50 + 50;
      }
      
      // Rotate clouds slowly for a more dynamic look
      cloud.rotation.y += deltaTime * 0.05;
    });
    
    // Move skybox with player
    this.skybox.position.copy(playerPosition);
    
    // Update directional light position relative to player
    this.directionalLight.position.set(
      playerPosition.x + 100,
      playerPosition.y + 100,
      playerPosition.z
    );
  }
  
  public dispose(): void {
    // Dispose of all geometries and materials
    this.clouds.forEach(cloud => {
      cloud.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          } else if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          }
        }
      });
      this.scene.remove(cloud);
    });
    
    if (this.skybox.geometry) this.skybox.geometry.dispose();
    if (this.skybox.material instanceof THREE.Material) {
      this.skybox.material.dispose();
    }
    
    this.scene.remove(this.skybox);
    this.scene.remove(this.directionalLight);
    this.scene.remove(this.ambientLight);
  }
}