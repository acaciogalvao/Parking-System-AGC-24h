import React, { useState, useMemo, useEffect } from 'react';
import { ParkingRecord, ParkingStatus, VehicleType } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Car, DollarSign, Activity, Clock, Truck, Bike, Map as MapIcon, HardDrive, TrendingUp } from 'lucide-react';
import { formatCurrency, getConfig } from '../services/apiService';\nimport StatusIndicator from './StatusIndicator';

interface DashboardProps {
  records: ParkingRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ records }) => {
  const [mapType, setMapType] = useState<VehicleType>(VehicleType.CAR);
  const [totalSpots, setTotalSpots] = useState({ CAR: 50, MOTORCYCLE: 20, TRUCK: 10 });

  useEffect(() => {
    getConfig().then(config => setTotalSpots(config.totalSpots));
  }, []);

  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const active = records.filter(r => r.status === ParkingStatus.ACTIVE).length;
    const todayRecords = records.filter(r => r.entryTime >= today);
    const todayRevenue = todayRecords.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
    const todayEntries = todayRecords.length;
    
    let totalDuration = 0;
    const completedToday = todayRecords.filter(r => r.status === ParkingStatus.COMPLETED && r.exitTime);
    completedToday.forEach(r => totalDuration += (r.exitTime! - r.entryTime));
    const avgMinutes = completedToday.length ? Math.round((totalDuration / completedToday.length) / 60000) : 0;

    return { active, todayRevenue, todayEntries, avgMinutes };
  }, [records]);

  const chartData = useMemo(() => {
    const data = Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
    const today = new Date().setHours(0, 0, 0, 0);
    records.filter(r => r.entryTime >= today).forEach(r => {
      const hour = new Date(r.entryTime).getHours();
      data[hour].count += 1;
    });
    return data;
  }, [records]);

  const mapData = useMemo(() => {
    const spots = totalSpots[mapType];
    const occupiedSet = new Set(
        records
            .filter(r => r.status === ParkingStatus.ACTIVE && r.type === mapType)
            .map(r => r.spotNumber)
    );

    return { totalSpots: spots, occupiedSet };
  }, [records, mapType, totalSpots]);

  const getOccupancyColor = (type: VehicleType) => {
      switch(type) {
          case VehicleType.MOTORCYCLE: return 'bg-orange-500 shadow-orange-200';
          case VehicleType.TRUCK: return 'bg-purple-500 shadow-purple-200';
          default: return 'bg-[#5847eb] shadow-indigo-200'; // Brand Purple
      }
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header Compacto com Status */}
      <div className="flex justify-between items-start mb-2">
        <div>
           <h1 className="text-2xl font-black text-slate-800 tracking-tight">Visão Geral</h1>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
            
            <StatusIndicator />\n            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors bg-slate-100 text-slate-500 border-slate-200">\n                <HardDrive size={12} />\n                MODO LOCAL\n            </div>
        </div>
      </div>

      {/* Grid 2x2 Estilo Hostinger */}
      <div className="grid grid-cols-2 gap-3">
        {/* Ativos - Purple Theme */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute right-0 top-0 w-16 h-16 bg-[#5847eb]/5 rounded-bl-full -mr-2 -mt-2"></div>
           <div className="flex justify-between items-start z-10">
               <div className="bg-[#f0eeff] p-2.5 rounded-xl text-[#5847eb]"><Car size={20} strokeWidth={2.5} /></div>
               <span className="text-[10px] font-black text-[#5847eb]/60 uppercase tracking-wider">Pátio</span>
           </div>
           <div className="z-10">
               <span className="text-4xl font-black text-slate-800 tracking-tighter">{stats.active}</span>
               <span className="text-xs font-bold text-slate-400 ml-1">veículos</span>
           </div>
        </div>

        {/* Faturamento - Teal Theme (Hostinger Green) */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="absolute right-0 top-0 w-16 h-16 bg-[#00b090]/5 rounded-bl-full -mr-2 -mt-2"></div>
           <div className="flex justify-between items-start z-10">
               <div className="bg-[#e0f7fa] p-2.5 rounded-xl text-[#00b090]"><DollarSign size={20} strokeWidth={2.5} /></div>
               <span className="text-[10px] font-black text-[#00b090]/60 uppercase tracking-wider">Receita</span>
           </div>
           <div className="z-10">
               <span className="text-2xl font-black text-[#00b090] tracking-tight">{formatCurrency(stats.todayRevenue)}</span>
           </div>
        </div>

        {/* Entradas */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg"><Activity size={14} strokeWidth={3} /></div>
                <span className="text-xs font-bold text-slate-500">Fluxo</span>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-black text-slate-800">{stats.todayEntries}</span>
                <span className="text-[10px] font-bold text-slate-400 mb-1">entradas</span>
            </div>
        </div>

        {/* Média Tempo */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg"><Clock size={14} strokeWidth={3} /></div>
                <span className="text-xs font-bold text-slate-500">Média</span>
            </div>
            <div className="flex items-end gap-2">
                 <span className="text-2xl font-black text-slate-800">{stats.avgMinutes}</span>
                 <span className="text-[10px] font-bold text-slate-400 mb-1">min/veículo</span>
            </div>
        </div>
      </div>

      {/* MAPA DE VAGAS EM TEMPO REAL */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
                <div className="bg-slate-50 p-2 rounded-xl text-slate-400"><MapIcon size={18} /></div>
                <div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Mapa de Vagas</h3>
                    <div className="text-[10px] font-bold text-[#5847eb]">
                        {mapData.occupiedSet.size} de {mapData.totalSpots} ocupadas
                    </div>
                </div>
            </div>
            
            {/* Toggle Tipo Veículo */}
            <div className="flex bg-[#f4f5ff] p-1 rounded-xl">
                {[
                    { id: VehicleType.CAR, icon: Car },
                    { id: VehicleType.MOTORCYCLE, icon: Bike },
                    { id: VehicleType.TRUCK, icon: Truck },
                ].map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setMapType(v.id)}
                        className={`p-2 rounded-lg transition-all ${mapType === v.id ? 'bg-white text-[#5847eb] shadow-sm' : 'text-slate-400'}`}
                    >
                        <v.icon size={16} />
                    </button>
                ))}
            </div>
        </div>

        {/* Grid Visual */}
        <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {Array.from({ length: mapData.totalSpots }, (_, i) => i + 1).map((spotNum) => {
                const isOccupied = mapData.occupiedSet.has(spotNum);
                return (
                    <div 
                        key={spotNum}
                        className={`
                            aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all
                            ${isOccupied 
                                ? `${getOccupancyColor(mapType)} text-white shadow-md scale-105` 
                                : 'bg-slate-50 text-slate-300 border border-slate-100'
                            }
                        `}
                    >
                        {spotNum}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Chart Compacto */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
             <TrendingUp size={16} className="text-[#00b090]" />
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Movimento Horário</h3>
        </div>
        <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
                <XAxis 
                    dataKey="hour" 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} 
                    axisLine={false} 
                    tickLine={false} 
                    interval={3}
                    tickFormatter={(tick) => `${tick}h`}
                />
                <Tooltip 
                    cursor={{fill: '#f4f5ff', radius: 8}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: number) => [value, 'Veículos']}
                    labelFormatter={(label) => `${label}:00`}
                />
                <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#5847eb' : '#e2e8f0'} />
                    ))}
                </Bar>
            </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;