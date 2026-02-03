
import React, { useState } from 'react';
import { CASH_OUT_NUMBER } from '../constants';

const DepositForm: React.FC = () => {
  const [amount, setAmount] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CASH_OUT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 pb-32">
      <div className="glass rounded-[40px] p-8 border border-white/10 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/10 blur-[50px]"></div>
        
        <h2 className="text-xl font-black mb-8 flex items-center gap-3">
          Deposit via Nagad
          <span className="text-[10px] bg-[#FF6B00]/20 text-[#FF6B00] px-2.5 py-1 rounded-lg border border-[#FF6B00]/30 font-black uppercase tracking-widest">Active</span>
        </h2>

        {/* Amount Section */}
        <div className="mb-8">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Select Amount</label>
          <div className="relative mb-4">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#FF6B00]">৳</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-black/40 border border-white/10 focus:border-[#FF6B00]/50 outline-none rounded-2xl py-5 pl-14 pr-6 text-2xl font-black transition-all placeholder:text-gray-800"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[500, 1000, 2000, 5000].map(val => (
              <button 
                key={val}
                onClick={() => setAmount(val.toString())}
                className="py-2.5 glass border border-white/5 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white hover:bg-[#FF6B00]/20 hover:border-[#FF6B00]/30 transition-all"
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Instruction - High Visibility */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Send Money To:</span>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse"></span>
               <span className="text-[10px] text-[#39FF14] font-black uppercase tracking-widest">Online</span>
            </div>
          </div>
          
          <div className="bg-black/60 rounded-2xl p-5 border border-[#FF6B00]/20 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] text-xl">
                <i className="fa-solid fa-mobile-screen-button"></i>
              </div>
              <div>
                <p className="text-xl font-black text-white tracking-wider font-mono">{CASH_OUT_NUMBER}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Personal Account</p>
              </div>
            </div>
            <button 
              onClick={handleCopy}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-[#39FF14]/20 text-[#39FF14]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            </button>
          </div>
          
          <div className="mt-5 p-4 bg-[#FF6B00]/5 rounded-2xl border border-[#FF6B00]/10">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              <i className="fa-solid fa-triangle-exclamation mr-2 text-[#FF6B00]"></i>
              নগদ অ্যাপ থেকে <strong className="text-white">Send Money</strong> করুন এবং নিচে <strong className="text-white">Transaction ID</strong> পেস্ট করুন।
            </p>
          </div>
        </div>

        {/* Transaction ID */}
        <div className="mb-8">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">Transaction ID</label>
          <input
            type="text"
            placeholder="PASTE ID HERE"
            className="w-full bg-black/40 border border-white/10 focus:border-[#39FF14]/50 outline-none rounded-2xl py-5 px-6 text-sm font-black uppercase tracking-[0.3em] transition-all text-[#39FF14]"
          />
        </div>

        <button className="w-full py-5 rounded-2xl orange-gradient text-black font-black uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(255,107,0,0.4)] active:scale-95 transition-all">
          Verify Deposit
        </button>
      </div>
    </div>
  );
};

export default DepositForm;
