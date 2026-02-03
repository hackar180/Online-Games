
import { PaymentMethod, Game, Tournament } from './types';

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'nagad',
    name: 'Nagad',
    color: '#FF6B00',
    logo: 'https://seeklogo.com/images/N/nagad-logo-7A70BBDA46-seeklogo.com.png',
    accent: 'border-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.3)] bg-[#FF6B00]/10'
  },
  {
    id: 'bkash',
    name: 'bKash',
    color: '#E2136E',
    logo: 'https://seeklogo.com/images/B/bkash-logo-FBB258C90F-seeklogo.com.png',
    accent: 'border-[#E2136E]/20'
  },
  {
    id: 'rocket',
    name: 'Rocket',
    color: '#8C3494',
    logo: 'https://seeklogo.com/images/R/rocket-logo-870025D7E3-seeklogo.com.png',
    accent: 'border-[#8C3494]/20'
  },
  {
    id: 'upay',
    name: 'Upay',
    color: '#FFD300',
    logo: 'https://seeklogo.com/images/U/upay-logo-1C9C7B4D0B-seeklogo.com.png',
    accent: 'border-[#FFD300]/20'
  }
];

export const GAMES: Game[] = [
  {
    id: '1',
    title: 'PUBG Mobile',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400',
    players: '12.4k Online',
    tag: 'Battle Royale'
  },
  {
    id: '2',
    title: 'Free Fire Max',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400',
    players: '8.1k Online',
    tag: 'Survival'
  }
];

export const LIVE_TOURNAMENT: Tournament = {
  id: 't1',
  title: 'Cyber Strike Masters',
  prizePool: '৳ 25,000',
  status: 'Live',
  startTime: 'Active Now'
};

export const CASH_OUT_NUMBER = '01736428130';
