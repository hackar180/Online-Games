
import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-8 bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-[20px] orange-gradient flex items-center justify-center text-black font-black text-2xl shadow-[0_10px_25px_rgba(255,107,0,0.4)] ring-4 ring-white/5">
          OG
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-white leading-none uppercase italic">ONLINE <span className="text-[#FF6B00]">GAMES</span></h1>
          <p className="text-[9px] text-gray-500 font-black tracking-[0.25em] uppercase mt-1.5 italic">Professional Gaming Wallet</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 px-4 py-2 rounded-full flex items-center gap-2.5">
           <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_10px_#39FF14]"></span>
           <span className="text-[10px] font-black text-[#39FF14] uppercase tracking-widest">Server Live</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
