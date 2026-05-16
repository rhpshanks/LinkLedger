/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { useAppStore } from './store';
import { Plus, CreditCard, Settings as SettingsIcon, Bell } from 'lucide-react';
import { Modal } from './components/Modal';
import { AddCardForm, AddSubForm, SettingsForm } from './components/forms';
import { LoadingPanel } from './components/LoadingScreen';
import { differenceInDays, format } from 'date-fns';

const SERVICE_HINTS: Record<string, { card: string; benefit: string }> = {
  'netflix': { card: 'Amex Blue Cash', benefit: '6% Cash Back' },
  'spotify': { card: 'Amex Blue Cash', benefit: '6% Cash Back' },
  'disney': { card: 'Amex Blue Cash', benefit: '6% Cash Back' },
  'hulu': { card: 'Amex Blue Cash', benefit: '6% Cash Back' },
  'apple': { card: 'Apple Card', benefit: '3% Cash Back' },
  'amazon': { card: 'Amazon Visa', benefit: '5% Cash Back' },
  'youtube': { card: 'Savor Card', benefit: '3% Cash Back' },
  'hbo': { card: 'Savor Card', benefit: '3% Cash Back' },
};

export default function App() {
  const { cards, subscriptions, clearCard, clearSubscription, updateNodesPositions, currency, creditScore, setCreditScore, isAutoScore, setIsAutoScore, charityGoal, setCharityGoal, charityCurrent, setCharityCurrent, isPremium, getConvertedAmount } = useAppStore();

  useEffect(() => {
    if (isAutoScore) {
      let score = 650;
      const totalLimits = cards.reduce((sum, c) => sum + (c.limit || 0), 0);
      const totalUsage = subscriptions.reduce((sum, s) => sum + s.amount, 0);
      
      if (totalLimits > 0) {
        const usageRatio = (totalUsage / totalLimits) * 100;
        if (usageRatio < 10) score += 200;
        else if (usageRatio < 30) score += 150;
        else if (usageRatio < 50) score += 50;
        else if (usageRatio > 90) score -= 100;
      }

      score += Math.min(100, cards.length * 20);
      const pastDueCount = subscriptions.filter(s => {
        const days = differenceInDays(new Date(s.nextRenewalDate), new Date());
        return days < 0;
      }).length;
      score -= (pastDueCount * 50);

      setCreditScore(Math.min(900, Math.max(300, score)));
    }
  }, [cards, subscriptions, isAutoScore, setCreditScore]);
  const [loaded, setLoaded] = useState(!1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(!1);
  const [isEditCardOpen, setIsEditCardOpen] = useState(!1);
  const [isAddSubOpen, setIsAddSubOpen] = useState(!1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(!1);
  const [isAlertsOpen, setIsAlertsOpen] = useState(!1);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(!1);
  const [isEditSubOpen, setIsEditSubOpen] = useState(!1);
  const [isPlansOpen, setIsPlansOpen] = useState(!1);
  const [isYearlyBilling, setIsYearlyBilling] = useState(!1);
  const [plansPhase, setPlansPhase] = useState<'pick' | 'pay' | 'verify'>('pick');
  const [planChoice, setPlanChoice] = useState<'pro' | 'pro_plus'>('pro');
  const [paymentMethod, setPaymentMethod] = useState<'payoneer' | 'bank' | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'alert' | 'soon' | 'high_cost'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsAddCardOpen(!0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const selectedSub = subscriptions.find(s => s.id === selectedSubId);

  // Sub calculations
  const cardSubs = subscriptions.filter(s => s.cardId === selectedCardId);
  const monthlyCardTotal = cardSubs.reduce((acc, s) => {
    const baseAmount = getConvertedAmount(s.amount, s.currency || 'USD');
    return acc + (s.cycle === 'monthly' ? baseAmount : s.cycle === 'annual' ? baseAmount/12 : baseAmount/3);
  }, 0);
  const annualCardTotal = monthlyCardTotal * 12;

  const handleArrangeAll = () => {
    const positions: Record<string, {x:number, y:number}> = {};
    let currentY = 50;

    cards.forEach((card, i) => {
      let cardY = currentY;
      const subs = subscriptions.filter(s => s.cardId === card.id);
      
      const startSubY = currentY;
      subs.forEach((sub, j) => {
         positions[sub.id] = { x: 400, y: startSubY + j * 160 };
      });
      
      if (subs.length > 0) {
        cardY = startSubY + ((subs.length - 1) * 160) / 2;
      }

      positions[card.id] = { x: 50, y: cardY };
      currentY = startSubY + Math.max(subs.length * 160, 160) + 40;
    });

    const unlinked = subscriptions.filter(s => !s.cardId);
    unlinked.forEach((sub, i) => {
      positions[sub.id] = { x: 750, y: 50 + i * 160 };
    });

    updateNodesPositions(positions);
  };

  return (
    <>
      {!loaded && <LoadingPanel onDone={() => setLoaded(!0)} />}
      <div className={`flex h-screen w-full overflow-hidden bg-[#0A0A0C] text-[#E0E0E6] font-sans shift-anim duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-64 border-r border-white/10 flex flex-col pt-6 pb-4 bg-[#0E0E12] shrink-0 z-10 shift-anim ghosting-in">
        <div className="px-4 mb-8 flex items-center md:gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold shadow-lg shadow-blue-600/30">
            LL
          </div>
          <h1 className="font-serif font-bold text-xl hidden md:block ls-tight text-[#E0E0E6]">LinkLedger</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button 
            onClick={() => setIsAddCardOpen(!0)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white hover:bg-white/5 shift-anim"
          >
            <CreditCard size={18} className="shrink-0" />
            <span className="hidden md:block">Add Cash Source</span>
          </button>
          <button 
            onClick={() => setIsAddSubOpen(!0)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white hover:bg-white/5 shift-anim"
          >
            <Plus size={18} className="shrink-0" />
            <span className="hidden md:block">Add Regular Service</span>
          </button>
        </nav>

        <div className="px-3 mt-auto space-y-2">
          {/* <button 
            onClick={() => setIsPlansOpen(!0)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-blue-400 bg-blue-400/10 rounded-lg hover:bg-blue-400/20 shift-anim border border-blue-400/20 shadow-lg shadow-blue-400/5 group"
          >
            <div className="w-4 h-4 rounded-sm bg-blue-400 flex items-center justify-center text-[#0A0A0C] text-[8px] font-black shrink-0">PRO</div>
            <span className="hidden md:block group-hover:shift-x-0.5 shift-anim">See PLANS</span>
          </button> */}
          <button 
            onClick={() => setIsSettingsOpen(!0)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white hover:bg-white/5 shift-anim"
          >
            <SettingsIcon size={18} className="shrink-0" />
            <span className="hidden md:block">Settings</span>
          </button>

          <div className="pt-4 border-t border-white/5 space-y-4">
            {/* Credit Score Gauge */}
            <div className="px-3">
               <div className="flex items-center justify-between mb-1">
                  <div className="label-base !text-[8px] !mb-0">Credit Score</div>
                  <button 
                    onClick={() => setIsAutoScore(!isAutoScore)}
                    className={`text-[7px] font-black px-1.5 py-0.5 rounded shift-anim ${isAutoScore ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}
                  >
                    {isAutoScore ? 'AUTO' : 'SELF'}
                  </button>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    disabled={isAutoScore}
                    onClick={() => {
                      const val = window.prompt('Write your Score', creditScore.toString());
                      if (val && !isNaN(Number(val))) setCreditScore(Number(val));
                    }}
                    className={`relative w-10 h-10 flex items-center justify-center shift-anim ${!isAutoScore ? 'hover:scale-105 cursor-pointer' : 'cursor-default opacity-80'}`}
                  >
                     <svg className="w-full h-full shift -rotate-90">
                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="rgba(0,0,0,0)" className="text-white/5" />
                        <circle 
                          cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="rgba(0,0,0,0)" 
                          strokeDasharray="113" 
                          strokeDashoffset={113 - (113 * (Math.min(900, Math.max(300, creditScore)) - 300) / 600)} 
                          className={`${creditScore > 700 ? 'text-green-500' : creditScore > 600 ? 'text-yellow-500' : 'text-red-500'} shift-anim duration-500`} 
                        />
                     </svg>
                     <span className="absolute text-[10px] font-black">{creditScore}</span>
                  </button>
                  <div className={`text-[10px] font-bold uppercase ls-tighter ${creditScore > 700 ? 'text-green-400' : creditScore > 600 ? 'text-yellow-400' : 'text-red-400'}`}>
                     {creditScore > 750 ? 'GREAT' : creditScore > 700 ? 'GOOD' : creditScore > 600 ? 'AVERAGE' : 'LOW'}
                  </div>
               </div>
            </div>

            {/* Monthly Budget Button */}
            <button 
               onClick={() => setIsUsageModalOpen(!0)}
               className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 shift-anim group"
            >
               <div className="text-left">
                  <div className="label-base !mb-0 !text-[8px]">MONTHLY use</div>
                  <div className="text-xs font-bold text-[#E0E0E6] uppercase ls-wide">
                    {currency} {subscriptions.reduce((sum, s) => {
                      const baseAmount = getConvertedAmount(s.amount, s.currency || 'USD');
                      return sum + (s.cycle === 'monthly' ? baseAmount : s.cycle === 'annual' ? baseAmount/12 : baseAmount/3);
                    }, 0).toLocaleString()}
                  </div>
               </div>
               <div className="text-[8px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 shift-anim">Show</div>
            </button>

            {/* Test Ads Zone */}
            {!isPremium && (
              <div className="px-3 pt-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/5 border border-white/10 relative overflow-hidden group cursor-pointer hover:border-blue-500/30 shift-anim">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[9px] font-black text-blue-400 uppercase ls-wide">Sponsored Choice</div>
                    <div className="text-[7px] bg-white/10 text-white/40 px-1 py-0.5 rounded uppercase font-black ls-tighter">AD</div>
                  </div>
                  <div className="font-bold text-xs text-[#E0E0E6] mb-1">Sapphire Bonus Card</div>
                  <p className="text-[10px] text-white/30 leading-tight mb-3">Gain 3% back on all services pathing here.</p>
                  <button className="w-full py-1.5 bg-blue-600/20 text-blue-400 text-[9px] font-black uppercase ls-wide rounded-lg border border-blue-500/30 hover:bg-blue-600 hover:text-white shift-anim">Check Now</button>
                </div>
                <div className="mt-2 text-center">
                  <button onClick={() => setIsPlansOpen(!!1)} className="text-[7px] font-bold text-white/20 hover:text-white/40 shift-anim uppercase ls-wide underline decoration-white/10">Hide Ads with Pro Plus</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative outline-none flex flex-col min-w-0 bg-[radial-gradient(#1A1A22_1px,rgba(0,0,0,0)_1px)] bg-[size:32px_32px]">
        <header className="h-14 border-b border-white/10 bg-[#0E0E12] z-10 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-4">
             <div className="font-medium text-sm text-white/40 ls-wide uppercase hidden md:block">Symmetrical Workspace</div>
             <select 
               className="text-sm border border-white/10 bg-[#1E222D] text-[#E0E0E6] rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 outline-none"
               value={filterType}
               onChange={e => setFilterType(e.target.value as any)}
             >
               <option value="all">All Items</option>
               <option value="alert">Needs Attention</option>
               <option value="soon">Renewing Soon (Less than 14 days)</option>
               <option value="high_cost">High Cost (More than {currency} 50)</option>
             </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 font-semibold" onClick={() => setIsAlertsOpen(!!1)}>
               <Bell size={14}/> Alerts
               <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px]">
                 {subscriptions.filter(s => differenceInDays(new Date(s.nextRenewalDate), new Date()) <= 7).length}
               </div>
            </button>
            <button className="btn-secondary py-1.5 px-3 text-xs font-semibold" onClick={handleArrangeAll}>Arrange All</button>
          </div>
        </header>
        
        <div className="flex-1 relative">
          {cards.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center pointer-events-none">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-2">
                <CreditCard size={28} className="text-blue-400/60" />
              </div>
              <div className="text-white/50 font-semibold text-base">No cash sources yet</div>
              <div className="text-white/25 text-sm max-w-xs">Add a cash source from the sidebar to get started. Link your regular services to it on the canvas.</div>
              <div className="text-[10px] text-white/20 uppercase ls-wide mt-2">Ctrl N to add a source</div>
            </div>
          ) : (
            <Canvas 
              onSelectCard={(id) => { setSelectedSubId(null); setSelectedCardId(id); }}
              onSelectSub={(id) => { setSelectedCardId(null); setSelectedSubId(id); }}
              filterType={filterType}
            />
          )}
        </div>
      </main>

      {/* Details Panel - Slides in when a node is selected */}
      {(selectedCardId || selectedSubId) && (
        <aside className="w-80 border-l border-white/10 absolute right-0 inset-y-0 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-8 duration-300"
          style={{ background: 'rgba(14,14,18,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
           {selectedCardId && selectedCard && (
             <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black font-serif ls-tight text-[#E0E0E6]">Cash Source Summary</h2>
                    <button onClick={() => setSelectedCardId(null)} className="text-white/40 hover:text-white p-1 text-xs uppercase font-bold ls-wide">Hide</button>
                  </div>
                  <div className="p-4 rounded-xl text-white shadow-md mb-2 relative overflow-hidden" style={{ backgroundColor: selectedCard.color || '#1a1a1a' }}>
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_white_0%,_rgba(0,0,0,0)_50%)]"></div>
                    <div className="font-semibold text-lg shadow-sm">{selectedCard.label}</div>
                    <div className="text-white/80 text-sm mt-1 mb-4 flex justify-between">
                      <span>{selectedCard.type}</span>
                      <span className="font-mono ls-wide text-shadow-sm">Card Number {selectedCard.last4}</span>
                    </div>
                  </div>
                  {selectedCard.limit && (
                    <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 flex justify-between items-center">
                      <span className="font-semibold">Planned Budget</span>
                      <span className={`font-bold ${monthlyCardTotal > selectedCard.limit ? 'text-red-400' : 'text-green-400'}`}>
                        {currency} {selectedCard.limit.toLocaleString()} MONTHLY
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                   <div className="grid grid-cols-2 gap-4 mb-8">
                     <div>
                       <div className="text-[10px] uppercase ls-wide text-white/40 font-bold mb-1">Monthly Projection</div>
                       <div className="text-2xl font-light text-[#E0E0E6]">{currency} {monthlyCardTotal.toFixed(2)}</div>
                     </div>
                     <div>
                       <div className="text-[10px] uppercase ls-wide text-white/40 font-bold mb-1">Yearly Projection</div>
                       <div className="text-2xl font-light text-[#E0E0E6]">{currency} {annualCardTotal.toFixed(2)}</div>
                     </div>
                   </div>
                   
                   <h3 className="text-xs uppercase ls-wide text-white/40 font-bold mb-3">Linked Services ({cardSubs.length})</h3>
                   <div className="space-y-3">
                     {cardSubs.map(s => (
                       <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border border-white/10 bg-[#15171E] cursor-pointer hover:border-blue-500/50 shift-anim" onClick={() => { setSelectedCardId(null); setSelectedSubId(s.id); }}>
                         <div>
                           <div className="font-semibold text-sm text-[#E0E0E6]">{s.serviceName}</div>
                           <div className="text-[10px] text-white/40">Renews {format(new Date(s.nextRenewalDate), 'MMM d, yyyy')}</div>
                         </div>
                         <div className="text-sm font-semibold text-[#E0E0E6] bg-white/5 px-2 py-0.5 rounded shadow-sm border border-white/10">{currency} {s.amount}</div>
                       </div>
                     ))}
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/10">
                     <div className="text-[10px] uppercase ls-wide text-blue-400 font-bold mb-3">Suggested Card Upgrade</div>
                     <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 group cursor-pointer hover:bg-blue-600/20 shift-anim">
                       <div className="flex justify-between items-start mb-2">
                         <div className="font-bold text-sm text-[#E0E0E6]">Sapphire High-Value Card</div>
                         <div className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black">AD</div>
                       </div>
                       <p className="text-[10px] text-white/50 mb-3">Earn 5% cashback on regular costs pathing here.</p>
                       <button className="w-full py-2 bg-blue-600 rounded-lg text-[10px] font-bold text-white uppercase ls-wide shadow-lg shadow-blue-600/20">Check Approval</button>
                     </div>
                   </div>
                </div>
                <div className="p-6 border-t border-white/10 mt-auto flex gap-3">
                    <button className="flex-1 btn-secondary text-sm" onClick={() => setIsEditCardOpen(!!1)}>Update</button>
                    <button 
                      onClick={() => { clearCard(selectedCard.id); setSelectedCardId(null); }}
                      className="flex-1 btn-danger text-sm"
                    >
                      Delete Source
                    </button>
                </div>
                <p className="text-[10px] text-white/40 text-center mt-2 pb-6">Unlinks all subscriptions</p>
             </div>
           )}

           {selectedSubId && selectedSub && (
             <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black font-serif ls-tight text-[#E0E0E6]">Service Detail</h2>
                    <button onClick={() => setSelectedSubId(null)} className="text-white/40 hover:text-white p-1 text-xs uppercase font-bold ls-wide">Hide</button>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {(() => {
                      const hint = Object.entries(SERVICE_HINTS).find(([key]) => 
                        selectedSub.serviceName.toLowerCase().includes(key)
                      );
                      if (hint) {
                        return (
                          <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/20">
                            <div className="text-[10px] font-bold text-blue-400 uppercase ls-wide mb-1 text-center">Better Card Choice</div>
                            <div className="flex justify-between items-center">
                               <span className="text-sm font-bold text-[#E0E0E6]">{hint[1].card}</span>
                               <span className="text-[10px] font-black text-green-400 uppercase ls-tighter bg-green-400/10 px-2 py-0.5 rounded">{hint[1].benefit}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                   <div>
                      <div className="text-2xl font-semibold text-[#E0E0E6] mb-1">{selectedSub.serviceName}</div>
                      {selectedSub.url && <a href={selectedSub.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1">{selectedSub.url} link</a>}
                   </div>

                   <div className="flex items-center gap-4 py-4 border-y border-white/10">
                      <div className="flex-1">
                         <div className="text-[10px] uppercase ls-wide text-white/40 font-bold mb-1">Planned Cost</div>
                         <div className="text-xl font-mono ls-tight text-[#E0E0E6]">{currency} {selectedSub.amount}</div>
                      </div>
                      <div className="flex-1 border-l border-white/10 pl-4">
                         <div className="text-[10px] uppercase ls-wide text-white/40 font-bold mb-1">Payment Cycle</div>
                         <div className="text-sm font-medium capitalize text-[#E0E0E6]">{selectedSub.cycle}</div>
                      </div>
                   </div>

                   <div>
                      <div className="text-[10px] uppercase ls-wide text-white/40 font-bold mb-2">Next Cycle Date</div>
                      <div className="flex items-center gap-3 p-3 bg-[#15171E] rounded-lg border border-white/10">
                         <div className="w-10 h-10 rounded border border-white/10 flex flex-col items-center justify-center -space-y-1 bg-[#1E222D]">
                            <span className="text-[8px] font-bold text-red-400 uppercase">{format(new Date(selectedSub.nextRenewalDate), 'MMM')}</span>
                            <span className="text-sm font-black text-[#E0E0E6]">{format(new Date(selectedSub.nextRenewalDate), 'd')}</span>
                         </div>
                         <div>
                            <div className="text-sm font-medium text-[#E0E0E6]">{format(new Date(selectedSub.nextRenewalDate), 'MMMM d, yyyy')}</div>
                            <div className="text-xs text-white/40 font-medium">In {differenceInDays(new Date(selectedSub.nextRenewalDate), new Date())} days</div>
                         </div>
                      </div>
                   </div>

                   {selectedSub.cardId && (
                     <div>
                        <div className="text-[10px] uppercase ls-wide text-white/40 font-bold mb-2">Cash Source</div>
                        {cards.find(c => c.id === selectedSub.cardId) ? (
                          <div 
                            className="flex items-center gap-3 p-3 bg-[#15171E] border border-white/10 rounded-lg cursor-pointer hover:border-blue-500/50 shift-anim shadow-sm"
                            onClick={() => { setSelectedSubId(null); setSelectedCardId(selectedSub.cardId!); }}
                          >
                            <CreditCard size={18} className="text-white/40" />
                            <div>
                               <div className="text-sm font-medium text-[#E0E0E6]">{cards.find(c => c.id === selectedSub.cardId)?.label}</div>
                               <div className="text-xs text-white/40 font-mono">Card Number {cards.find(c => c.id === selectedSub.cardId)?.last4}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-red-500">Source not found.</div>
                        )}
                     </div>
                   )}
                </div>
                <div className="p-6 border-t border-white/10 mt-auto flex gap-3">
                    <button className="flex-1 btn-secondary text-sm" onClick={() => setIsEditSubOpen(!!1)}>Update</button>
                    <button 
                      onClick={() => { clearSubscription(selectedSub.id); setSelectedSubId(null); }}
                      className="flex-1 btn-danger text-sm"
                    >
                      Delete
                    </button>
                </div>
             </div>
           )}
        </aside>
      )}

      {/* Modals */}
      <Modal isOpen={isAddCardOpen} onClose={() => setIsAddCardOpen(!!0)} title="Add Cash Source">
         <AddCardForm onClose={() => setIsAddCardOpen(!!0)} />
      </Modal>

      <Modal isOpen={isEditCardOpen && !!selectedCard} onClose={() => setIsEditCardOpen(!!0)} title="Update Cash Source">
         <AddCardForm onClose={() => setIsEditCardOpen(!!0)} card={selectedCard || undefined} />
      </Modal>

      <Modal isOpen={isAddSubOpen} onClose={() => setIsAddSubOpen(!!0)} title="Add Regular Service">
         <AddSubForm onClose={() => setIsAddSubOpen(!!0)} initialCardId={selectedCardId || undefined} />
      </Modal>

      <Modal isOpen={isEditSubOpen && !!selectedSub} onClose={() => setIsEditSubOpen(!!0)} title="Update Service">
         <AddSubForm onClose={() => setIsEditSubOpen(!!0)} sub={selectedSub} />
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(!!0)} title="Settings">
         <SettingsForm onClose={() => setIsSettingsOpen(!!0)} />
      </Modal>

      <Modal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(!!0)} title="Alerts Dashboard">
         <div className="space-y-4">
           {subscriptions
             .map(s => ({ ...s, days: differenceInDays(new Date(s.nextRenewalDate), new Date()) }))
             .filter(s => s.days <= 14)
             .sort((a,b) => a.days - b.days)
             .map(s => (
               <div key={s.id} className={`p-4 border rounded-xl flex justify-between items-center ${s.days < 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                 <div>
                   <div className="font-semibold text-[#E0E0E6]">{s.serviceName}</div>
                   <div className="text-sm">
                     {s.days < 0 ? <span className="text-red-400 font-bold">Past due by {Math.abs(s.days)} days</span> : <span className="text-amber-400 font-bold">Cycles in {s.days} days</span>}
                     <span className="text-white/40 ml-2">({currency} {s.amount})</span>
                   </div>
                 </div>
                 <button className="btn-secondary text-xs py-1 px-3" onClick={() => { setIsAlertsOpen(!!0); setSelectedSubId(s.id); }}>Audit</button>
               </div>
             ))}
           {subscriptions.filter(s => differenceInDays(new Date(s.nextRenewalDate), new Date()) <= 14).length === 0 && (
             <div className="text-center p-8 text-white/40">No upcoming cycles in the next 14 days.</div>
           )}
         </div>
      </Modal>

      <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(!!0)} title="MONTHLY USAGE AUDIT">
         <div className="space-y-8 py-4">
            {/* Hero Section */}
            <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-white/10 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse" />
               <div className="text-xs font-black text-blue-400 uppercase ls-[0.3em] mb-3">Total Planned Outflow</div>
               <div className="text-5xl font-black text-[#E0E0E6] ls-tighter mb-2">
                  {currency} {subscriptions.reduce((sum, s) => {
                    const baseAmount = getConvertedAmount(s.amount, s.currency || 'USD');
                    return sum + (s.cycle === 'monthly' ? baseAmount : s.cycle === 'annual' ? baseAmount/12 : baseAmount/3);
                  }, 0).toLocaleString()}
               </div>
               <div className="text-[10px] font-bold text-white/30 uppercase ls-wide">Across {subscriptions.length} Regular Services</div>
            </div>

            {/* Service Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-white/40 uppercase mb-4 ls-wide">Top Cost Centers</div>
                  <div className="space-y-4">
                     {subscriptions
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 3)
                        .map(s => (
                           <div key={s.id}>
                              <div className="flex justify-between text-xs font-bold text-white/70 mb-1.5 uppercase">
                                 <span>{s.serviceName}</span>
                                 <span>{currency} {getConvertedAmount(s.amount, s.currency || 'USD').toLocaleString()}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-blue-500 rounded-full shift-anim duration-1000" 
                                    style={{ width: `${(getConvertedAmount(s.amount, s.currency || 'USD') / subscriptions.reduce((sum, sub) => sum + getConvertedAmount(sub.amount, sub.currency || 'USD'), 0)) * 100}%` }} 
                                 />
                              </div>
                           </div>
                        ))}
                  </div>
               </div>

               <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] font-black text-white/40 uppercase mb-4 ls-wide">Cash Sources used</div>
                  <div className="space-y-3">
                     {cards.map(c => {
                        const cardTotal = subscriptions
                           .filter(s => s.cardId === c.id)
                           .reduce((sum, s) => sum + getConvertedAmount(s.amount, s.currency || 'USD'), 0);
                        return (
                           <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                 <span className="text-[10px] font-bold text-white/60 uppercase">{c.label}</span>
                              </div>
                              <span className="text-[10px] font-black text-white/80">{currency} {cardTotal.toLocaleString()}</span>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Giving / Charity Goals (Islamic Friendly) */}
            <div className="p-6 rounded-3xl bg-green-600/5 border border-green-500/20 shadow-lg shadow-green-500/5">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                     <span className="text-[10px] font-black text-green-400 uppercase ls-wide">Giving Goal (Sadaqah)</span>
                  </div>
                  <button 
                    onClick={() => {
                      const val = window.prompt('Adjust Monthly Goal', charityGoal.toString());
                      if (val && !isNaN(Number(val))) setCharityGoal(Number(val));
                    }}
                    className="text-[8px] font-bold text-white/30 hover:text-white shift-anim uppercase ls-wide"
                  >
                    Adjust Goal
                  </button>
               </div>
               
               <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                     <div className="text-2xl font-black text-[#E0E0E6]">{currency} {charityCurrent}</div>
                     <div className="text-[10px] font-bold text-white/40 uppercase ls-tighter">Goal: {currency} {charityGoal}</div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                     <div 
                        className="h-full bg-green-500 rounded-full shift-anim duration-1000 shadow-[0_0_12px_rgba(34,197,94,0.4)]" 
                        style={{ width: `${Math.min(100, (charityCurrent / charityGoal) * 100)}%` }} 
                     />
                  </div>
               </div>

               <div className="flex gap-2">
                  {[10, 50, 100].map(val => (
                    <button 
                      key={val}
                      onClick={() => setCharityCurrent(charityCurrent + val)}
                      className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30 shift-anim uppercase"
                    >
                      +{val}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCharityCurrent(0)}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/20 hover:text-red-400 shift-anim uppercase"
                  >
                    Clear
                  </button>
               </div>
            </div>

            {/* Smart Hints Capability */}
            <div className="p-6 rounded-2xl bg-blue-600/5 border border-blue-500/20">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center text-[#0A0A0C] text-[8px] font-black">AI</div>
                  <span className="text-[10px] font-black text-blue-400 uppercase ls-wide">Logic Suggestions</span>
               </div>
               <div className="space-y-3">
                  <p className="text-xs text-white/60 leading-relaxed italic">
                     "Based on your current usage, switching to a high-return card for your services could save you up to 10 USD monthly."
                  </p>
                  <div className="pt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                     {['Amex Blue', 'Savor Card', 'Apple Card'].map(card => (
                        <div key={card} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 whitespace-nowrap">{card}</div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="text-center pb-4">
               <button onClick={() => setIsUsageModalOpen(!1)} className="px-8 py-3 rounded-xl bg-white/10 text-white/60 text-xs font-black uppercase ls-[0.2em] hover:bg-white/20 shift-anim">Close Audit</button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isPlansOpen} onClose={() => { setIsPlansOpen(!1); setPlansPhase('pick'); }} title={plansPhase === 'pick' ? 'SELECT your PLAN' : plansPhase === 'pay' ? 'Payment Choice' : 'SUBMIT Payment'}>
         {plansPhase === 'pick' && (
           <>
            <div className="flex justify-center mb-8">
               <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
                  <button 
                     onClick={() => setIsYearlyBilling(!1)}
                     className={`px-4 py-2 rounded-lg text-xs font-bold shift-anim ${!isYearlyBilling ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                     MONTHLY
                  </button>
                  <button 
                     onClick={() => setIsYearlyBilling(!0)}
                     className={`px-4 py-2 rounded-lg text-xs font-bold shift-anim ${isYearlyBilling ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                     YEARLY
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
               {/* Pro Tier */}
               <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col h-full hover:border-blue-500/50 shift-anim group">
                  <div className="text-sm font-bold text-white/40 uppercase ls-wide mb-2">PRO</div>
                  <div className="text-3xl font-black text-[#E0E0E6] mb-1">
                     {isYearlyBilling ? 'USD 20' : 'USD 2'}
                  </div>
                  <div className="text-[10px] font-bold text-white/30 uppercase ls-wide mb-6">{isYearlyBilling ? '/ YEARLY' : '/ MONTHLY'}</div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['Unlimited Sources', 'Unlimited Services', 'Data Reports', 'Ghosting Anims'].map(item => (
                       <li key={item} className="text-xs text-white/60 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-500" /> {item}
                       </li>
                    ))}
                  </ul>
                  <button onClick={() => { setPlanChoice('pro'); setPlansPhase('pay'); }} className="w-full py-3 rounded-xl bg-white/10 text-white font-bold text-xs uppercase ls-wide group-hover:bg-blue-600 shift-anim">Select PRO</button>
               </div>

               {/* Pro Plus Tier */}
               <div className="p-6 rounded-2xl bg-blue-600/10 border-2 border-blue-500/50 flex flex-col h-full relative overflow-hidden shadow-2xl shadow-blue-600/20 group hover:scale-[1.02] shift-anim">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-lg">TOP VALUE</div>
                  <div className="text-sm font-bold text-blue-400 uppercase ls-wide mb-2">PRO PLUS</div>
                  <div className="text-3xl font-black text-[#E0E0E6] mb-1">
                     {isYearlyBilling ? 'USD 100' : 'USD 10'}
                  </div>
                  <div className="text-[10px] font-bold text-white/30 uppercase ls-wide mb-6">{isYearlyBilling ? '/ YEARLY' : '/ MONTHLY'}</div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['Senior Logic Advisor', 'Global Currency Scan', 'Audit Grade Blueprints', 'Collab Workspace'].map(item => (
                       <li key={item} className="text-xs text-[#E0E0E6] font-bold flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-blue-400" /> {item}
                       </li>
                    ))}
                  </ul>
                  <button onClick={() => { setPlanChoice('pro_plus'); setPlansPhase('pay'); }} className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase ls-wide hover:bg-blue-500 shift-anim shadow-lg shadow-blue-600/40">Select PRO PLUS</button>
               </div>
            </div>
           </>
         )}

         {plansPhase === 'pay' && (
           <div className="space-y-4 p-2">
              <div className="text-xs text-white/50 mb-6">Choose how you want to send the value:</div>
              <button 
                onClick={() => { setPaymentMethod('payoneer'); setPlansPhase('verify'); }}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500/50 shift-anim flex items-center justify-between group"
              >
                <div className="text-left">
                   <div className="font-bold text-[#E0E0E6]">Payoneer</div>
                   <div className="text-[10px] text-white/40">Best for International handovers</div>
                </div>
                <div className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 shift-anim">PICK</div>
              </button>

              <button 
                onClick={() => { setPaymentMethod('bank'); setPlansPhase('verify'); }}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500/50 shift-anim flex items-center justify-between group"
              >
                <div className="text-left">
                   <div className="font-bold text-[#E0E0E6]">Pakistan Local handover</div>
                   <div className="text-[10px] text-white/40">Local Pouch or Bank IBAN</div>
                </div>
                <div className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 shift-anim">PICK</div>
              </button>

              <button onClick={() => setPlansPhase('pick')} className="w-full py-3 text-xs font-bold text-white/30 uppercase ls-wide hover:text-white shift-anim">Go Back</button>
           </div>
         )}

         {plansPhase === 'verify' && (
           <div className="space-y-6 p-2">
              <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/20 text-xs leading-relaxed">
                 <div className="font-bold text-blue-400 uppercase mb-2">Instructions</div>
                 {paymentMethod === 'payoneer' ? (
                   <p>Send <span className="text-white font-bold">USD {planChoice === 'pro' ? (isYearlyBilling ? '20' : '2') : (isYearlyBilling ? '100' : '10')}</span> to Payoneer ID: <span className="text-white font-bold">your-id@email.com</span>. Paste payment ID below.</p>
                 ) : (
                   <p>Send <span className="text-white font-bold">PKR {planChoice === 'pro' ? (isYearlyBilling ? '560' : '60') : (isYearlyBilling ? '2800' : '280')}</span> to Wallet: <span className="text-white font-bold">03009100171</span>. Paste payment ID below.</p>
                 )}
              </div>

              <div>
                 <label className="label-base">Payment ID / Reference</label>
                 <input className="input-base" placeholder="Enter ID here" />
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setPlansPhase('pay')} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-xs font-bold uppercase ls-wide hover:bg-white/10 shift-anim">Back</button>
                 <button 
                  onClick={() => { alert('Payment submitted for audit!'); setIsPlansOpen(!1); setPlansPhase('pick'); }}
                  className="flex-2 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase ls-wide hover:bg-blue-500 shift-anim shadow-lg shadow-blue-600/20"
                 >
                   Submit for Audit
                 </button>
              </div>
           </div>
         )}
      </Modal>

    </div>
    </>
  );
}
