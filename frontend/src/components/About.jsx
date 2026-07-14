export default function About() {
  return (
    // Changed to h-[calc(100vh-80px)] to fit perfectly under the header without creating a second scrollbar
    <div id="about" className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#101010]">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-5xl font-bold text-white tracking-wider mb-10">About <span className="text-[#004F30]">AERO ADMS</span></h2>
        
        <div className="bg-[#0a0a0a] p-12 rounded-3xl border border-gray-900 inline-block shadow-2xl">
          <p className="text-gray-300 text-xl leading-relaxed max-w-4xl mx-auto font-light">
            AERO ADMS is an Advanced Database Management System built specifically for modern aviation telemetry and logistics. 
            By combining the power of distributed PostgreSQL, Neo4j graph databases, and Redis caching, AERO provides 
            real-time, frictionless tracking of the entire Pakistan International Airlines fleet.
          </p>
        </div>
      </div>
    </div>
  );
}
