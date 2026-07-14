export default function About() {
  return (
    <div id="about" className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-5xl font-bold text-[#1C2B22] tracking-wider mb-10">About <span className="text-[#004F30]">AERO</span></h2>
        
        <div className="bg-white p-14 rounded-3xl shadow-[0_10px_40px_rgba(0,79,48,0.06)] border border-gray-100 inline-block">
          <p className="text-gray-600 text-xl leading-relaxed max-w-4xl mx-auto font-medium">
            AERO is an operational dashboard built specifically for modern aviation telemetry and logistics. 
            By combining the power of distributed PostgreSQL, Neo4j graph databases, and Redis caching, AERO provides 
            real-time, frictionless tracking of the entire Pakistan International Airlines fleet.
          </p>
        </div>
      </div>
    </div>
  );
}
