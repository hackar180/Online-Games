
import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-6 bg-black/40 backdrop-blur-xl sticky top-0 z-50 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl orange-gradient flex items-center justify-center text-black font-black text-xl shadow-[0_8px_20px_rgba(255,107,0,0.3)]">
          OG
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tighter text-white leading-none">ONLINE <span className="text-[#FF6B00]">GAMES</span></h1>
          <p className="text-[8px] text-gray-500 font-bold tracking-[0.2em] uppercase mt-1 italic">Professional Wallet</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-[#39FF14]/10 border border-[#39FF14]/20 px-3 py-1.5 rounded-full flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse"></span>
           <span className="text-[9px] font-black text-[#39FF14] uppercase">Server Live</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
