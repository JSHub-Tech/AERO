export default function Contact() {
  return (
    <div id="contact" className="w-full h-[calc(100vh-80px)] flex items-center justify-center bg-[#F8F9FA]">
      <div className="max-w-3xl w-full mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-[#1C2B22] tracking-wider">Get in <span className="text-[#004F30]">Touch</span></h2>
        </div>
        <form className="space-y-8 bg-white p-12 rounded-3xl shadow-[0_10px_40px_rgba(0,79,48,0.06)] border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <input type="text" placeholder="Full Name" className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all placeholder-gray-400" />
            <input type="email" placeholder="Email Address" className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all placeholder-gray-400" />
          </div>
          <textarea rows="5" placeholder="How can we help you?" className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl p-5 text-[#1C2B22] font-medium focus:outline-none focus:border-[#004F30] focus:ring-2 focus:ring-[#004F30]/20 transition-all resize-none placeholder-gray-400"></textarea>
          <div className="text-center">
            <button type="button" className="px-12 py-5 bg-[#004F30] hover:bg-[#1C2B22] text-white text-lg font-bold tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl w-full md:w-auto">
              SEND MESSAGE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
