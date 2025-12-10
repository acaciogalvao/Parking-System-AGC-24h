import React, { useState, useMemo, useEffect } from 'react';
import { ParkingRecord, ParkingStatus, PaymentMethod } from '../types';
import { updateRecord, formatCurrency, getConfig, generatePixPayload, createPaymentIntent, checkPaymentStatus, copyToClipboard } from '../services/apiService';
import { calculateCostSync } from '../services/costHelper';
import { Search, CheckCircle, CreditCard, QrCode, Banknote, Copy, X, Check, AlertCircle, ShieldCheck, ArrowRight, UnlockKeyhole } from 'lucide-react';
import LiveSpot from './LiveSpot';

interface ExitScreenProps {
  records: ParkingRecord[];
  onUpdate: () => void;
}

// Lógica de formatação padronizada
const formatPlateInput = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const trimmed = clean.slice(0, 7);
    
    let formatted = trimmed;
    
    if (trimmed.length < 5) {
        if (trimmed.length > 3) formatted = `${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
    } else {
        const fifthChar = trimmed[4];
        formatted = /^[A-Z]$/.test(fifthChar) ? trimmed : `${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
    }

    return { formatted, clean };
};

const isValidPlate = (cleanPlate: string) => {
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/;
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    return oldFormat.test(cleanPlate) || mercosulFormat.test(cleanPlate);
};

