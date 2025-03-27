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
  private mountains: THREE.Group;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.clouds = [];
    
    // Set the scene's background color to ensure it's never black
    scene.background = new THREE.Color(0x87CEEB); // Sky blue as fallback
    
    // Create skybox
    this.skybox = this.createSkybox();
    scene.add(this.skybox);
    
    // Create mountains
    this.mountains = this.createMountains();
    scene.add(this.mountains);
    
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
    const geometry = new THREE.SphereGeometry(1000, 32, 32);
    // Invert the geometry so that the texture is on the inside
    geometry.scale(-1, 1, 1);
    
    // Create a more vibrant gradient material for the sky
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
      uniform vec3 middleColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        vec3 color = mix(bottomColor, middleColor, t);
        if (h > 0.1) {
          color = mix(middleColor, topColor, (h - 0.1) / 0.9);
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    const uniforms = {
      topColor: { value: new THREE.Color(0x0044AA) },     // Deep blue
      middleColor: { value: new THREE.Color(0x1E90FF) },  // Dodger blue
      bottomColor: { value: new THREE.Color(0x87CEEB) },  // Sky blue
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
    // Create a very large ground plane with more detail
    const geometry = new THREE.PlaneGeometry(10000, 10000, 128, 128);
    
    // Add some subtle height variation to the ground
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      // Skip the center area (to keep the runway flat)
      const x = vertices[i];
      const z = vertices[i + 2];
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      
      if (distanceFromCenter > 100) {
        // Add some slight height variation
        vertices[i + 1] = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 5;
      }
    }
    
    // Create a checkerboard texture for the ground
    const textureSize = 2048;
    const fieldSize = 256;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Mesh();
    
    // Draw a mix of green fields and some roads
    context.fillStyle = '#4CAF50'; // Base green
    context.fillRect(0, 0, textureSize, textureSize);
    
    const drawField = (x: number, y: number, size: number) => {
      context.fillStyle = '#388E3C'; // Darker green
      context.fillRect(x, y, size, size);
    };
    
    // Create some field patterns
    for (let x = 0; x < textureSize; x += fieldSize) {
      for (let y = 0; y < textureSize; y += fieldSize) {
        if (Math.random() > 0.6) {
          drawField(x, y, fieldSize);
        }
      }
    }
    
    // Add some roads
    context.fillStyle = '#795548'; // Brown for dirt roads
    context.fillRect(textureSize / 2 - 20, 0, 40, textureSize); // North-south road
    context.fillRect(0, textureSize / 2 - 20, textureSize, 40); // East-west road
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    
    // Create a material with the ground texture
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -5; // Position below the airplane
    ground.receiveShadow = true;
    
    return ground;
  }
  
  private createMountains(): THREE.Group {
    const mountains = new THREE.Group();
    
    // Create distant mountains
    const createMountain = (x: number, z: number, height: number, radius: number, color: number) => {
      const geometry = new THREE.ConeGeometry(radius, height, 8);
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        metalness: 0.1,
      });
      
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.set(x, height / 2 - 5, z);
      mountain.castShadow = true;
      mountain.receiveShadow = true;
      
      return mountain;
    };
    
    // Add several mountains in the distance
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = 800 + Math.random() * 200;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const height = 100 + Math.random() * 200;
      const mountainRadius = 80 + Math.random() * 120;
      
      // Different colors for the mountains
      let color;
      if (Math.random() > 0.7) {
        color = 0x8B4513; // Brown
      } else {
        color = 0x556B2F; // Dark Olive Green
      }
      
      mountains.add(createMountain(x, z, height, mountainRadius, color));
    }
    
    return mountains;
  }
  
  private createDirectionalLight(): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 1, 1).normalize().multiplyScalar(100);
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
    return new THREE.AmbientLight(0xFFFFFF, 0.4);
  }
  
  private createHemisphereLight(): THREE.HemisphereLight {
    // Add hemisphere light (sky color, ground color, intensity)
    return new THREE.HemisphereLight(0x0077FF, 0x228B22, 0.6);
  }
  
  private createClouds(): void {
    // Create 80 cloud groups for more fullness
    for (let i = 0; i < 80; i++) {
      const cloud = this.createCloudGroup();
      
      // Position clouds randomly in the sky
      cloud.position.set(
        Math.random() * 800 - 400,
        Math.random() * 100 + 30,
        Math.random() * 800 - 400
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
      emissive: 0x666666,
      roughness: 0.7,
      metalness: 0.1,
    });
    
    // Create 5-10 cloud puffs per cloud
    const puffCount = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < puffCount; i++) {
      const puffSize = Math.random() * 8 + 10;
      const geometry = new THREE.SphereGeometry(puffSize, 8, 8);
      const puff = new THREE.Mesh(geometry, material);
      
      // Position puffs to form a more natural cloud shape
      puff.position.set(
        Math.random() * 20 - 10,
        Math.random() * 5 - 2.5,
        Math.random() * 20 - 10
      );
      
      // Scale puffs randomly for more variety
      const scaleX = Math.random() * 0.5 + 0.5;
      const scaleY = Math.random() * 0.3 + 0.7;
      const scaleZ = Math.random() * 0.5 + 0.5;
      puff.scale.set(scaleX, scaleY, scaleZ);
      
      group.add(puff);
    }
    
    // Scale the entire cloud
    const cloudScale = Math.random() * 2 + 2; // Bigger clouds
    group.scale.set(cloudScale, cloudScale * 0.6, cloudScale);
    
    return group;
  }
  
  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // Move clouds slowly with a slight bobbing motion
    this.clouds.forEach((cloud, index) => {
      cloud.position.z += deltaTime * 5;
      cloud.position.y += Math.sin(Date.now() * 0.001 + index) * deltaTime * 0.5;
      
      // If cloud is too far behind the player, move it ahead
      if (cloud.position.z > playerPosition.z + 400) {
        cloud.position.z = playerPosition.z - 400;
        cloud.position.x = Math.random() * 800 - 400;
        cloud.position.y = Math.random() * 100 + 30;
      }
      
      // Rotate clouds slowly for a more dynamic look
      cloud.rotation.y += deltaTime * 0.05;
    });
    
    // Move skybox with player
    this.skybox.position.copy(playerPosition);
    
    // Move ground and mountains with player (x/z only to keep y position)
    this.ground.position.x = playerPosition.x;
    this.ground.position.z = playerPosition.z;
    
    this.mountains.position.x = playerPosition.x;
    this.mountains.position.z = playerPosition.z;
    
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
    
    // Dispose of mountains
    this.mountains.children.forEach(mountain => {
      if (mountain instanceof THREE.Mesh) {
        mountain.geometry.dispose();
        if (mountain.material instanceof THREE.Material) {
          mountain.material.dispose();
        }
      }
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
    this.scene.remove(this.mountains);
    this.scene.remove(this.directionalLight);
    this.scene.remove(this.ambientLight);
    this.scene.remove(this.hemiLight);
  }
}