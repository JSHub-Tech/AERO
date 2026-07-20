import { Database, Network, Zap, Cuboid, Globe2, ShieldCheck, HeartHandshake, Route, Cpu, MonitorSmartphone, MessageCircle, Sparkles, Clock, Compass } from 'lucide-react';
import Footer from '../components/Footer';
import { useAnimateOnScroll } from '../components/animation';
import { useEffect } from 'react';

const AI_FEATURES = [
  { icon: Sparkles, title: 'Ask, Don\u2019t Search', desc: 'Just tell it what you need \u2014 "cheapest flight to Karachi next weekend" \u2014 and get a straight answer, no endless filters.', dir: 'left' },
  { icon: Clock, title: 'Always On', desc: 'Day or night, it\u2019s ready to help with bookings, gate info, or a quick question about your trip.', dir: 'up' },
  { icon: Compass, title: 'Knows AERO Inside Out', desc: 'From routes to real-time status, it understands our network so you get answers, not guesswork.', dir: 'right' },
];

const TEAM = [
  {
    name: 'Muhammad Jamal Matloob',
    rank: 'Fleet Admiral',
    icon: Route,
    description: '...',
    image: '/pilots/1.png'
  },
  {
    name: 'Muhammad Umer',
    rank: 'Commander',
    icon: Cpu,
    description: '...',
    image: '/pilots/2.png'
  },
  {
    name: 'Muhammad Saad Asif',
    rank: 'Captain',
    icon: MonitorSmartphone,
    description: '...',
    image: '/pilots/3.png'
  },
];

const MISSION = [
  { icon: Globe2, title: 'Wider Reach', desc: 'We keep growing our route network so more cities, and the people in them, are within easy reach of each other.', dir: 'left' },
  { icon: ShieldCheck, title: 'Safety First', desc: 'Every flight, on-time update, and gate change you see comes from the same rigorous operational standards we hold ourselves to.', dir: 'up' },
  { icon: HeartHandshake, title: 'Care, Not Just Service', desc: 'Behind every booking is a team that treats your trip like it matters \u2014 because to us, it does.', dir: 'right' },
];

const STACK = [
  { icon: Database, color: 'text-[#336791]', title: 'PostgreSQL', desc: 'Primary source of truth for flight logs and passenger manifests with strict ACID compliance.' },
  { icon: Network, color: 'text-[#018bff]', title: 'Neo4j Graph', desc: 'Powers the routing engine, mapping connections between global hubs instantly.' },
  { icon: Zap, color: 'text-[#dc382d]', title: 'Redis Cache', desc: 'Distributed in-memory caching keeps live aircraft telemetry updates under 50ms.' },
  { icon: Cuboid, color: 'text-[#A89411]', title: 'Three.js', desc: 'Hardware-accelerated WebGL renders the 3D globe and interactive fleet showroom.' },
];

const flyClass = (inView, dir = 'up', delayClass = '') => {
  const hidden = {
    up: '-translate-y-16 rotate-1',
    down: 'translate-y-16 -rotate-1',
    left: '-translate-x-24 -rotate-3',
    right: 'translate-x-24 rotate-3',
  }[dir];

  return `transition-all duration-700 ease-out transform ${delayClass} ${
    inView ? 'opacity-100 translate-x-0 translate-y-0 rotate-0 scale-100' : `opacity-0 scale-90 ${hidden}`
  }`;
};




