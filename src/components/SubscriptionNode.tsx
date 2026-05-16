import { Handle, Position } from '@xyflow/react';
import { Subscription } from '../types';
import { Globe, Clock, AlertCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useAppStore } from '../store';

export function SubscriptionNode({ data }: { data: Subscription & { onClick: () => void; isPastDue: boolean; isApproaching: boolean; } }) {
  const { currency } = useAppStore();
  const nextDate = new Date(data.nextRenewalDate);
  const daysUntil = differenceInDays(nextDate, new Date());
  
  const statusColor = data.isPastDue ? '#ef4444' : data.isApproaching ? '#f59e0b' : '#22c55e';

  return (
    <div 
      className={`card flex flex-col p-3 w-56 cursor-pointer hover:scale-105 hover:-translate-y-1 hover:shadow-xl hover:z-50 transition-all duration-300 relative ${
        data.isPastDue 
          ? '!border-red-500 shadow-lg shadow-red-500/20' 
          : data.isApproaching 
            ? 'border-amber-500/50 shadow-md shadow-amber-500/10' 
            : 'border-white/10 hover:border-blue-500/50'
      }`}
      style={{ background: '#15171E' }}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-8 !bg-white/10 !border-0 !rounded-none -ml-1" />

      {/* Status dot */}
      <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />

      <div className="flex justify-between items-start mb-2 pr-4">
        <div className="font-medium text-xs truncate max-w-[130px] text-[#E0E0E6]">{data.serviceName}</div>
        <div className="text-[10px] font-semibold whitespace-nowrap bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[#E0E0E6]">
          <span className="text-[8px] text-white/40 font-normal uppercase">{currency} {data.cycle === 'monthly' ? 'MONTHLY' : data.cycle === 'annual' ? 'ANNUAL' : 'QUARTERLY'}</span> {data.amount.toLocaleString()}
        </div>
      </div>
      
      {data.url && (
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-3 truncate">
          <Globe size={10} />
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors" onClick={e => e.stopPropagation()}>
            {data.url}
          </a>
        </div>
      )}

      <div className={`flex items-center gap-1.5 text-[10px] font-medium px-1.5 py-1 rounded ${
        data.isPastDue 
          ? 'bg-red-500/20 text-red-400' 
          : data.isApproaching
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-green-500/20 text-green-400'
      }`}>
        {data.isPastDue ? <AlertCircle size={10} /> : <Clock size={10} />}
        <span>
          {data.isPastDue 
            ? `Past due by ${Math.abs(daysUntil)}d` 
            : `Renews in ${daysUntil}d`}
        </span>
      </div>
      
      {data.isPastDue && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm">!</div>
      )}
    </div>
  );
}
