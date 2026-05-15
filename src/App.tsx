/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Canvas } from './components/Canvas';
import { useAppStore } from './store';
import { Plus, CreditCard, LayoutDashboard, Settings as SettingsIcon, Bell } from 'lucide-react';
import { Modal } from './components/Modal';
import { AddCardForm, AddSubForm, SettingsForm } from './components/forms';
import { differenceInDays, format } from 'date-fns';

export default function App() {
  const { cards, subscriptions, removeCard, removeSubscription, updateNodesPositions } = useAppStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isEditSubOpen, setIsEditSubOpen] = useState(false);
  
  const [filterType, setFilterType] = useState<'all' | 'alert' | 'soon' | 'high_cost'>('all');

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
    <div className="flex h-screen w-full overflow-hidden bg-[#0A0A0C] text-[#E0E0E6] font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-16 md:w-64 border-r border-white/10 flex flex-col pt-6 pb-4 bg-[#0E0E12] shrink-0 z-10 transition-all">
        <div className="px-4 mb-8 flex items-center md:gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold shadow-sm">
            LL
          </div>
          <h1 className="font-serif font-bold text-xl hidden md:block tracking-tight text-[#E0E0E6]">LinkLedger</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <button 
            onClick={() => setIsAddCardOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white transition-colors"
          >
            <CreditCard size={18} className="shrink-0" />
            <span className="hidden md:block">Add Card</span>
          </button>
          <button 
            onClick={() => setIsAddSubOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white transition-colors"
          >
            <Plus size={18} className="shrink-0" />
            <span className="hidden md:block">Add Subscription</span>
          </button>
        </nav>

        <div className="px-3 mt-auto">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/60 rounded-lg hover:text-white transition-colors"
          >
            <SettingsIcon size={18} className="shrink-0" />
            <span className="hidden md:block">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 relative outline-none flex flex-col min-w-0 bg-[radial-gradient(#1A1A22_1px,transparent_1px)] bg-[size:32px_32px]">
        <header className="h-14 border-b border-white/10 bg-[#0E0E12] z-10 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
             <div className="font-medium text-sm text-white/40 tracking-wide uppercase hidden md:block">Visual Workspace</div>
             <select 
               className="text-sm border border-white/10 bg-[#1E222D] text-[#E0E0E6] rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500 outline-none"
               value={filterType}
               onChange={e => setFilterType(e.target.value as any)}
             >
               <option value="all">All Items</option>
               <option value="alert">Needs Attention</option>
               <option value="soon">Renewing Soon (≤14 days)</option>
               <option value="high_cost">High Cost (&gt;$50)</option>
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
          <Canvas 
            onSelectCard={(id) => { setSelectedSubId(null); setSelectedCardId(id); }}
            onSelectSub={(id) => { setSelectedCardId(null); setSelectedSubId(id); }}
            filterType={filterType}
          />
        </div>
      </main>

      {/* Details Panel - Slides in when a node is selected */}
      {(selectedCardId || selectedSubId) && (
        <aside className="w-80 border-l border-white/10 bg-[#0E0E12] absolute right-0 inset-y-0 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-8 duration-200">
           {selectedCardId && selectedCard && (
             <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black font-serif tracking-tight text-[#E0E0E6]">Card Summary</h2>
                    <button onClick={() => setSelectedCardId(null)} className="text-white/40 hover:text-white p-1">×</button>
                  </div>
                  <div className="p-4 rounded-xl text-white shadow-md mb-2 relative overflow-hidden" style={{ backgroundColor: selectedCard.color || '#1a1a1a' }}>
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_100%_0%,_white_0%,_transparent_50%)]"></div>
                    <div className="font-semibold text-lg drop-shadow-sm">{selectedCard.label}</div>
                    <div className="text-white/80 text-sm mt-1 mb-4 flex justify-between">
                      <span>{selectedCard.type}</span>
                      <span className="font-mono tracking-widest text-shadow-sm">•••• {selectedCard.last4}</span>
                    </div>
                  </div>
                  {selectedCard.limit && (
                    <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 flex justify-between items-center">
                      <span className="font-semibold">Spend Limit</span>
                      <span className={`font-bold ${monthlyCardTotal > selectedCard.limit ? 'text-red-400' : 'text-green-400'}`}>
                        ${selectedCard.limit.toLocaleString()}/mo
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                   <div className="grid grid-cols-2 gap-4 mb-8">
                     <div>
                       <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Monthly Cost</div>
                       <div className="text-2xl font-light text-[#E0E0E6]">${monthlyCardTotal.toFixed(2)}</div>
                     </div>
                     <div>
                       <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Annual Cost</div>
                       <div className="text-2xl font-light text-[#E0E0E6]">${annualCardTotal.toFixed(2)}</div>
                     </div>
                   </div>
                   
                   <h3 className="text-xs uppercase tracking-wider text-white/40 font-bold mb-3">Linked Subscriptions ({cardSubs.length})</h3>
                   <div className="space-y-3">
                     {cardSubs.map(s => (
                       <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border border-white/10 bg-[#15171E] cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => { setSelectedCardId(null); setSelectedSubId(s.id); }}>
                         <div>
                           <div className="font-semibold text-sm text-[#E0E0E6]">{s.serviceName}</div>
                           <div className="text-[10px] text-white/40">Renews {format(new Date(s.nextRenewalDate), 'MMM d, yyyy')}</div>
                         </div>
                         <div className="text-sm font-semibold text-[#E0E0E6] bg-white/5 px-2 py-0.5 rounded shadow-sm border border-white/10">${s.amount}</div>
                       </div>
                     ))}
                   </div>
                </div>
                <div className="p-6 border-t border-white/10 mt-auto">
                    <button 
                      onClick={() => { removeCard(selectedCard.id); setSelectedCardId(null); }}
                      className="w-full btn-danger text-sm"
                    >
                      Remove Card
                    </button>
                    <p className="text-[10px] text-white/40 text-center mt-2">Unlinks all subscriptions</p>
                </div>
             </div>
           )}

           {selectedSubId && selectedSub && (
             <div className="flex flex-col h-full">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black font-serif tracking-tight text-[#E0E0E6]">Subscription Detail</h2>
                    <button onClick={() => setSelectedSubId(null)} className="text-white/40 hover:text-white p-1">×</button>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                   <div>
                      <div className="text-2xl font-semibold text-[#E0E0E6] mb-1">{selectedSub.serviceName}</div>
                      {selectedSub.url && <a href={selectedSub.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1">{selectedSub.url} ♥</a>}
                   </div>

                   <div className="flex items-center gap-4 py-4 border-y border-white/10">
                      <div className="flex-1">
                         <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Billing Amount</div>
                         <div className="text-xl font-mono tracking-tight text-[#E0E0E6]">${selectedSub.amount}</div>
                      </div>
                      <div className="flex-1 border-l border-white/10 pl-4">
                         <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">Billing Cycle</div>
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
                        <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Payment Source</div>
                        {cards.find(c => c.id === selectedSub.cardId) ? (
                          <div 
                            className="flex items-center gap-3 p-3 bg-[#15171E] border border-white/10 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors shadow-sm"
                            onClick={() => { setSelectedSubId(null); setSelectedCardId(selectedSub.cardId!); }}
                          >
                            <CreditCard size={18} className="text-white/40" />
                            <div>
                               <div className="text-sm font-medium text-[#E0E0E6]">{cards.find(c => c.id === selectedSub.cardId)?.label}</div>
                               <div className="text-xs text-white/40 font-mono">•••• {cards.find(c => c.id === selectedSub.cardId)?.last4}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-red-500">Card not found.</div>
                        )}
                     </div>
                   )}
                </div>
                <div className="p-6 border-t border-white/10 mt-auto flex gap-3">
                    <button className="flex-1 btn-secondary text-sm" onClick={() => setIsEditSubOpen(true)}>Edit</button>
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
      <Modal isOpen={isAddCardOpen} onClose={() => setIsAddCardOpen(false)} title="Add Payment Card">
         <AddCardForm onClose={() => setIsAddCardOpen(false)} />
      </Modal>

      <Modal isOpen={isAddSubOpen} onClose={() => setIsAddSubOpen(false)} title="Add Subscription">
         <AddSubForm onClose={() => setIsAddSubOpen(false)} initialCardId={selectedCardId || undefined} />
      </Modal>

      <Modal isOpen={isEditSubOpen && !!selectedSub} onClose={() => setIsEditSubOpen(false)} title="Edit Subscription">
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
                     <span className="text-white/40 ml-2">(${s.amount})</span>
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

    </div>
  );
}
