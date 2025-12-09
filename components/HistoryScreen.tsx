import React from 'react';
import { ParkingRecord, ParkingStatus, PaymentMethod, VehicleType } from '../types';
import { ArrowDownCircle, Clock, Calendar, Timer, Car, Bike, Truck } from 'lucide-react';
import { formatCurrency } from '../services/storageService';

interface HistoryScreenProps {
  records: ParkingRecord[];
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ records }) => {
  const completedRecords = records
    .filter(r => r.status === ParkingStatus.COMPLETED)
    .sort((a, b) => (b.exitTime || 0) - (a.exitTime || 0));

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getDuration = (entry: number, exit?: number) => {
      if (!exit) return '-';
      const diff = exit - entry;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
  };

  const translatePayment = (method?: PaymentMethod) => {
      switch (method) {
          case PaymentMethod.CASH: return 'DINHEIRO';
          case PaymentMethod.CARD: return 'CARTÃO';
          case PaymentMethod.PIX: return 'PIX';
          default: return '-';
      }
  };

  const getVehicleIcon = (type: VehicleType) => {
      switch (type) {
          case VehicleType.MOTORCYCLE: return <Bike size={14} />;
          case VehicleType.TRUCK: return <Truck size={14} />;
          default: return <Car size={14} />;
      }
  };

  return (
    <div className="h-full flex flex-col pb-20 animate-fade-in">
        <header className="mb-4">
            <h1 className="text-xl font-bold text-slate-900">Histórico</h1>
            <p className="text-xs text-slate-500">Transações recentes</p>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            {completedRecords.map((record) => (
                <div key={record.id} className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Vaga Enhanced: Icon + Number */}
                        <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 shrink-0 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            {getVehicleIcon(record.type)}
                            <span className="text-[10px] font-black mt-0.5 leading-none text-slate-600">#{record.spotNumber}</span>
                        </div>
                        
                        {/* Informações Centrais */}
                        <div>
                            <h3 className="text-base font-mono font-bold text-slate-800 leading-tight">{record.plate}</h3>
                            
                            <div className="flex flex-col gap-0.5 mt-1">
                                {/* Data e Hora */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="flex items-center gap-0.5"><Calendar size={10} /> {new Date(record.exitTime!).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-0.5"><Clock size={10} /> {formatTime(record.entryTime)} - {formatTime(record.exitTime!)}</span>
                                </div>
                                
                                {/* Tempo Total (Com Segundos) */}
                                <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 w-fit px-1.5 rounded-sm">
                                    <Timer size={10} /> 
                                    <span>Tempo: {getDuration(record.entryTime, record.exitTime)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Valores e Pagamento */}
                    <div className="text-right shrink-0">
                         <span className="block text-base font-black text-slate-800">{formatCurrency(record.totalCost || 0)}</span>
                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                             record.paymentMethod === PaymentMethod.PIX ? 'bg-indigo-50 text-indigo-600' : 
                             record.paymentMethod === PaymentMethod.CARD ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                         }`}>
                             {translatePayment(record.paymentMethod)}
                         </span>
                    </div>
                </div>
            ))}
            
            {completedRecords.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <ArrowDownCircle size={24} className="opacity-20 mb-2" />
                    <p className="text-sm">Sem histórico.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default HistoryScreen;