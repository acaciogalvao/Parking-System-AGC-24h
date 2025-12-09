import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogIn, LayoutGrid, History, Settings, CarFront } from 'lucide-react';
import Dashboard from './components/Dashboard';
import EntryScreen from './components/EntryScreen';
import ExitScreen from './components/ExitScreen';
import HistoryScreen from './components/HistoryScreen';
import SettingsScreen from './components/SettingsScreen';
import { getRecords, initData } from './services/storageService';
import { ParkingRecord } from './types';

enum View {
  DASHBOARD = 'DASHBOARD',
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [records, setRecords] = useState<ParkingRecord[]>([]);

  const refreshData = async () => {
    try {
        const data = await getRecords();
        setRecords(data);
    } catch (e) {
        console.error("Refresh error", e);
    }
  };

  useEffect(() => {
    const init = async () => {
        await initData();
        await refreshData();
    };
    init();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard records={records} />;
      case View.ENTRY:
        return <EntryScreen onSuccess={() => { setCurrentView(View.EXIT); refreshData(); }} />;
      case View.EXIT:
        return <ExitScreen records={records} onUpdate={refreshData} />;
      case View.HISTORY:
        return <HistoryScreen records={records} />;
      case View.SETTINGS:
        return <SettingsScreen onBack={() => setCurrentView(View.DASHBOARD)} />;
      default:
        return <Dashboard records={records} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f5ff] font-sans">
        {/* Top Bar */}
        <div className="h-16 bg-white/80 backdrop-blur-md border-b border-indigo-50 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#5847eb] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <CarFront className="text-white" size={20} />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-xl text-slate-800 tracking-tight leading-none">AGC <span className="text-[#5847eb]">Parking</span></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sistema v2.0</span>
                </div>
            </div>
            <button 
                onClick={() => setCurrentView(View.SETTINGS)}
                className={`transition-all p-2 rounded-xl hover:bg-indigo-50 ${currentView === View.SETTINGS ? 'text-[#5847eb] bg-indigo-50' : 'text-slate-400 hover:text-[#5847eb]'}`}
            >
                <Settings size={22} />
            </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6">
            {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-slate-100 h-20 shrink-0 flex justify-around items-center px-2 pb-2 sticky bottom-0 z-40 shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.05)] rounded-t-3xl">
            <NavButton 
                active={currentView === View.DASHBOARD} 
                onClick={() => { refreshData(); setCurrentView(View.DASHBOARD); }} 
                icon={LayoutDashboard} 
                label="Painel" 
            />
            <NavButton 
                active={currentView === View.ENTRY} 
                onClick={() => setCurrentView(View.ENTRY)} 
                icon={LogIn} 
                label="Entrada" 
            />
             <NavButton 
                active={currentView === View.EXIT} 
                onClick={() => { refreshData(); setCurrentView(View.EXIT); }} 
                icon={LayoutGrid} 
                label="Vagas" 
            />
             <NavButton 
                active={currentView === View.HISTORY} 
                onClick={() => { refreshData(); setCurrentView(View.HISTORY); }} 
                icon={History} 
                label="Histórico" 
            />
        </nav>
    </div>
  );
};

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon: Icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 active:scale-95 group ${
            active ? 'text-[#5847eb]' : 'text-slate-400 hover:text-slate-600'
        }`}
    >
        <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-[#5847eb] text-white -translate-y-2 shadow-lg shadow-indigo-200' : 'group-hover:bg-slate-50'}`}>
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-medium transition-opacity ${active ? 'opacity-100 font-bold translate-y-[-4px]' : 'opacity-70'}`}>{label}</span>
    </button>
);

export default App;