import { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls, Bounds, ContactShadows, Float, Center, Html } from '@react-three/drei';
import { Plane, Users, Gauge, ChevronRight, Loader2 } from 'lucide-react';
import * as THREE from 'three';
import Footer from '../components/Footer';

const FLEET_DATA = [
  {
    id: 'airbus',
    name: 'Airbus A320',
    subtitle: 'The backbone of our short-haul network. Efficiency meets supreme comfort.',
    seats: 170,
    speed: 828,
    url: '/3D Models/airbus.glb',
    scale: 0.055, // Shrunk slightly based on feedback
    rotation: [0, -Math.PI / 4, 0], 
  },
  {
    id: 'boeing',
    name: 'Boeing 777',
    subtitle: 'Our flagship widebody. Unparalleled luxury for long-haul international flights.',
    seats: 393,
    speed: 905,
    url: '/3D Models/boeing.glb',
    scale: 0.25, // CONFIRMED PERFECT
    rotation: [0, -Math.PI / 4, 0],
  },
  {
    id: 'atr',
    name: 'ATR 72-500',
    subtitle: 'Connecting regional communities with twin-engine turboprop reliability.',
    seats: 70,
    speed: 510,
    url: '/3D Models/atr.glb',
    scale: 1.1, // Increased slightly based on feedback
    rotation: [0, -Math.PI / 4, 0],
  }
];

function AircraftModel({ url, scale, rotation }) {
  const { scene } = useGLTF(url);
  
  return (
    <group rotation={rotation} scale={scale} position={[0, -1, 0]}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

// Simple loading spinner for the 3D canvas
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center text-[#004F30]">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <span className="font-bold tracking-widest text-xs uppercase">Loading Model...</span>
      </div>
    </Html>
  );
}

export default function Fleet() {
  // The 3D models will be cached by useGLTF automatically, so we don't need to manually clear them.

  const [activeIndex, setActiveIndex] = useState(0);
  const activePlane = FLEET_DATA[activeIndex];

  return (
    <div className="w-full flex flex-col relative bg-gradient-to-br from-[#E8F0EA] to-[#F8F9FA]">
      
      {/* 3D Canvas & UI Container (Full Screen height) */}
      <div className="w-full h-screen relative">
        
        {/* 3D Canvas Background Layer */}
        <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 2, 10], fov: 45 }} dpr={[1, 1.5]}>
          <Suspense fallback={<Loader />}>
            <Environment preset="city" />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            
            {/* Allows the user to click and drag to spin the plane 360 degrees in all directions! */}
            <OrbitControls 
              autoRotate 
              autoRotateSpeed={0.8} 
              enableZoom={false} 
            />

            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
              <AircraftModel key={activePlane.id} url={activePlane.url} scale={activePlane.scale} rotation={activePlane.rotation} />
            </Float>

            {/* A low-res baked shadow for realism without melting the GPU */}
            <ContactShadows position={[0, -3, 0]} opacity={0.3} scale={30} blur={2.5} resolution={256} frames={1} />
          </Suspense>
        </Canvas>
      </div>

      {/* HTML UI Overlay Layer */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-8 md:px-12 flex items-center pointer-events-none">
        
        {/* Left Side: Navigation & Specs */}
        <div className="w-full max-w-sm pointer-events-auto mt-20">
          
          {/* Glassmorphic Info Card */}
          <div key={activePlane.id} className="bg-[#004F30]/90 backdrop-blur-xl border border-[#0A6B41] p-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] mb-6 animate-in slide-in-from-left-4 fade-in duration-500">
            <h2 className="text-4xl font-extrabold text-white mb-3 leading-tight">
              {activePlane.name}
            </h2>
            <p className="text-white/80 font-medium mb-6 text-sm leading-relaxed">
              {activePlane.subtitle}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-2xl p-4 shadow-inner border border-white/10">
                <Users className="w-5 h-5 text-[#A89411] opacity-80 mb-2" />
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Capacity</div>
                <div className="text-xl font-bold text-white">{activePlane.seats}</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 shadow-inner border border-white/10">
                <Gauge className="w-5 h-5 text-[#A89411] opacity-80 mb-2" />
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Speed</div>
                <div className="text-xl font-bold text-white">{activePlane.speed} <span className="text-sm opacity-80">km/h</span></div>
              </div>
            </div>
          </div>

          {/* Plane Selector Buttons */}
          <div className="flex flex-col gap-3">
            {FLEET_DATA.map((plane, idx) => (
              <button
                key={plane.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 font-bold border cursor-pointer ${
                  activeIndex === idx 
                  ? 'bg-[#004F30] text-white border-[#004F30] shadow-lg shadow-[#004F30]/30 translate-x-3' 
                  : 'bg-white/70 text-gray-500 border-white hover:bg-white hover:text-[#1C2B22]'
                }`}
              >
                <span>{plane.name}</span>
                <ChevronRight className={`w-5 h-5 transition-opacity ${activeIndex === idx ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>

        </div>
        
        {/* Bottom Right Helper Text */}
        <div className="absolute bottom-12 right-12 flex flex-col items-end opacity-60 pointer-events-none select-none">
           <span className="text-sm font-black uppercase tracking-widest text-[#1C2B22] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              Click & Drag
           </span>
           <span className="text-xs font-bold text-gray-500 tracking-wider">TO ROTATE 360°</span>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