export default function About({ isSection = false }) {
  const [heroRef, heroInView] = useAnimateOnScroll();
  const [missionRef, missionInView] = useAnimateOnScroll();
  const [aiRef, aiInView] = useAnimateOnScroll();
  const [teamRef, teamInView] = useAnimateOnScroll();
  const [techRef, techInView] = useAnimateOnScroll();

  return (
    <div id="about" className={`w-full flex flex-col bg-transparent relative overflow-x-hidden ${isSection ? 'snap-start' : 'min-h-screen'}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#004F30]/5 blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#A89411]/5 blur-[120px]"></div>
      </div>

      {/* ===== PART 1: THE VISION ===== */}
      <div className={`w-full ${isSection ? '' : 'pt-[60px]'} flex flex-col justify-center snap-start`}>
        <div ref={heroRef} className={`w-full relative flex flex-col items-center py-20 overflow-hidden bg-transparent`}>
          <div className="max-w-[1000px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 relative z-10 text-center">
            <div className={flyClass(heroInView, 'up')}>
              <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full mb-6 sm:mb-8 inline-flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#004F30] animate-pulse"></span>
                <span className="text-[#004F30] text-[10px] font-black tracking-[0.2em] uppercase">Our Story</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-[#1C2B22] tracking-tighter leading-[0.95] mb-6 sm:mb-8">
                GETTING YOU HOME, <br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-[#004F30] to-[#A89411]">EVERY TIME.</span>
              </h1>

              <p className="text-gray-500 text-base sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                AERO connects travelers to the places that matter most. We built our airline around a simple idea: flying should feel dependable, transparent, and human — from the moment you book to the moment you land.
              </p>
            </div>
          </div>
        </div>

        {/* ===== MISSION / VALUES ===== */}
        <div ref={missionRef} className="w-full relative z-10">
          <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 pb-20 sm:pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {MISSION.map(({ icon: Icon, title, desc, dir }, i) => (
              <div
                key={title}
                className={`${flyClass(missionInView, dir, i === 1 ? 'delay-150' : i === 2 ? 'delay-300' : '')} bg-[#004F30] border border-[#0A6B41] p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-[0_20px_60px_rgba(0,79,48,0.15)] hover:-translate-y-2 transition-all duration-300 group`}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#A89411] flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 group-hover:bg-[#D4C345] transition-all duration-500 shadow-md">
                  <Icon className="text-[#1C2B22]" size={28} />
                </div>
                <h3 className="text-white font-black text-lg sm:text-xl mb-2 sm:mb-3 tracking-wide">{title}</h3>
                <p className="text-white/80 text-sm font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* AI ASSISTANT merged into Vision */}
      <div ref={aiRef} className="w-full relative z-10 bg-transparent flex flex-col justify-center pt-10 sm:pt-16 snap-start">
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 pb-20 sm:pb-28 relative z-10">
          <div className={`${flyClass(aiInView, 'up')} bg-[#004F30] border border-[#0A6B41] rounded-[2.5rem] p-8 sm:p-12 md:p-16 mb-12 sm:mb-16 relative overflow-hidden group`}>
            
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#A89411]/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#A89411] backdrop-blur-md rounded-full mb-8 border border-[#D4C345]/50 group-hover:scale-105 transition-transform duration-500 shadow-xl">
                <MessageCircle className="text-[#1C2B22]" size={20} />
                <span className="text-[#1C2B22] text-xs sm:text-sm font-black tracking-[0.2em] uppercase">Introducing AERO AI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#A89411] tracking-tight mb-4 sm:mb-6">
                Your Trip, One Conversation Away.
              </h2>
              <p className="text-white/80 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                Every AERO booking now comes with a built-in assistant. Ask it anything about your flight, your route, or your booking, and it'll help you sort it out — instantly, and in plain language.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {AI_FEATURES.map(({ icon: Icon, title, desc, dir }, i) => (
              <div
                key={title}
                className={`${flyClass(aiInView, dir, i === 1 ? 'delay-150' : i === 2 ? 'delay-300' : '')} bg-[#004F30] border border-[#0A6B41] p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,79,48,0.15)] transition-all duration-300 group`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#A89411] flex items-center justify-center group-hover:bg-[#D4C345] transition-colors shadow-md">
                    <Icon className="text-[#1C2B22]" size={24} />
                  </div>
                </div>
                <h3 className="text-white font-black text-base sm:text-lg mb-2 tracking-wide">{title}</h3>
                <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PART 2: THE ENGINE ===== */}
      <div ref={teamRef} className="w-full relative z-10 bg-transparent overflow-hidden flex flex-col justify-center pt-10 snap-start">
        
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 pb-16 sm:pb-24 relative z-10">
          <div className={`${flyClass(teamInView, 'up')} text-center max-w-2xl mx-auto mb-14 sm:mb-20`}>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full mb-5 sm:mb-6 inline-flex items-center gap-2 shadow-sm">
              <span className="text-[#004F30] text-[10px] font-black tracking-[0.2em] uppercase">The Creators</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1C2B22] tracking-tight mb-4 sm:mb-6">The Brains Behind AERO</h2>
            <p className="text-gray-500 text-base sm:text-lg font-medium leading-relaxed">
              Built and engineered by a dedicated trio obsessed with precision — from the initial runway concept to the final backend runtime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 max-w-5xl mx-auto">
            {TEAM.map(({ name, rank, description, icon: Icon, image }, i) => (
              <div
                key={name}
                className={`${flyClass(teamInView, i % 2 === 0 ? 'left' : 'right', i === 1 ? 'delay-150' : i === 2 ? 'delay-300' : '')} bg-[#004F30] border border-[#0A6B41] px-8 pb-8 pt-0 sm:px-10 sm:pb-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,79,48,0.2)] hover:scale-105 transition-all duration-500 group text-center relative mt-24 sm:mt-32`}
              >
                <div className="absolute inset-0 overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-100 opacity-50"></div>
                </div>
                  {/* Absolutely positioned avatar for perfect centering and overflow */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-[100px] sm:-top-[130px] w-[300px] sm:w-[400px] transition-all duration-500 drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] z-20 pointer-events-none">
                  <img src={image} alt="" loading="lazy" className="w-full h-auto object-contain scale-[1.05]" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
                {/* Spacer to push the card's text content down below the absolute avatar */}
                <div className="h-[120px] sm:h-[150px] w-full"></div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#A89411] border border-[#D4C345]/50 rounded-full group-hover:bg-[#D4C345] transition-colors mb-4 shadow-sm">
                  <Icon className="text-[#1C2B22]" size={14} />
                  <span className="text-[#1C2B22] text-[10px] font-black tracking-[0.2em] uppercase">{rank}</span>
                </div>
                <h3 className="text-white font-black text-lg sm:text-xl tracking-tight uppercase">{name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tech stack merged into Engine */}
      <div ref={techRef} className="w-full relative z-10 flex flex-col justify-center snap-start">
        <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-8 md:px-16 lg:px-24 pb-20 sm:pb-32">

          <div className={`${flyClass(techInView, 'up')} text-center max-w-2xl mx-auto mb-10 sm:mb-14`}>
            <div className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full mb-5 sm:mb-6 inline-flex items-center gap-2 shadow-sm">
              <span className="text-[#004F30] text-[10px] font-black tracking-[0.2em] uppercase">Under the Hood</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1C2B22] tracking-tight mb-4">Built for Scale</h2>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              For the curious: AERO runs on a distributed, multi-database architecture engineered for real-time global fleet tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STACK.map(({ icon: Icon, color, title, desc }, i) => {
              const delayClass = ['', 'delay-150', 'delay-300', 'delay-450'][i] || '';
              return (
                <div
                  key={title}
                  className={`${flyClass(techInView, i % 2 === 0 ? 'down' : 'up', delayClass)} bg-[#004F30] border border-[#0A6B41] p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] hover:shadow-[0_20px_60px_rgba(0,79,48,0.15)] hover:-translate-y-2 transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#A89411] flex items-center justify-center group-hover:bg-[#D4C345] transition-colors shadow-md">
                      <Icon className="text-[#1C2B22]" size={24} />
                    </div>
                  </div>
                  <h3 className="text-white font-black text-base sm:text-lg mb-2 tracking-wide">{title}</h3>
                  <p className="text-white/80 text-xs sm:text-sm font-medium leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!isSection && <div className="mt-10"><Footer /></div>}
    </div>
  );
}