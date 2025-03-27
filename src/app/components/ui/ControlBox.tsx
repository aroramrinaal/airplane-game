'use client';

import { useEffect, useState } from 'react';

interface ControlConfig {
  key: string;
  action: string;
}

interface ControlBoxProps {
  controls?: ControlConfig[];
  position?: 'top-left' | 'top-middle' | 'top-right';
  visibilityDuration?: number;
  alwaysVisible?: boolean;
}

export function ControlBox({
  controls = [],
  position = 'top-middle',
  visibilityDuration = 5000,
  alwaysVisible = false,
}: ControlBoxProps) {
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const showControls = () => {
      setVisible(true);
      
      if (!alwaysVisible) {
        clearTimeout(timeout);
        timeout = setTimeout(() => setVisible(false), visibilityDuration);
      }
    };
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Show controls on mouse movement or key press
    document.addEventListener('mousemove', showControls);
    document.addEventListener('keydown', showControls);
    window.addEventListener('resize', handleResize);
    
    handleResize();
    showControls();
    
    return () => {
      document.removeEventListener('mousemove', showControls);
      document.removeEventListener('keydown', showControls);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [visibilityDuration, alwaysVisible]);
  
  // Position classes based on the position prop
  const positionClasses = {
    'top-left': 'left-4',
    'top-middle': 'left-1/2 -translate-x-1/2',
    'top-right': 'right-4',
  };
  
  // Use top-left on mobile, otherwise use the specified position
  const positionClass = positionClasses[isMobile ? 'top-left' : position];
  
  if (!visible && minimized) return null;
  
  return (
    <div
      className={`fixed top-4 ${positionClass} transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        backgroundColor: 'rgba(200, 200, 200, 0.7)',
        color: 'black',
        padding: '8px',
        borderRadius: '4px',
        zIndex: 1000,
        maxWidth: isMobile ? '150px' : '200px',
        fontSize: isMobile ? '12px' : '14px',
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Controls</h3>
        <button
          className="text-xs bg-gray-700 text-white px-2 py-1 rounded"
          onClick={() => setMinimized(!minimized)}
        >
          {minimized ? '+' : '-'}
        </button>
      </div>
      
      {!minimized && (
        <div className="flex flex-col gap-1">
          {controls.map((control, index) => (
            <div key={index} className="flex justify-between gap-2">
              <span className="font-bold">{control.key}</span>
              <span>{control.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}