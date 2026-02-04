
import React from 'react';

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
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              লাইভ অ্যারেনা
            </span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-xl font-black text-white leading-tight mb-1">গেম খেলুন, টাকা জিতুন</h3>
              <p className="text-orange-400 text-sm font-bold font-bold">সাপ্তাহিক প্রাইজ পুল: ৳ ৫০,০০০</p>
            </div>
            <button className="px-5 py-2.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-colors shadow-lg">
              বিস্তারিত
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBanner;
