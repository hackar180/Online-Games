
import React from 'react';

const BalanceCard: React.FC = () => {
  return (
    <div className="px-6 mb-8">
      <div className="relative overflow-hidden rounded-[36px] glass p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-6">
          <div className="bg-[#39FF14]/10 text-[#39FF14] text-[10px] font-black px-3 py-1 rounded-full border border-[#39FF14]/20 flex items-center gap-1.5 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse"></span>
            Verified Gamer
          </div>
        </div>

        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#FF6B00]/10 rounded-full blur-[80px]"></div>
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#39FF14]/5 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Available Balance</p>
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-4xl font-black tracking-tight text-white">৳ 12,450.00</span>
          </div>
          
          <div className="flex gap-4">
            <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 transition-all rounded-2xl flex items-center justify-center gap-2 border border-white/5 text-xs font-bold text-gray-300">
              <i className="fa-solid fa-arrow-up-from-bracket opacity-50"></i>
              Withdraw
            </button>
            <button className="flex-1 py-4 orange-gradient hover:scale-[1.02] active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-2 text-black text-xs font-black shadow-[0_10px_20px_rgba(255,107,0,0.3)]">
              <i className="fa-solid fa-plus-circle"></i>
              Add Funds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
