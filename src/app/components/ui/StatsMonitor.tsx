'use client';

import { useEffect, useState } from 'react';
import * as THREE from 'three';

interface StatsMonitorProps {
  showFPS?: boolean;
  showMobileStatus?: boolean;
  showPosition?: boolean;
  showScore?: boolean;
  showSpeed?: boolean;
  score?: number;
  position?: THREE.Vector3;
  speed?: number;
}

export function StatsMonitor({
  showFPS = true,
  showMobileStatus = true,
  showPosition = true,
  showScore = true,
  showSpeed = true,
  score = 0,
  position = new THREE.Vector3(),
  speed = 0,
}: StatsMonitorProps) {
  const [fps, setFps] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    // FPS calculation
    const updateFPS = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    // Mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    const frameId = requestAnimationFrame(updateFPS);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);
  
  return (
    <div 
      className={`fixed top-4 right-4 bg-gray-800 bg-opacity-50 text-black p-2 rounded ${
        isMobile ? 'text-xs' : 'text-sm'
      }`}
      style={{ 
        backgroundColor: 'rgba(200, 200, 200, 0.7)',
        minWidth: isMobile ? '100px' : '150px',
        zIndex: 1000
      }}
    >
      {showFPS && <div>FPS: {fps}</div>}
      {showMobileStatus && <div>Mobile: {isMobile ? 'Yes' : 'No'}</div>}
      {showPosition && (
        <div>
          Position: {position.x.toFixed(1)}, {position.y.toFixed(1)}, {position.z.toFixed(1)}
        </div>
      )}
      {showScore && <div>Score: {score}</div>}
      {showSpeed && <div>Speed: {Math.round(speed)} units</div>}
    </div>
  );
}