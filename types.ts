
export type PaymentMethodId = 'nagad' | 'bkash' | 'rocket' | 'upay';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  color: string;
  logo: string;
  accent: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Game {
  id: string;
  title: string;
  image: string;
  players: string;
  tag: string;
}

export interface Tournament {
  id: string;
  title: string;
  prizePool: string;
  status: 'Live' | 'Upcoming';
  startTime: string;
}
