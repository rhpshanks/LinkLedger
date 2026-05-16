import { useState, FormEvent } from 'react';
import { useAppStore } from '../store';
import { Card, Subscription } from '../types';

export function AddCardForm({ onClose, card }: { onClose: () => void; card?: Card }) {
  const { addCard, updateCard, currency } = useAppStore();
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      label: formData.get('label') as string,
      last4: formData.get('last4') as string,
      type: formData.get('type') as string,
      limit: formData.get('limit') ? Number(formData.get('limit')) : undefined,
      color: formData.get('color') as string || '#000',
    };

    if (card) {
      updateCard(card.id, data);
    } else {
      addCard(data);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-base">Source Label</label>
        <input name="label" required defaultValue={card?.label} placeholder="like Operations Card" className="input-base" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base">Last 4 Digits</label>
          <input name="last4" required maxLength={4} defaultValue={card?.last4} pattern="\d{4}" placeholder="1234" className="input-base" />
        </div>
        <div>
          <label className="label-base">Source Type</label>
          <select name="type" className="input-base" defaultValue={card?.type}>
            <option value="Visa">Visa</option>
            <option value="Bank Card">Bank Card</option>
            <option value="Amex">Amex</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label-base">Planned MONTHLY use alerts (Optional, {currency})</label>
        <input name="limit" type="number" min="0" defaultValue={card?.limit} placeholder="like 5000" className="input-base" />
      </div>
      <div>
        <label className="label-base">Color Profile</label>
        <div className="flex gap-2">
          {['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#475569', '#000000'].map(c => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} className="peer sr-only" defaultChecked={c === '#000000'} />
              <div className="w-8 h-8 rounded-full border-2 border-[#15171E] peer-checked:border-blue-500 peer-checked:ring-2 peer-checked:ring-white/10 shadow-sm" style={{ backgroundColor: c }} />
            </label>
          ))}
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{card ? 'Update Source' : 'Save Source'}</button>
      </div>
    </form>
  )
}

export function AddSubForm({ onClose, initialCardId, sub }: { onClose: () => void, initialCardId?: string, sub?: Subscription }) {
  const { cards, addSubscription, updateSubscription, currency } = useAppStore();
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      serviceName: formData.get('serviceName') as string,
      url: formData.get('url') as string,
      amount: Number(formData.get('amount')),
      cycle: formData.get('cycle') as Subscription['cycle'],
      nextRenewalDate: new Date(formData.get('nextRenewalDate') as string).toISOString(),
      cardId: formData.get('cardId') as string,
      currency: formData.get('currency') as string,
    };
    if (sub) {
      updateSubscription(sub.id, data);
    } else {
      addSubscription(data);
    }
    onClose();
  };

  const defaultDate = sub?.nextRenewalDate ? new Date(sub.nextRenewalDate).toISOString().split('T')[0] : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-base">Service Name</label>
        <input name="serviceName" required defaultValue={sub?.serviceName} placeholder="like Adobe Creative Cloud" className="input-base" />
      </div>
      <div>
        <label className="label-base">Website URL (Optional)</label>
        <input name="url" type="url" defaultValue={sub?.url} placeholder="https://adobe.com" className="input-base" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base">Planned Cost ({currency})</label>
          <input name="amount" type="number" step="0.01" min="0" required defaultValue={sub?.amount} placeholder="54.99" className="input-base" />
        </div>
        <div>
          <label className="label-base">Billing Cycle</label>
          <select name="cycle" className="input-base" defaultValue={sub?.cycle || 'monthly'}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">90 Day Cycle</option>
            <option value="annual">Yearly</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label-base">Specific Currency for this Service</label>
        <select name="currency" className="input-base" defaultValue={sub?.currency || currency}>
          <option value="USD">USD</option>
          <option value="PKR">PKR</option>
          <option value="GBP">GBP</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        <label className="label-base">CALENDAR</label>
        <input name="nextRenewalDate" type="date" required defaultValue={defaultDate} className="input-base" />
      </div>
      <div>
        <label className="label-base">Linked Source</label>
        <select name="cardId" required className="input-base" defaultValue={sub?.cardId || initialCardId || ''}>
          <option value="">Select a source...</option>
          {cards.map(c => (
             <option key={c.id} value={c.id}>{c.label} (Card Number {c.last4})</option>
          ))}
        </select>
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">{sub ? 'Save Updates' : 'Save Service'}</button>
      </div>
    </form>
  )
}

export function SettingsForm({ onClose }: { onClose: () => void }) {
  const { alertsPrefs, setAlertsPrefs, currency, setCurrency } = useAppStore();
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setCurrency(formData.get('currency') as string);
    setAlertsPrefs({
      advanceNoticeDays: Number(formData.get('advanceNoticeDays')),
      notifyInApp: formData.get('notifyInApp') === 'on',
      notifyEmail: formData.get('notifyEmail') === 'on',
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-base">Display Currency</label>
        <select name="currency" className="input-base" defaultValue={currency}>
          <option value="USD">USD</option>
          <option value="PKR">PKR</option>
          <option value="GBP">GBP</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        <label className="label-base">Cycle Reminder (Advance Notice)</label>
        <select name="advanceNoticeDays" className="input-base" defaultValue={alertsPrefs.advanceNoticeDays}>
          <option value="7">7 Days Prior</option>
          <option value="14">14 Days Prior</option>
          <option value="30">30 Days Prior</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="label-base">Notification Channels</label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="notifyInApp" defaultChecked={alertsPrefs.notifyInApp} className="rounded border-white/10 text-blue-500 focus:ring-blue-500 bg-[#0E0E12]" />
          <span className="text-sm">In-App Notifications Dashboard</span>
        </label>
      </div>

      <div className="pt-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="label-base !mb-0 text-blue-400">See PLANS</label>
          <span className="text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded font-black">PRO ONLY</span>
        </div>
        <div className="space-y-2 opacity-50 grayscale cursor-not-allowed">
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled className="rounded border-white/10 bg-[#0E0E12]" />
            <span className="text-sm">Sync on Devices</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" disabled className="rounded border-white/10 bg-[#0E0E12]" />
            <span className="text-sm">Data Audit Creation (PDF/CSV)</span>
          </label>
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save Preferences</button>
      </div>
    </form>
  )
}
