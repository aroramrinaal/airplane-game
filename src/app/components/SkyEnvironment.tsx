'use client';

import * as THREE from 'three';

export class SkyEnvironment {
  private scene: THREE.Scene;
  private clouds: THREE.Group[];
  private skybox: THREE.Mesh;
  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;
  private ground: THREE.Mesh;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clouds = [];
    
    // Create skybox
    this.skybox = this.createSkybox();
    scene.add(this.skybox);
    
    // Create ground
    this.ground = this.createGround();
    scene.add(this.ground);
    
    // Create lighting
    this.directionalLight = this.createDirectionalLight();
    this.ambientLight = this.createAmbientLight();
    this.hemiLight = this.createHemisphereLight();
    scene.add(this.directionalLight);
    scene.add(this.ambientLight);
    scene.add(this.hemiLight);
    
    // Create clouds
    this.createClouds();
  }
  
  private createSkybox(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(500, 32, 32);
    // Invert the geometry so that the texture is on the inside
    geometry.scale(-1, 1, 1);
    
    // Create a gradient material for the sky
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x0077FF) },     // Bright blue
      bottomColor: { value: new THREE.Color(0x89CFF0) },  // Light sky blue
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };
    
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  private createGround(): THREE.Mesh {
    // Create a very large ground plane
    const geometry = new THREE.PlaneGeometry(10000, 10000, 1, 1);
    
    // Create a material with a nice ground texture
    const material = new THREE.MeshStandardMaterial({
      color: 0x228B22,  // Forest green
      roughness: 0.8,
      metalness: 0.2,
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -5; // Position below the airplane
    ground.receiveShadow = true;
    
    return ground;
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
  
  private createHemisphereLight(): THREE.HemisphereLight {
    // Add hemisphere light (sky color, ground color, intensity)
    return new THREE.HemisphereLight(0x0077FF, 0x228B22, 0.6);
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
    
    // Cloud material - more fluffy and reflective
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x555555,
      roughness: 0.8,
      metalness: 0.2,
    });
    
    // Create 5-10 cloud puffs per cloud
    const puffCount = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < puffCount; i++) {
      const puffSize = Math.random() * 5 + 5;
      const geometry = new THREE.SphereGeometry(puffSize, 8, 8);
      const puff = new THREE.Mesh(geometry, material);
      
      // Position puffs to form a more natural cloud shape
      puff.position.set(
        Math.random() * 10 - 5,
        Math.random() * 5 - 2.5,
        Math.random() * 10 - 5
      );
      
      // Scale puffs randomly for more variety
      const scaleX = Math.random() * 0.5 + 0.5;
      const scaleY = Math.random() * 0.3 + 0.7;
      const scaleZ = Math.random() * 0.5 + 0.5;
      puff.scale.set(scaleX, scaleY, scaleZ);
      
      group.add(puff);
    }
    
    // Scale the entire cloud
    const cloudScale = Math.random() * 2 + 1;
    group.scale.set(cloudScale, cloudScale * 0.6, cloudScale);
    
    return group;
  }
  
  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Move clouds slowly with a slight bobbing motion
    this.clouds.forEach((cloud, index) => {
      cloud.position.z += deltaTime * 5;
      cloud.position.y += Math.sin(Date.now() * 0.001 + index) * deltaTime * 0.5;
      
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
    
    // Move ground with player (x/z only to keep it below)
    this.ground.position.x = playerPosition.x;
    this.ground.position.z = playerPosition.z;
    
    // Update directional light position relative to player
    this.directionalLight.position.set(
      playerPosition.x + 100,
      playerPosition.y + 100,
      playerPosition.z
    );
    
    // Update hemisphere light position
    this.hemiLight.position.set(
      playerPosition.x,
      playerPosition.y + 200,
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
    
    if (this.ground.geometry) this.ground.geometry.dispose();
    if (this.ground.material instanceof THREE.Material) {
      this.ground.material.dispose();
    }
    
    this.scene.remove(this.skybox);
    this.scene.remove(this.ground);
    this.scene.remove(this.directionalLight);
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.hemiLight);
  }
}