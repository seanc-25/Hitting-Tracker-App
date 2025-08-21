'use client';

import React, { useRef, useCallback } from 'react';

interface FieldProps {
  onLocationSelect: (x: number, y: number) => void;
  className?: string;
  selectedLocation?: { x: number; y: number } | null;
}

const Field: React.FC<FieldProps> = ({ onLocationSelect, className = '', selectedLocation = null }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    // Calculate click coordinates relative to the SVG
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert to relative coordinates (0-1 range)
    const relativeX = x / rect.width;
    const relativeY = y / rect.height;
    
    onLocationSelect(relativeX, relativeY);
  }, [onLocationSelect]);

  return (
    <div className={`flex justify-center items-center w-full ${className}`}>
      {/* Alternative CSS cropping approach - uncomment if viewBox adjustment doesn't work well */}
      {/* <div className="relative w-full max-w-md overflow-hidden" style={{ clipPath: 'inset(10% 15% 10% 15%)' }}> */}
      <div className="relative w-full max-w-md">
        <svg
          ref={svgRef}
          onClick={handleClick}
          className="w-full h-auto cursor-crosshair"
          viewBox="30 20 540 560"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
            <path 
              d="M 0.00270898 2.000434 L 510.69587 2.000434" 
              transform="matrix(0.53033,-0.53033,0.53033,0.53033,297.664236,523.585078)"
              fill="none"
              stroke="#4a5568"
              strokeWidth="2"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              className="hover:stroke-gray-400 transition-colors"
            />
            <path 
              d="M -0.0000689667 1.996704 L 507.335749 2.000437" 
              transform="matrix(0.528893,0.531079,-0.531079,0.528893,32.400288,253.983057)"
              fill="none"
              stroke="#4a5568"
              strokeWidth="2"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              className="hover:stroke-gray-400 transition-colors"
            />
            <path 
              d="M 1.600146 240.992106 C 240.265834 -77.662741 478.937134 -77.666983 717.603555 240.994973" 
              transform="matrix(0.749413,-0.00316181,0.00316181,0.749413,29.374796,76.566586)"
              fill="none"
              stroke="#4a5568"
              strokeWidth="2"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              className="hover:stroke-gray-400 transition-colors"
            />
            <path 
              d="M 1.502555 108.022126 C 125.363064 -33.339641 249.223572 -33.339641 373.078878 108.022126" 
              transform="matrix(0.750845,0,0,0.747749,158.774158,302.781247)"
              fill="none"
              stroke="#4a5568"
              strokeWidth="2"
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeMiterlimit="4"
              className="hover:stroke-gray-400 transition-colors"
            />
            
            {/* Show selected location marker */}
            {selectedLocation && (
              <circle 
                cx={30 + selectedLocation.x * 540} 
                cy={20 + selectedLocation.y * 560} 
                r="8" 
                fill="#3b82f6" 
                stroke="#1e40af" 
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Field; 