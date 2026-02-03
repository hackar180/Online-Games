
import React from 'react';
import { GAMES } from '../constants';

const GameGrid: React.FC = () => {
  return (
    <div className="px-6 mb-12">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-black text-lg tracking-tight">Popular Arenas</h3>
        <button className="text-[#FFD700] text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">
          View All <i className="fa-solid fa-chevron-right ml-1"></i>
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {GAMES.map((game) => (
          <div key={game.id} className="glass rounded-[28px] overflow-hidden border border-white/5 hover:border-[#FFD700]/30 transition-all group">
            <div className="relative h-32 overflow-hidden">
              <img 
                src={game.image} 
                alt={game.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-white border border-white/10">
                {game.tag}
              </div>
            </div>
            <div className="p-4">
              <h4 className="text-white font-bold text-sm mb-1">{game.title}</h4>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{game.players}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameGrid;
