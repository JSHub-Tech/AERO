import { useEffect, useState, useRef } from 'react';

// Cursor-Following Airplane
export default function CursorPlane() {
  const [pos, setPos] = useState({ x: -100, y: -100, rotation: 0 });
  const currentPos = useRef({ x: -100, y: -100, rotation: 0 });
  const targetPos = useRef({ x: -100, y: -100 });
  const requestRef = useRef();

  useEffect(() => {
    const handleMouseMove = (e) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      const dx = targetPos.current.x - currentPos.current.x;
      const dy = targetPos.current.y - currentPos.current.y;
      
      currentPos.current.x += dx * 0.08;
      currentPos.current.y += dy * 0.08;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        // SVG plane points straight up natively, so +90 degrees aligns it to the right (angle 0)
        currentPos.current.rotation = angle + 90; 
      }

      setPos({ ...currentPos.current });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div 
      className="fixed pointer-events-none z-[99999] text-[#A89411] drop-shadow-[0_5px_15px_rgba(168,148,17,0.5)] opacity-100"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
      }}
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
         {/* Top-down plane silhouette */}
         <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    </div>
  );
}
