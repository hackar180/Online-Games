
import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-12 bg-black/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/10">
      <div className="flex items-center gap-6">
        <div className="w-18 h-18 rounded-[24px] orange-gradient flex items-center justify-center text-black font-black text-3xl shadow-[0_15px_30px_rgba(255,107,0,0.45)] ring-6 ring-white/5">
          OG
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white leading-none uppercase italic">ONLINE <span className="text-[#FF6B00]">GAMES</span></h1>
          <p className="text-xs text-gray-500 font-black tracking-[0.3em] uppercase mt-2.5 italic">Professional Wallet System</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-[#39FF14]/10 border border-[#39FF14]/25 px-6 py-3 rounded-full flex items-center gap-3.5">
           <span className="w-3 h-3 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_15px_#39FF14]"></span>
           <span className="text-xs font-black text-[#39FF14] uppercase tracking-widest">Server Live</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
