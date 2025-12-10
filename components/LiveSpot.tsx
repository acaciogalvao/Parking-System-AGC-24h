import React, { useMemo } from 'react';
import { ParkingRecord, VehicleType } from '../types';
import { formatCurrency } from '../services/apiService';
import { calculateCostSync } from '../services/costHelper';
import { Clock, Car, Bike, Truck, ChevronRight } from 'lucide-react';

interface LiveSpotProps {
  record: ParkingRecord;
  onClick: (record: ParkingRecord) => void;
  currentTimestamp: number;
}

const LiveSpot: React.FC<LiveSpotProps> = ({ record, onClick, currentTimestamp }) => {
  
  const { elapsed, currentCost, isOverHour } = useMemo(() => {
      const diff = currentTimestamp - record.entryTime;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const elapsedStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      const cost = calculateCostSync(record.entryTime, currentTimestamp, record.type);

      return { elapsed: elapsedStr, currentCost: cost, isOverHour: hours > 0 };
  }, [record, currentTimestamp]);

  const getIcon = () => {
    switch (record.type) {
        case VehicleType.MOTORCYCLE: return <Bike size={18} />;
        case VehicleType.TRUCK: return <Truck size={18} />;
        default: return <Car size={18} />;
    }
  };

  const theme = useMemo(() => {
     switch (record.type) {
        case VehicleType.MOTORCYCLE: return { 
            bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', 
            iconBg: 'bg-orange-100/50'
        };
        case VehicleType.TRUCK: return { 
            bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', 
            iconBg: 'bg-purple-100/50'
        };
        default: return { 
            bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-700', 
            iconBg: 'bg-slate-100'
        };
    }
  }, [record.type]);

  return (
    <div 
        onClick={() => onClick(record)}
        className={`relative p-3 rounded-xl border shadow-sm active:scale-[0.98] transition-all flex items-center gap-3 h-20 ${theme.bg} ${theme.border}`}
    >
        {/* Ícone e Vaga (Esquerda) */}
        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 ${theme.iconBg} ${theme.text}`}>
            {getIcon()}
            <span className="text-[10px] font-bold mt-0.5 leading-none">#{record.spotNumber}</span>
        </div>

        {/* Info Central (Placa e Cronômetro) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-lg font-black text-slate-800 font-mono tracking-wide leading-none mb-1">{record.plate}</h3>
            <div className={`flex items-center gap-1.5 font-mono font-bold text-sm ${isOverHour ? 'text-red-500' : 'text-indigo-600'}`}>
                <Clock size={12} className={isOverHour ? 'animate-pulse' : ''} />
                {elapsed}
            </div>
        </div>

        {/* Valor e Ação (Direita) */}
        <div className="flex items-center gap-3 shrink-0">
             <div className="text-right">
                <span className="block text-lg font-black text-slate-900 leading-none">
                    {formatCurrency(currentCost)}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
             </div>
             <ChevronRight size={18} className="text-slate-300" />
        </div>
    </div>
  );
};

export default LiveSpot;