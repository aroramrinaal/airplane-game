'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SkyEnvironment } from './SkyEnvironment';
import { Airplane } from './entities/Airplane';
import { Obstacle } from './entities/Obstacle';
import { Airport } from './entities/Airport';
import { ControlBox } from './ui/ControlBox';

interface GameState {
  score: number;
  isGameOver: boolean;
  playerPosition: THREE.Vector3;
  gamePhase: 'takeoff' | 'flight';
  speed: number;
}

export default function AirplaneGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const airplaneRef = useRef<Airplane | null>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const airportRef = useRef<Airport | null>(null);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const environmentRef = useRef<SkyEnvironment | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isGameOver: false,
    playerPosition: new THREE.Vector3(0, 0, 0),
    gamePhase: 'takeoff',
    speed: 0,
  });

  // Initialize the game
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create sky environment
    const environment = new SkyEnvironment(scene);
    environmentRef.current = environment;
    
    // Create airport
    const airport = new Airport(scene);
    airportRef.current = airport;
    
    // Create airplane - position it at the start of the runway
    const airplane = new Airplane(scene);
    
    // Position the airplane precisely on the runway
    airplane.mesh.position.set(0, 0.5, 0); // Slightly above the runway
    airplane.mesh.rotation.set(0, Math.PI, 0); // Face down the runway
    
    // Ensure velocity is zero initially
    airplane.velocity.set(0, 0, 0);
    
    airplaneRef.current = airplane;
    
    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Handle keyboard controls
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!airplaneRef.current) return;
      
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          airplaneRef.current.controls.up = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          airplaneRef.current.controls.down = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          airplaneRef.current.controls.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          airplaneRef.current.controls.right = true;
          break;
        case 'Space':
          airplaneRef.current.controls.boost = true;
          break;
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!airplaneRef.current) return;
      
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          airplaneRef.current.controls.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          airplaneRef.current.controls.down = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          airplaneRef.current.controls.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          airplaneRef.current.controls.right = false;
          break;
        case 'Space':
          airplaneRef.current.controls.boost = false;
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Start animation loop
    lastTimeRef.current = performance.now();
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      
      cancelAnimationFrame(frameIdRef.current);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      // Dispose of geometries and materials
      obstaclesRef.current.forEach(obstacle => obstacle.dispose());
      if (airplaneRef.current) airplaneRef.current.dispose();
      if (environmentRef.current) environmentRef.current.dispose();
      if (airportRef.current) airportRef.current.dispose();
    };
  }, []);
  
  // Animation loop
  const animate = () => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1); // Cap delta time to prevent large jumps
    lastTimeRef.current = currentTime;
    
    if (
      sceneRef.current &&
      cameraRef.current &&
      rendererRef.current &&
      airplaneRef.current &&
      !gameState.isGameOver
    ) {
      // Update airplane based on game phase
      if (gameState.gamePhase === 'takeoff') {
        handleTakeoffPhase(deltaTime);
      } else {
        handleFlightPhase(deltaTime);
      }
      
      // Update camera to follow airplane
      updateCamera();
      
      // Update environment
      if (environmentRef.current) {
        environmentRef.current.update(deltaTime, airplaneRef.current.mesh.position);
      }
      
      // Update player position and speed for stats
      setGameState(prev => ({
        ...prev,
        playerPosition: airplaneRef.current!.mesh.position.clone(),
        speed: airplaneRef.current!.velocity.length()
      }));
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    frameIdRef.current = requestAnimationFrame(animate);
  };
  
  // Handle takeoff phase
  const handleTakeoffPhase = (deltaTime: number) => {
    if (!airplaneRef.current) return;
    
    // Update airplane with limited controls during takeoff
    airplaneRef.current.updateTakeoff(deltaTime);
    
    // Check if airplane has taken off - only consider it taken off
    // if it has moved a significant distance and gained altitude
    if (airplaneRef.current.mesh.position.z < -50 && airplaneRef.current.mesh.position.y > 5) {
      // Transition to flight phase
      setGameState(prev => ({ ...prev, gamePhase: 'flight' }));
      
      // Generate obstacles
      generateObstacles();
    }
  };
  
  // Handle flight phase
  const handleFlightPhase = (deltaTime: number) => {
    if (!airplaneRef.current || !sceneRef.current) return;
    
    // Update airplane with full controls during flight
    airplaneRef.current.update(deltaTime);
    
    const airplanePosition = airplaneRef.current.mesh.position;
    
    // Update obstacles
    obstaclesRef.current.forEach(obstacle => {
      obstacle.update(deltaTime);
      
      // Check for collisions with airplane
      if (obstacle.checkCollision(airplaneRef.current!.mesh)) {
        setGameState(prev => ({ ...prev, isGameOver: true }));
      }
    });
    
    // Remove obstacles that are too far behind
    obstaclesRef.current = obstaclesRef.current.filter(obstacle => {
      if (obstacle.mesh.position.z > airplanePosition.z + 50) {
        sceneRef.current!.remove(obstacle.mesh);
        obstacle.dispose();
        return false;
      }
      return true;
    });
    
    // Add new obstacles if needed
    if (obstaclesRef.current.length < 5) {
      addObstacle();
    }
    
    // Increase score based on distance flown
    if (frameIdRef.current % 60 === 0) { // Update score every ~1 second
      setGameState(prev => ({ 
        ...prev, 
        score: Math.floor(Math.abs(airplanePosition.z) / 10)
      }));
    }
  };
  
  // Update camera based on game phase
  const updateCamera = () => {
    if (!cameraRef.current || !airplaneRef.current) return;
    
    const airplanePosition = airplaneRef.current.mesh.position.clone();
    
    if (gameState.gamePhase === 'takeoff') {
      // During takeoff, position camera behind and slightly above the airplane
      const cameraOffset = new THREE.Vector3(0, 3, 15);
      cameraRef.current.position.copy(airplanePosition).add(cameraOffset);
      cameraRef.current.lookAt(airplanePosition);
    } else {
      // During flight, position camera behind and above the airplane
      const cameraOffset = new THREE.Vector3(0, 5, 15);
      // Apply airplane's rotation to the camera offset
      cameraOffset.applyQuaternion(airplaneRef.current.mesh.quaternion);
      cameraRef.current.position.copy(airplanePosition).add(cameraOffset);
      
      // Look at a point ahead of the airplane
      const lookAtOffset = new THREE.Vector3(0, 0, -10);
      lookAtOffset.applyQuaternion(airplaneRef.current.mesh.quaternion);
      const lookAtPoint = airplanePosition.clone().add(lookAtOffset);
      cameraRef.current.lookAt(lookAtPoint);
    }
  };
  
  // Generate initial obstacles
  const generateObstacles = () => {
    if (!sceneRef.current || !airplaneRef.current) return;
    
    const airplanePosition = airplaneRef.current.mesh.position;
    
    // Create obstacles
    for (let i = 0; i < 5; i++) {
      const obstacle = new Obstacle(
        new THREE.Vector3(
          Math.random() * 60 - 30,
          Math.random() * 20 + 10, // Higher altitude for obstacles
          airplanePosition.z - 100 - Math.random() * 100
        )
      );
      obstaclesRef.current.push(obstacle);
      sceneRef.current.add(obstacle.mesh);
    }
  };
  
  // Add a new obstacle
  const addObstacle = () => {
    if (!sceneRef.current || !airplaneRef.current) return;
    
    const airplanePosition = airplaneRef.current.mesh.position;
    const obstacle = new Obstacle(
      new THREE.Vector3(
        Math.random() * 60 - 30,
        Math.random() * 20 + 10, // Higher altitude for obstacles
        airplanePosition.z - 200 - Math.random() * 50
      )
    );
    obstaclesRef.current.push(obstacle);
    sceneRef.current.add(obstacle.mesh);
  };
  
  // Restart game
  const restartGame = () => {
    if (!sceneRef.current || !airplaneRef.current) return;
    
    // Reset airplane position to the start of the runway
    airplaneRef.current.mesh.position.set(0, 0.5, 0);
    airplaneRef.current.mesh.rotation.set(0, Math.PI, 0);
    airplaneRef.current.velocity.set(0, 0, 0);
    
    // Clear obstacles
    obstaclesRef.current.forEach(obstacle => {
      sceneRef.current!.remove(obstacle.mesh);
      obstacle.dispose();
    });
    obstaclesRef.current = [];
    
    // Reset game state
    setGameState({
      score: 0,
      isGameOver: false,
      playerPosition: new THREE.Vector3(0, 0.5, 0),
      gamePhase: 'takeoff',
      speed: 0,
    });
  };
  
  // Get takeoff instructions based on game phase
  const getTakeoffInstructions = () => {
    if (gameState.gamePhase !== 'takeoff') return null;
    
    return (
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-4 rounded text-center">
        <h3 className="text-lg font-bold mb-2">Takeoff Instructions</h3>
        <p className="mb-2">Hold <span className="font-bold">SPACE</span> to accelerate down the runway</p>
        <p className="mb-2">Pull back (press <span className="font-bold">W</span> or <span className="font-bold">↑</span>) when fast enough to take off</p>
        <p>Current Speed: {Math.round(gameState.speed)} units</p>
      </div>
    );
  };
  
  return (
    <div ref={containerRef} className="w-full h-screen relative">
      {/* Game HUD */}
      <div className="absolute top-0 left-0 p-4 bg-black bg-opacity-50 text-white">
        <p>Score: {gameState.score}</p>
        <p>Speed: {Math.round(gameState.speed)}</p>
        <p>Altitude: {Math.round(gameState.playerPosition.y)}</p>
      </div>
      
      {/* Control Box */}
      <ControlBox
        controls={[
          { key: 'W/↑', action: 'Pitch Up' },
          { key: 'S/↓', action: 'Pitch Down' },
          { key: 'A/←', action: 'Roll Left' },
          { key: 'D/→', action: 'Roll Right' },
          { key: 'Space', action: 'Boost/Throttle' },
        ]}
        position="top-middle"
        visibilityDuration={5000}
      />
      
      {/* Takeoff Instructions */}
      {getTakeoffInstructions()}
      
      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over</h2>
            <p className="mb-4">Your score: {gameState.score}</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={restartGame}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}