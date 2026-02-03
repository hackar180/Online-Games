
import React from 'react';
import { PAYMENT_METHODS } from '../constants';
import { PaymentMethodId } from '../types';

interface PaymentGridProps {
  selectedId: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
}

const PaymentGrid: React.FC<PaymentGridProps> = ({ selectedId, onSelect }) => {
  return (
    <div className="px-6 mb-8">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Payment Methods</h3>
      <div className="grid grid-cols-4 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const isActive = selectedId === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`relative h-20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 border ${
                isActive 
                  ? `${method.accent} bg-white/10 transform scale-105` 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 opacity-60'
              }`}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={method.logo} alt={method.name} className="max-w-full max-h-full object-contain" />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                {method.name}
              </span>
              {isActive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center border border-black">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: method.color }}></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentGrid;
