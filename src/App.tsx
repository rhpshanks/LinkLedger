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
import { LoadingScreen } from './components/LoadingScreen';
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
  const { cards, subscriptions, removeCard, removeSubscription, updateNodesPositions, currency, creditScore, setCreditScore, isAutoScore, setIsAutoScore } = useAppStore();

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
  const [loaded, setLoaded] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isEditSubOpen, setIsEditSubOpen] = useState(false);
  const [isPlansOpen, setIsPlansOpen] = useState(false);
  const [isYearlyBilling, setIsYearlyBilling] = useState(false);
  const [plansPhase, setPlansPhase] = useState<'pick' | 'pay' | 'verify'>('pick');
  const [paymentMethod, setPaymentMethod] = useState<'payoneer' | 'bank' | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'alert' | 'soon' | 'high_cost'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsAddCardOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const selectedSub = subscriptions.find(s => s.id === selectedSubId);

  // Sub calculations
  const cardSubs = subscriptions.filter(s => s.cardId === selectedCardId);
  const monthlyCardTotal = cardSubs.reduce((acc, s) => acc + (s.cycle === 'monthly' ? s.amount : s.cycle === 'annual' ? s.amount/12 : s.amount/3), 0);
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
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <div className={`flex h-screen w-full overflow-hidden bg-[#0A0A0C] text-[#E0E0E6] font-sans transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-64 border-r border-white/10 flex flex-col pt-6 pb-4 bg-[#0E0E12] shrink-0 z-10 transition-all">
        <div className="px-4 mb-8 flex items-center md:gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold shadow-lg shadow-blue-600/30">
            LL
          </div>
          <h1 className="font-serif font-bold text-xl hidden md:block tracking-tight text-[#E0E0E6]">LinkLedger</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button 
            onClick={() => setIsAddCardOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white hover:bg-white/5 transition-all"
          >
            <CreditCard size={18} className="shrink-0" />
            <span className="hidden md:block">Add Cash Source</span>
          </button>
          <button 
            onClick={() => setIsAddSubOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white hover:bg-white/5 transition-all"
          >
            <Plus size={18} className="shrink-0" />
            <span className="hidden md:block">Add Regular Service</span>
          </button>
        </nav>

        <div className="px-3 mt-auto space-y-2">
          {/* <button 
            onClick={() => setIsPlansOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-blue-400 bg-blue-400/10 rounded-lg hover:bg-blue-400/20 transition-all border border-blue-400/20 shadow-lg shadow-blue-400/5 group"
          >
            <div className="w-4 h-4 rounded-sm bg-blue-400 flex items-center justify-center text-[#0A0A0C] text-[8px] font-black shrink-0">PRO</div>
            <span className="hidden md:block group-hover:translate-x-0.5 transition-transform">See PLANS</span>
          </button> */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white hover:bg-white/5 transition-all"
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
                    className={`text-[7px] font-black px-1.5 py-0.5 rounded transition-all ${isAutoScore ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 border border-white/10'}`}
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
                    className={`relative w-10 h-10 flex items-center justify-center transition-transform ${!isAutoScore ? 'hover:scale-105 cursor-pointer' : 'cursor-default opacity-80'}`}
                  >
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
                        <circle 
                          cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" 
                          strokeDasharray="113" 
                          strokeDashoffset={113 - (113 * (Math.min(900, Math.max(300, creditScore)) - 300) / 600)} 
                          className={`${creditScore > 700 ? 'text-green-500' : creditScore > 600 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-500`} 
                        />
                     </svg>
                     <span className="absolute text-[10px] font-black">{creditScore}</span>
                  </button>
                  <div className={`text-[10px] font-bold uppercase tracking-tighter ${creditScore > 700 ? 'text-green-400' : creditScore > 600 ? 'text-yellow-400' : 'text-red-400'}`}>
                     {creditScore > 750 ? 'GREAT' : creditScore > 700 ? 'GOOD' : creditScore > 600 ? 'AVERAGE' : 'LOW'}
                  </div>
               </div>
            </div>

            {/* Monthly Budget Button */}
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group">
               <div className="text-left">
                  <div className="label-base !mb-0 !text-[8px]">MONTHLY use</div>
                  <div className="text-xs font-bold text-[#E0E0E6] uppercase tracking-widest">
                    {currency} {subscriptions.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                  </div>
               </div>
               <div className="text-[8px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Show</div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative outline-none flex flex-col min-w-0 bg-[radial-gradient(#1A1A22_1px,transparent_1px)] bg-[size:32px_32px]">
        <header className="h-14 border-b border-white/10 bg-[#0E0E12] z-10 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-4">
             <div className="font-medium text-sm text-white/40 tracking-wide uppercase hidden md:block">Visual Workspace</div>
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
            <button className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 font-semibold" onClick={() => setIsAlertsOpen(true)}>
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
              <div className="text-[10px] text-white/20 uppercase tracking-widest mt-2">Ctrl N to add a source</div>
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
                    <h2 className="text-xl font-black font-serif tracking-tight text-[#E0E0E6]">Cash Source Summary</h2>
                    <button onClick={() => setSelectedCardId(null)} className="text-white/40 hover:text-white p-1 text-xs uppercase font-bold tracking-wider">Hide</button>
                  </div>
                  <div className="p-4 rounded-xl text-white shadow-md mb-2 relative overflow-hidden" style={{ backgroundColor: selectedCard.color || '#1a1a1a' }}>
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_white_0%,_transparent_50%)]"></div>
                    <div className="font-semibold text-lg drop-shadow-sm">{selectedCard.label}</div>
                    <div className="text-white/80 text-sm mt-1 mb-4 flex justify-between">
                      <span>{selectedCard.type}</span>
                      <span className="font-mono tracking-widest text-shadow-sm">Card Number {selectedCard.last4}</span>
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
                       <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Monthly Projection</div>
                       <div className="text-2xl font-light text-[#E0E0E6]">{currency} {monthlyCardTotal.toFixed(2)}</div>
                     </div>
                     <div>
                       <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Yearly Projection</div>
                       <div className="text-2xl font-light text-[#E0E0E6]">{currency} {annualCardTotal.toFixed(2)}</div>
                     </div>
                   </div>
                   
                   <h3 className="text-xs uppercase tracking-wider text-white/40 font-bold mb-3">Linked Services ({cardSubs.length})</h3>
                   <div className="space-y-3">
                     {cardSubs.map(s => (
                       <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border border-white/10 bg-[#15171E] cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => { setSelectedCardId(null); setSelectedSubId(s.id); }}>
                         <div>
                           <div className="font-semibold text-sm text-[#E0E0E6]">{s.serviceName}</div>
                           <div className="text-[10px] text-white/40">Renews {format(new Date(s.nextRenewalDate), 'MMM d, yyyy')}</div>
                         </div>
                         <div className="text-sm font-semibold text-[#E0E0E6] bg-white/5 px-2 py-0.5 rounded shadow-sm border border-white/10">{currency} {s.amount}</div>
                       </div>
                     ))}
                   </div>
                   <div className="mt-8 pt-6 border-t border-white/10">
                     <div className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-3">Suggested Card Upgrade</div>
                     <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 group cursor-pointer hover:bg-blue-600/20 transition-all">
                       <div className="flex justify-between items-start mb-2">
                         <div className="font-bold text-sm text-[#E0E0E6]">Sapphire High-Value Card</div>
                         <div className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black">AD</div>
                       </div>
                       <p className="text-[10px] text-white/50 mb-3">Earn 5% cashback on regular costs tracked here.</p>
                       <button className="w-full py-2 bg-blue-600 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest shadow-lg shadow-blue-600/20">Check Approval</button>
                     </div>
                   </div>
                </div>
                <div className="p-6 border-t border-white/10 mt-auto flex gap-3">
                    <button className="flex-1 btn-secondary text-sm" onClick={() => setIsEditCardOpen(true)}>Update</button>
                    <button 
                      onClick={() => { removeCard(selectedCard.id); setSelectedCardId(null); }}
                      className="flex-1 btn-danger text-sm"
                    >
                      Remove Source
                    </button>
                </div>
                <p className="text-[10px] text-white/40 text-center mt-2 pb-6">Unlinks all subscriptions</p>
             </div>
           )}

           {selectedSubId && selectedSub && (
             <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black font-serif tracking-tight text-[#E0E0E6]">Service Detail</h2>
                    <button onClick={() => setSelectedSubId(null)} className="text-white/40 hover:text-white p-1 text-xs uppercase font-bold tracking-wider">Hide</button>
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
                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 text-center">Better Card Choice</div>
                            <div className="flex justify-between items-center">
                               <span className="text-sm font-bold text-[#E0E0E6]">{hint[1].card}</span>
                               <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter bg-green-400/10 px-2 py-0.5 rounded">{hint[1].benefit}</span>
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
                         <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Planned Cost</div>
                         <div className="text-xl font-mono tracking-tight text-[#E0E0E6]">{currency} {selectedSub.amount}</div>
                      </div>
                      <div className="flex-1 border-l border-white/10 pl-4">
                         <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Payment Cycle</div>
                         <div className="text-sm font-medium capitalize text-[#E0E0E6]">{selectedSub.cycle}</div>
                      </div>
                   </div>

                   <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Next Renewal Date</div>
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
                        <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Cash Source</div>
                        {cards.find(c => c.id === selectedSub.cardId) ? (
                          <div 
                            className="flex items-center gap-3 p-3 bg-[#15171E] border border-white/10 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors shadow-sm"
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
                    <button className="flex-1 btn-secondary text-sm" onClick={() => setIsEditSubOpen(true)}>Update</button>
                    <button 
                      onClick={() => { removeSubscription(selectedSub.id); setSelectedSubId(null); }}
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
      <Modal isOpen={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} title="Add Cash Source">
         <AddCardForm onClose={() => setIsAddCardOpen(false)} />
      </Modal>

      <Modal isOpen={isEditCardOpen && !!selectedCard} onClose={() => setIsEditCardOpen(false)} title="Update Cash Source">
         <AddCardForm onClose={() => setIsEditCardOpen(false)} card={selectedCard || undefined} />
      </Modal>

      <Modal isOpen={isAddSubOpen} onClose={() => setIsAddSubOpen(false)} title="Add Regular Service">
         <AddSubForm onClose={() => setIsAddSubOpen(false)} initialCardId={selectedCardId || undefined} />
      </Modal>

      <Modal isOpen={isEditSubOpen && !!selectedSub} onClose={() => setIsEditSubOpen(false)} title="Update Service">
         <AddSubForm onClose={() => setIsEditSubOpen(false)} sub={selectedSub} />
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
         <SettingsForm onClose={() => setIsSettingsOpen(false)} />
      </Modal>

      <Modal isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} title="Alerts Dashboard">
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
                     {s.days < 0 ? <span className="text-red-400 font-bold">Past due by {Math.abs(s.days)} days</span> : <span className="text-amber-400 font-bold">Renews in {s.days} days</span>}
                     <span className="text-white/40 ml-2">({currency} {s.amount})</span>
                   </div>
                 </div>
                 <button className="btn-secondary text-xs py-1 px-3" onClick={() => { setIsAlertsOpen(false); setSelectedSubId(s.id); }}>Review</button>
               </div>
             ))}
           {subscriptions.filter(s => differenceInDays(new Date(s.nextRenewalDate), new Date()) <= 14).length === 0 && (
             <div className="text-center p-8 text-white/40">No upcoming renewals in the next 14 days.</div>
           )}
         </div>
      </Modal>

      <Modal isOpen={isPlansOpen} onClose={() => { setIsPlansOpen(false); setPlansPhase('pick'); }} title={plansPhase === 'pick' ? 'SELECT your PLAN' : plansPhase === 'pay' ? 'Payment Choice' : 'SUBMIT TRANSACTION'}>
         {plansPhase === 'pick' && (
           <>
            <div className="flex justify-center mb-8">
               <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
                  <button 
                     onClick={() => setIsYearlyBilling(false)}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isYearlyBilling ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                     MONTHLY
                  </button>
                  <button 
                     onClick={() => setIsYearlyBilling(true)}
                     className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isYearlyBilling ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                     YEARLY
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
               {/* No Cost Tier */}
               <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col h-full">
                  <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Basic</div>
                  <div className="text-3xl font-black text-[#E0E0E6] mb-4">No Cost</div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="text-xs text-white/70 flex items-center gap-2">3 Cash Sources</li>
                    <li className="text-xs text-white/70 flex items-center gap-2">10 Regular Services</li>
                    <li className="text-xs text-white/30 flex items-center gap-2 pt-3">Sync on Devices</li>
                  </ul>
                  <button className="w-full py-3 rounded-xl bg-white/10 text-white/60 text-xs font-bold uppercase tracking-widest cursor-default">Current Choice</button>
               </div>

               {/* Pro Tier */}
               <div className="p-6 rounded-2xl bg-blue-600/10 border-2 border-blue-500/50 flex flex-col h-full relative overflow-hidden shadow-2xl shadow-blue-600/20">
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-lg">TOP VALUE</div>
                  <div className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">PRO</div>
                  <div className="text-3xl font-black text-[#E0E0E6] mb-1">
                     {isYearlyBilling ? 'USD 20' : 'USD 2'}
                     <span className="text-[10px] font-bold text-white/40 ml-2 uppercase tracking-widest">
                        {isYearlyBilling ? 'YEARLY' : 'MONTHLY'}
                     </span>
                  </div>
                  {isYearlyBilling && (
                    <div className="text-[10px] font-bold text-green-400 mb-4 uppercase tracking-tighter">
                      SAVE 4 USD YEARLY
                    </div>
                  )}
                  {!isYearlyBilling && <div className="h-4 mb-4" />}
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="text-xs text-white/90 flex items-center gap-2">Unlimited Sources</li>
                    <li className="text-xs text-white/90 flex items-center gap-2">Unlimited Services</li>
                    <li className="text-xs text-white/90 flex items-center gap-2">Sync on Devices</li>
                    <li className="text-xs text-white/90 flex items-center gap-2">Data Reports</li>
                    <li className="text-xs text-white/90 flex items-center gap-2">Custom Themes</li>
                  </ul>
                  <button onClick={() => setPlansPhase('pay')} className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/40">Select PRO</button>
               </div>
            </div>
           </>
         )}

         {plansPhase === 'pay' && (
           <div className="space-y-4 p-2">
              <div className="text-xs text-white/50 mb-6">Choose how you want to send the value:</div>
              <button 
                onClick={() => { setPaymentMethod('payoneer'); setPlansPhase('verify'); }}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500/50 transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                   <div className="font-bold text-[#E0E0E6]">Payoneer</div>
                   <div className="text-[10px] text-white/40">Best for International transfers</div>
                </div>
                <div className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">PICK</div>
              </button>

              <button 
                onClick={() => { setPaymentMethod('bank'); setPlansPhase('verify'); }}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500/50 transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                   <div className="font-bold text-[#E0E0E6]">Pakistan Local Transfer</div>
                   <div className="text-[10px] text-white/40">Local Pouch or Bank IBAN</div>
                </div>
                <div className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">PICK</div>
              </button>

              <button onClick={() => setPlansPhase('pick')} className="w-full py-3 text-xs font-bold text-white/30 uppercase tracking-widest hover:text-white transition-colors">Go Back</button>
           </div>
         )}

         {plansPhase === 'verify' && (
           <div className="space-y-6 p-2">
              <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-500/20 text-xs leading-relaxed">
                 <div className="font-bold text-blue-400 uppercase mb-2">Instructions</div>
                 {paymentMethod === 'payoneer' ? (
                   <p>Send <span className="text-white font-bold">{isYearlyBilling ? 'USD 20' : 'USD 2'}</span> to Payoneer ID: <span className="text-white font-bold">your-id@email.com</span> (Placeholder). Once sent, paste the transaction ID below.</p>
                 ) : (
                   <p>Send <span className="text-white font-bold">{isYearlyBilling ? 'PKR 560' : 'PKR 60'}</span> to Phone Wallet (Local Pouch): <span className="text-white font-bold">03009100171</span>. Paste transaction ID below.</p>
                 )}
              </div>

              <div>
                 <label className="label-base">Transaction ID / Reference</label>
                 <input className="input-base" placeholder="Enter ID here" />
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setPlansPhase('pay')} className="flex-1 py-3 rounded-xl bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Back</button>
                 <button 
                  onClick={() => { alert('Transaction submitted for review!'); setIsPlansOpen(false); setPlansPhase('pick'); }}
                  className="flex-2 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                 >
                   Submit for Review
                 </button>
              </div>
           </div>
         )}
      </Modal>

    </div>
    </>
  );
}
