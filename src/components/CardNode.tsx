import { Handle, Position } from '@xyflow/react';
import { Card } from '../types';
import { CreditCard, MoreVertical } from 'lucide-react';
import { useAppStore } from '../store';

export function CardNode({ data }: { data: Card & { isAlert: boolean, onClick: () => void } }) {
  const { currency } = useAppStore();
  return (
    <div 
      className={`card flex flex-col p-4 w-52 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:z-50 transition-all duration-300 bg-[#1E222D] ${
        data.isAlert ? '!border-red-500/50 shadow-red-500/10' : 'border-blue-500/50 shadow-blue-500/10'
      }`}
      onClick={data.onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] uppercase font-mono text-white/40">{data.label}</span>
        {data.isAlert ? (
          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] rounded font-bold uppercase">Budget Surpassed</span>
        ) : (
          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] rounded font-bold uppercase" style={{ color: data.color ? data.color : undefined, backgroundColor: data.color ? `${data.color}33` : undefined }}>{data.type}</span>
        )}
      </div>

      <div className="flex items-center gap-2 text-[#E0E0E6] mb-1">
        <span className="font-mono text-sm tracking-wider">Card Number {data.last4}</span>
      </div>

      {data.limit && (
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
          <span className={`text-xs ${data.isAlert ? 'text-red-400' : 'text-white/40'}`}>Budget: {data.limit.toLocaleString()} MONTHLY {currency}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="w-2 h-8 !bg-white/10 !border-0 !rounded-none -mr-1" />
    </div>
  );
}
