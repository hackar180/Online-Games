
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
    <div className="fixed bottom-36 right-8 z-50">
      {isOpen ? (
        <div className="w-[420px] h-[600px] glass border border-white/15 rounded-[56px] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-400">
          <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/30">
            <div className="flex items-center gap-4">
              <div className="w-3.5 h-3.5 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_15px_#39FF14]"></div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-[#39FF14]">Valkyrie Core</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors text-2xl">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-black/15">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[32px] text-sm font-medium leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-[#FF6B00] text-black font-bold' 
                    : 'bg-white/5 text-gray-300 border border-white/10'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 flex gap-2.5">
                  <div className="w-2.5 h-2.5 bg-[#39FF14]/50 rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-[#39FF14]/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-[#39FF14]/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 bg-black/50 border-t border-white/10 flex gap-4">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your query..."
              className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-[#FF6B00]/60 placeholder:text-gray-700"
            />
            <button 
              onClick={handleSend}
              className="w-16 h-16 bg-[#FF6B00] rounded-2xl flex items-center justify-center text-black shadow-xl text-xl"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-20 h-20 orange-gradient rounded-[32px] flex items-center justify-center text-black text-3xl shadow-[0_20px_40px_rgba(255,107,0,0.4)] hover:scale-110 active:scale-90 transition-all group"
        >
          <i className="fa-solid fa-ghost group-hover:scale-110 transition-transform"></i>
        </button>
      )}
    </div>
  );
};

export default ChatAssistant;
