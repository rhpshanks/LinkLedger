import { Handle, Position } from '@xyflow/react';
import { Card } from '../types';
import { CreditCard } from 'lucide-react';
import { useAppStore } from '../store';

export function CardNode({ data }: { data: Card & { isAlert: boolean, onClick: () => void } }) {
  const { currency } = useAppStore();
  return (
    <div 
      className={`card flex flex-col p-4 w-52 cursor-pointer hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-[#1E222D] ${
        data.isAlert 
          ? '!border-red-500/60 shadow-lg shadow-red-500/20 hover:shadow-red-500/30' 
          : 'border-blue-500/40 shadow-md shadow-blue-500/10 hover:border-blue-400/70 hover:shadow-blue-500/20 hover:z-50'
      }`}
      onClick={data.onClick}
    >
      {/* Card header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: data.color ? `${data.color}33` : '#2563eb22' }}>
            <CreditCard size={14} style={{ color: data.color || '#60a5fa' }} />
          </div>
          <span className="text-[10px] uppercase font-mono text-white/50">{data.label}</span>
        </div>
        {data.isAlert ? (
          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] rounded font-bold uppercase leading-tight">Budget Requires Attention</span>
        ) : (
          <span className="px-1.5 py-0.5 text-[9px] rounded font-bold uppercase" style={{ color: data.color || '#60a5fa', backgroundColor: data.color ? `${data.color}22` : '#2563eb22' }}>{data.type}</span>
        )}
      </div>

      <div className="flex items-center gap-2 text-[#E0E0E6] mb-1">
        <span className="font-mono text-sm tracking-wider">Card Number {data.last4}</span>
      </div>

      {data.limit && (
        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-end">
          <span className={`text-[10px] ${data.isAlert ? 'text-red-400 font-semibold' : 'text-white/40'}`}>MONTHLY use: {currency} {data.limit.toLocaleString()}</span>
          {data.isAlert && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2 h-8 !bg-white/10 !border-0 !rounded-none -mr-1" />
    </div>
  );
}
