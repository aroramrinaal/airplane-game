'use client';

import { useEffect, useRef, useState } from 'react';

interface ButtonConfig {
  id: string;
  label: string;
  position: 'left' | 'right' | 'bottom';
}

interface MobileControlsProps {
  joystick?: boolean;
  buttons?: ButtonConfig[];
  visibilityDuration?: number;
  onJoystickMove?: (x: number, y: number) => void;
  onButtonPress?: (buttonId: string) => void;
  onButtonRelease?: (buttonId: string) => void;
}

export function MobileControls({
  joystick = true,
  buttons = [],
  visibilityDuration = 3000,
  onJoystickMove,
  onButtonPress,
  onButtonRelease,
}: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [touching, setTouching] = useState(false);
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Show controls when the screen is touched
  useEffect(() => {
    const showControls = () => {
      setVisible(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (!touching) {
          setVisible(false);
        }
      }, visibilityDuration);
    };
    
    document.addEventListener('touchstart', showControls);
    showControls();
    
    return () => {
      document.removeEventListener('touchstart', showControls);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visibilityDuration, touching]);
  
  // Joystick functionality
  useEffect(() => {
    if (!joystick || !joystickRef.current || !knobRef.current) return;
    
    const joystickElement = joystickRef.current;
    const knobElement = knobRef.current;
    let active = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    
    const handleStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = joystickElement.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      currentX = touch.clientX;
      currentY = touch.clientY;
      active = true;
      setTouching(true);
    };
    
    const handleMove = (e: TouchEvent) => {
      if (!active) return;
      e.preventDefault();
      
      const touch = e.touches[0];
      currentX = touch.clientX;
      currentY = touch.clientY;
      
      // Calculate the distance from the center
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 50; // Maximum joystick movement
      
      // Normalize the distance
      const normalizedDistance = Math.min(distance, maxDistance);
      const angle = Math.atan2(deltaY, deltaX);
      
      // Calculate the knob position
      const knobX = Math.cos(angle) * normalizedDistance;
      const knobY = Math.sin(angle) * normalizedDistance;
      
      // Update the knob position
      knobElement.style.transform = `translate(${knobX}px, ${knobY}px)`;
      
      // Calculate normalized values (-1 to 1)
      const normalizedX = knobX / maxDistance;
      const normalizedY = knobY / maxDistance;
      
      // Call the callback
      onJoystickMove?.(normalizedX, normalizedY);
    };
    
    const handleEnd = () => {
      active = false;
      setTouching(false);
      
      // Reset the knob position
      knobElement.style.transform = 'translate(0px, 0px)';
      
      // Call the callback with zero values
      onJoystickMove?.(0, 0);
    };
    
    joystickElement.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    
    return () => {
      joystickElement.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [joystick, onJoystickMove]);
  
  // Group buttons by position
  const buttonsByPosition = buttons.reduce((acc, button) => {
    if (!acc[button.position]) {
      acc[button.position] = [];
    }
    acc[button.position].push(button);
    return acc;
  }, {} as Record<string, ButtonConfig[]>);
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 p-4 ${
        visible ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300`}
      style={{ zIndex: 1000 }}
    >
      {/* Joystick */}
      {joystick && (
        <div
          ref={joystickRef}
          className="absolute bottom-8 left-8 w-32 h-32 rounded-full"
          style={{
            backgroundColor: 'rgba(100, 100, 100, 0.5)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <div
            ref={knobRef}
            className={`absolute top-1/2 left-1/2 w-16 h-16 -mt-8 -ml-8 rounded-full ${
              touching ? 'bg-gray-400' : 'bg-gray-600'
            }`}
            style={{
              backgroundColor: touching ? 'rgba(200, 200, 200, 0.8)' : 'rgba(150, 150, 150, 0.8)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
            }}
          />
        </div>
      )}
      
      {/* Right buttons */}
      {buttonsByPosition.right && (
        <div className="absolute bottom-8 right-8 flex flex-col gap-4">
          {buttonsByPosition.right.map((button) => (
            <button
              key={button.id}
              className="w-16 h-16 rounded-full text-black font-bold"
              style={{
                backgroundColor: 'rgba(100, 100, 100, 0.5)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                onButtonPress?.(button.id);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onButtonRelease?.(button.id);
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Left buttons */}
      {buttonsByPosition.left && (
        <div className="absolute bottom-8 left-8 ml-36 flex flex-col gap-4">
          {buttonsByPosition.left.map((button) => (
            <button
              key={button.id}
              className="w-16 h-16 rounded-full text-black font-bold"
              style={{
                backgroundColor: 'rgba(100, 100, 100, 0.5)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                onButtonPress?.(button.id);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onButtonRelease?.(button.id);
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Bottom buttons */}
      {buttonsByPosition.bottom && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          {buttonsByPosition.bottom.map((button) => (
            <button
              key={button.id}
              className="w-16 h-16 rounded-full text-black font-bold"
              style={{
                backgroundColor: 'rgba(100, 100, 100, 0.5)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                onButtonPress?.(button.id);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                onButtonRelease?.(button.id);
              }}
            >
              {button.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}