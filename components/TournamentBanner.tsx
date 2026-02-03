
import React from 'react';
import { LIVE_TOURNAMENT } from '../constants';

const TournamentBanner: React.FC = () => {
  return (
    <div className="px-6 mb-8">
      <div className="relative h-44 w-full rounded-[32px] overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80" 
          alt="Tournament" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent"></div>
        
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              Live Now
            </span>
            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{LIVE_TOURNAMENT.startTime}</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-xl font-black text-white leading-tight mb-1">{LIVE_TOURNAMENT.title}</h3>
              <p className="text-[#FFD700] text-sm font-bold">Prize Pool: {LIVE_TOURNAMENT.prizePool}</p>
            </div>
            <button className="px-5 py-2.5 bg-white text-[#020617] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#FFD700] transition-colors shadow-lg">
              Join Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBanner;