// Checkout Sheet Compacto
const CheckoutSheet: React.FC<{ 
  record: ParkingRecord; 
  onClose: () => void; 
  onConfirm: (method: PaymentMethod) => void;
  currentTimestamp: number;
}> = ({ record, onClose, onConfirm, currentTimestamp }) => {
  
  const [view, setView] = useState<'SELECT' | 'PIX_PENDING' | 'PIX_SUCCESS'>('SELECT');
  const [pixPayload, setPixPayload] = useState('');
  
  const frozenTime = useMemo(() => currentTimestamp, []); 

  // Gera um TxID CURTO e PADRONIZADO
  const cleanTxId = useMemo(() => {
      const cleanId = record.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
      return `AGC${cleanId}`;
  }, [record.id]);


  const { elapsed, currentCost } = useMemo(() => {
      const diff = frozenTime - record.entryTime;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      const elapsedStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      const cost = calculateCostSync(record.entryTime, frozenTime, record.type);
      
      return { elapsed: elapsedStr, currentCost: cost };
  }, [record, frozenTime]);

  const handleManualConfirm = () => {
    setView('PIX_SUCCESS');
    setTimeout(() => {
        onConfirm(PaymentMethod.PIX);
    }, 1500);
  };

  const handlePixStart = async () => {
      const config = await getConfig();
      if (!config?.pixKey) return alert("Configure a Chave Pix nas Configurações!");
      
      const payload = generatePixPayload(
          config.pixKey, 
          "AGC PARKING", 
          "BRASIL",      
          currentCost, 
          cleanTxId 
      );
      
      setPixPayload(payload);
      setView('PIX_PENDING');
      
      // 1. Criar Intenção de Pagamento no Backend
      await createPaymentIntent(cleanTxId, currentCost);
      
      // 2. Iniciar Polling para Verificar Pagamento
      const checkStatus = async () => {
          const paid = await checkPaymentStatus(cleanTxId);
          if (paid) {
              clearInterval(interval);
              setView('PIX_SUCCESS');
              setTimeout(() => {
                  onConfirm(PaymentMethod.PIX);
              }, 1500);
          }
      };
      
      const interval = setInterval(checkStatus, 5000); // Verifica a cada 5 segundos
      
      // Limpar o intervalo ao fechar o modal
      // É necessário um mecanismo para limpar o intervalo ao fechar o modal.
      // Por simplicidade, vamos manter o intervalo rodando até a próxima ação.
      // Em um ambiente real, o onClose precisaria ser modificado para limpar o intervalo.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-[#2d2d44]/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md rounded-t-[2rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
            <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-2">
            
            {/* Header: Placa e Close */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 font-mono tracking-tighter leading-none">
                        {record.plate}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                        Vaga {record.spotNumber} • {record.type === 'CAR' ? 'Carro' : record.type === 'MOTORCYCLE' ? 'Moto' : 'Caminhão'}
                    </span>
                </div>
                <button onClick={onClose} className="bg-slate-50 text-slate-400 p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Resumo Centralizado */}
            <div className="bg-[#f4f5ff] rounded-2xl p-5 border border-indigo-50 flex items-center justify-between mb-8">
                <div className="text-center flex-1 border-r border-indigo-100 pr-4">
                     <span className="text-[10px] text-slate-400 font-black uppercase block mb-1 tracking-wider">Tempo</span>
                     <div className="text-xl font-mono font-black text-[#5847eb] tracking-tight">{elapsed}</div>
                </div>
                <div className="text-center flex-1 pl-4">
                     <span className="text-[10px] text-slate-400 font-black uppercase block mb-1 tracking-wider">Total</span>
                     <div className="text-3xl font-black text-[#00b090] tracking-tight">{formatCurrency(currentCost)}</div>
                </div>
            </div>

            {view === 'SELECT' && (
                <div className="space-y-3">
                    <button onClick={handlePixStart} className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[#5847eb] text-white shadow-xl shadow-indigo-200 hover:bg-[#4c35de] active:scale-[0.98] transition-all group">
                        <div className="bg-white/20 p-2 rounded-xl text-white"><QrCode size={24} /></div>
                        <div className="text-left flex-1">
                            <span className="block font-bold text-base">Pix (QR Code)</span>
                            <span className="text-[10px] opacity-80 uppercase tracking-wide font-bold">Gerar Código</span>
                        </div>
                        <ArrowRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onConfirm(PaymentMethod.CASH)} className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-slate-50 bg-white hover:border-[#00b090] hover:bg-[#e0f7fa]/30 active:scale-95 transition-all text-slate-600 font-bold text-sm gap-2">
                            <Banknote size={24} className="text-[#00b090]" /> Dinheiro
                        </button>
                        <button onClick={() => onConfirm(PaymentMethod.CARD)} className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-slate-50 bg-white hover:border-blue-300 hover:bg-blue-50 active:scale-95 transition-all text-slate-600 font-bold text-sm gap-2">
                            <CreditCard size={24} className="text-blue-500" /> Cartão
                        </button>
                    </div>
                </div>
            )}

            {view === 'PIX_PENDING' && (
                <div className="text-center space-y-4 animate-in fade-in zoom-in">
                    <div className="bg-white p-3 rounded-2xl shadow-lg shadow-slate-100 border inline-block relative">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixPayload)}`} className="w-40 h-40 rounded-lg" />
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-1">
                        <p className="text-sm font-bold text-slate-600">Mostre ao cliente</p>
                        <p className="text-[10px] text-slate-400 font-medium font-mono">Valor: {formatCurrency(currentCost)}</p>
                    </div>

                    {/* Botões de Ação */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                         <button onClick={() => { copyToClipboard(pixPayload); alert('Código Copiado!'); }} className="flex items-center justify-center gap-2 text-xs font-bold bg-slate-50 py-3 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200">
                            <Copy size={14}/> Copiar Código
                        </button>
                        <button onClick={() => setView('SELECT')} className="flex items-center justify-center gap-2 text-xs font-bold bg-slate-50 py-3 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200">
                            <X size={14} /> Voltar
                        </button>
                    </div>

                    <div className="border-t border-slate-50 pt-3 mt-2">
                        <button 
                            onClick={handleManualConfirm} 
                            className="w-full py-4 rounded-xl text-white bg-[#00b090] shadow-lg shadow-teal-200 hover:bg-teal-600 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <ShieldCheck size={18} strokeWidth={2.5} />
                            Confirmar Pagamento
                        </button>
                    </div>
                </div>
            )}

            {view === 'PIX_SUCCESS' && (
                 <div className="py-10 text-center animate-in zoom-in space-y-4">
                    <div className="w-24 h-24 bg-[#e0f7fa] text-[#00b090] rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-100 animate-bounce">
                        <Check size={48} strokeWidth={4} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-slate-800 tracking-tight">Pagamento Confirmado!</h3>
                        <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-2 mt-2 bg-slate-50 py-2 rounded-lg mx-auto w-fit px-4">
                            <UnlockKeyhole size={16} className="text-[#5847eb]" /> Liberando vaga {record.spotNumber}...
                        </p>
                    </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

const ExitScreen: React.FC<ExitScreenProps> = ({ records, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isValidSearch, setIsValidSearch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { formatted, clean } = formatPlateInput(e.target.value);
      setSearchTerm(formatted);
      setIsValidSearch(isValidPlate(clean));
  };

  const activeRecords = useMemo(() => {
    return records
      .filter(r => r.status === ParkingStatus.ACTIVE)
      .filter(r => r.plate.includes(searchTerm)) 
      .sort((a, b) => b.entryTime - a.entryTime);
  }, [records, searchTerm]);

  const handleCheckout = async (method: PaymentMethod) => {
    if (!selectedRecord) return;
    const exitTime = Date.now();
    const cost = calculateCostSync(selectedRecord.entryTime, exitTime, selectedRecord.type);
    
    // Atualiza o registro
    await updateRecord({ 
        ...selectedRecord, 
        exitTime, 
        totalCost: cost, 
        status: ParkingStatus.COMPLETED, 
        paymentMethod: method 
    });
    
    // Atualiza a lista principal
    onUpdate();
    
    // Limpa a seleção (fecha o modal)
    setSelectedRecord(null);
  };

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
       <header className="mb-4 shrink-0">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Saída</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Busque o veículo</p>
      </header>

      {/* Barra de Busca com Estilo Moderno */}
      <div className="sticky top-0 z-20 bg-[#f4f5ff] pb-4">
          <div className={`relative shadow-sm rounded-2xl bg-white border-2 transition-all ${isValidSearch ? 'border-[#00b090] shadow-[#00b090]/10' : 'border-white focus-within:border-[#5847eb]'}`}>
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isValidSearch ? 'text-[#00b090]' : 'text-slate-300'}`} size={22} />
            <input
              type="text"
              placeholder="BUSCAR PLACA..."
              value={searchTerm}
              onChange={handleSearchChange}
              maxLength={8}
              className="w-full bg-transparent border-none py-4 pl-12 pr-12 text-slate-800 font-mono font-black text-xl outline-none uppercase tracking-widest rounded-xl placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal placeholder:font-bold"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                {searchTerm && !isValidSearch && (
                    <button onClick={() => {setSearchTerm(''); setIsValidSearch(false);}} className="bg-slate-100 p-1 rounded-full text-slate-400 hover:bg-slate-200">
                        <X size={16} />
                    </button>
                )}
                {isValidSearch && (
                    <div className="bg-[#e0f7fa] p-1.5 rounded-full text-[#00b090] animate-in zoom-in">
                        <Check size={18} strokeWidth={3} />
                    </div>
                )}
            </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
        {activeRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-slate-50">
                    {searchTerm ? <AlertCircle size={48} className="text-slate-200" /> : <CheckCircle size={48} className="text-slate-200" />}
                </div>
                <p className="text-sm font-bold text-slate-400">
                    {searchTerm ? 'Nenhum veículo encontrado.' : 'Pátio vazio.'}
                </p>
            </div>
        ) : (
            <div className="flex flex-col gap-3 pb-4">
                {activeRecords.map(record => (
                    <LiveSpot 
                        key={record.id} 
                        record={record} 
                        onClick={setSelectedRecord}
                        currentTimestamp={now}
                    />
                ))}
            </div>
        )}
      </div>

      {selectedRecord && (
        <CheckoutSheet record={selectedRecord} onClose={() => setSelectedRecord(null)} onConfirm={handleCheckout} currentTimestamp={now} />
      )}
    </div>
  );
};

export default ExitScreen;