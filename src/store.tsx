import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { Card, Subscription, AlertPreference } from './types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  cards: Card[];
  subscriptions: Subscription[];
  alertsPrefs: AlertPreference;
  addCard: (card: Omit<Card, 'id'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  removeCard: (id: string) => void;
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;
  setAlertsPrefs: (prefs: AlertPreference) => void;
  nodePositions: Record<string, { x: number; y: number }>;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodesPositions: (positions: Record<string, { x: number; y: number }>) => void;
  currency: string;
  setCurrency: (c: string) => void;
  creditScore: number;
  setCreditScore: (score: number) => void;
  isAutoScore: boolean;
  setIsAutoScore: (auto: boolean) => void;
  charityGoal: number;
  setCharityGoal: (goal: number) => void;
  charityCurrent: number;
  setCharityCurrent: (current: number) => void;
  isPremium: boolean;
  setIsPremium: (premium: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function loadState<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }
  return defaultValue;
}

const defaultCards: Card[] = [
  { id: 'c1', label: 'Main Operations', last4: '4111', type: 'Visa', limit: 5000, color: '#2563eb' }
];

const defaultSubscriptions: Subscription[] = [
  { id: 's1', serviceName: 'Slack', url: 'slack.com', amount: 150, cycle: 'monthly', nextRenewalDate: new Date(Date.now() + 10 * 86400000).toISOString(), cardId: 'c1' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<Card[]>(() => loadState('ll_cards', defaultCards));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadState('ll_subs', defaultSubscriptions));
  const [alertsPrefs, setAlertsPrefs] = useState<AlertPreference>(() => loadState('ll_alerts', { advanceNoticeDays: 7, notifyInApp: true, notifyEmail: false }));
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => loadState('ll_node_pos', { 'c1': { x: 50, y: 300 }, 's1': { x: 400, y: 300 } }));
  const [currency, setCurrency] = useState<string>(() => {
    const saved = loadState('ll_currency', 'USD');
    return saved === 'cash' ? 'USD' : saved;
  });
  const [creditScore, setCreditScore] = useState<number>(() => loadState('ll_credit_score', 742));
  const [isAutoScore, setIsAutoScore] = useState<boolean>(() => loadState('ll_auto_score', false));
  const [charityGoal, setCharityGoal] = useState<number>(() => loadState('ll_charity_goal', 100));
  const [charityCurrent, setCharityCurrent] = useState<number>(() => loadState('ll_charity_current', 0));
  const [isPremium, setIsPremium] = useState<boolean>(() => loadState('ll_is_premium', false));

  useEffect(() => { localStorage.setItem('ll_cards', JSON.stringify(cards)); }, [cards]);
  useEffect(() => { localStorage.setItem('ll_subs', JSON.stringify(subscriptions)); }, [subscriptions]);
  useEffect(() => { localStorage.setItem('ll_alerts', JSON.stringify(alertsPrefs)); }, [alertsPrefs]);
  useEffect(() => { localStorage.setItem('ll_node_pos', JSON.stringify(nodePositions)); }, [nodePositions]);
  useEffect(() => { localStorage.setItem('ll_currency', JSON.stringify(currency)); }, [currency]);
  useEffect(() => { localStorage.setItem('ll_credit_score', JSON.stringify(creditScore)); }, [creditScore]);
  useEffect(() => { localStorage.setItem('ll_auto_score', JSON.stringify(isAutoScore)); }, [isAutoScore]);
  useEffect(() => { localStorage.setItem('ll_charity_goal', JSON.stringify(charityGoal)); }, [charityGoal]);
  useEffect(() => { localStorage.setItem('ll_charity_current', JSON.stringify(charityCurrent)); }, [charityCurrent]);
  useEffect(() => { localStorage.setItem('ll_is_premium', JSON.stringify(isPremium)); }, [isPremium]);

  const addCard = (card: Omit<Card, 'id'>) => {
    const id = `card-${uuidv4()}`;
    setCards(prev => [...prev, { ...card, id }]);
  };

  const updateCard = (id: string, updates: Partial<Card>) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const addSubscription = (sub: Omit<Subscription, 'id'>) => {
    const id = `sub-${uuidv4()}`;
    setSubscriptions(prev => [...prev, { ...sub, id }]);
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };
  
  const updateNodePosition = (id: string, pos: { x: number; y: number }) => {
    setNodePositions(prev => ({ ...prev, [id]: pos }));
  };

  const updateNodesPositions = (positions: Record<string, { x: number; y: number }>) => {
    setNodePositions(prev => ({ ...prev, ...positions }));
  };

  return (
    <AppContext.Provider value={{
      cards, subscriptions, alertsPrefs,
      addCard, updateCard, removeCard,
      addSubscription, updateSubscription, removeSubscription,
      setAlertsPrefs,
      nodePositions, updateNodePosition, updateNodesPositions,
      currency, setCurrency,
      creditScore, setCreditScore,
      isAutoScore, setIsAutoScore,
      charityGoal, setCharityGoal,
      charityCurrent, setCharityCurrent,
      isPremium, setIsPremium
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
