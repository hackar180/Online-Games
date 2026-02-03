
import React, { useState, useRef, useEffect } from 'react';
import { getDepositHelp } from '../services/geminiService';
import { ChatMessage } from '../types';

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Sup, Elite Gamer. Valkyrie online. Need help with that Nagad deposit?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const botResponse = await getDepositHelp(userMsg);
    setMessages(prev => [...prev, { role: 'model', text: botResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-28 right-6 z-50">
      {isOpen ? (
        <div className="w-[340px] h-[480px] glass border border-white/10 rounded-[40px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_10px_#39FF14]"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#39FF14]">Valkyrie Core</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-black/10">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] font-medium leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-[#FF6B00] text-black font-bold' 
                    : 'bg-white/5 text-gray-300 border border-white/5'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-[#39FF14]/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#39FF14]/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#39FF14]/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-black/40 border-t border-white/5 flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query system..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-[#FF6B00]/50 placeholder:text-gray-700"
            />
            <button 
              onClick={handleSend}
              className="w-12 h-12 bg-[#FF6B00] rounded-xl flex items-center justify-center text-black shadow-lg"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 orange-gradient rounded-3xl flex items-center justify-center text-black text-2xl shadow-[0_15px_25px_rgba(255,107,0,0.3)] hover:scale-110 active:scale-90 transition-all group"
        >
          <i className="fa-solid fa-ghost group-hover:scale-110 transition-transform"></i>
        </button>
      )}
    </div>
  );
};

export default ChatAssistant;
