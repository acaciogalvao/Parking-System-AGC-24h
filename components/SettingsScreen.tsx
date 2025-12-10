import React, { useState, useEffect } from 'react';
import { VehicleType, Rates, AppConfig, PixKeyType } from '../types';
import { getRates, saveRates, getConfig, saveConfig } from '../services/apiService';
import { Save, Car, Truck, Bike, Wallet, CheckCircle, AlertCircle, ChevronDown, Loader2 } from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [rates, setRates] = useState<Rates>(getRates());
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [toast, setToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isValidKey, setIsValidKey] = useState(true);

  // Validate on load
  useEffect(() => {
    validateKey(config.pixKey, config.pixKeyType);
  }, []);

  const handleRateChange = (type: VehicleType, value: string) => {
    // Permite string vazia para facilitar edição
    if (value === '') {
        setRates(prev => ({ ...prev, [type]: '' as any })); // Hack temporário para UI
        return;
    }
    const numValue = parseFloat(value);
    setRates(prev => ({
      ...prev,
      [type]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleCapacityChange = (type: VehicleType, value: string) => {
    // Permite string vazia para facilitar edição
    if (value === '') {
        setConfig(prev => ({
            ...prev,
            totalSpots: {
                ...prev.totalSpots,
                [type]: '' as any
            }
        }));
        return;
    }
    const numValue = parseInt(value, 10);
    setConfig(prev => ({
      ...prev,
      totalSpots: {
        ...prev.totalSpots,
        [type]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  // --- Masking & Validation Logic ---
  const masks = {
    [PixKeyType.CPF]: (val: string) => val.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1'),
    [PixKeyType.CNPJ]: (val: string) => val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1'),
    [PixKeyType.PHONE]: (val: string) => val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1'),
    [PixKeyType.EMAIL]: (val: string) => val.toLowerCase().trim(),
    [PixKeyType.EVP]: (val: string) => val.trim()
  };

  const validateKey = (val: string, type: PixKeyType) => {
    if (!val) {
        setIsValidKey(false);
        return;
    }
    const clean = val.replace(/\D/g, '');
    let valid = false;
    
    switch(type) {
        case PixKeyType.CPF: valid = clean.length === 11; break;
        case PixKeyType.CNPJ: valid = clean.length === 14; break;
        case PixKeyType.PHONE: valid = clean.length >= 10 && clean.length <= 11; break;
        case PixKeyType.EMAIL: valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); break;
        case PixKeyType.EVP: valid = val.length > 20; break;
    }
    setIsValidKey(valid);
  };

  const handlePixKeyChange = (value: string) => {
    const type = config.pixKeyType || PixKeyType.CPF;
    let formatted = value;
    
    if (masks[type] && type !== PixKeyType.EMAIL && type !== PixKeyType.EVP) {
        formatted = masks[type](value);
    } else if (type === PixKeyType.EMAIL) {
        formatted = value.toLowerCase().replace(/\s/g, '');
    }

    validateKey(formatted, type);

    setConfig(prev => ({
      ...prev,
      pixKey: formatted
    }));
  };

  const handleTypeChange = (newType: PixKeyType) => {
    setConfig(prev => ({
        ...prev,
        pixKeyType: newType,
        pixKey: '' 
    }));
    setIsValidKey(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Sanitiza dados antes de salvar (remove strings vazias)
    const cleanRates = { ...rates };
    Object.keys(cleanRates).forEach(k => {
        // @ts-ignore
        if (cleanRates[k] === '') cleanRates[k] = 0;
    });

    const cleanConfig = { ...config };
    Object.keys(cleanConfig.totalSpots).forEach(k => {
        // @ts-ignore
        if (cleanConfig.totalSpots[k] === '') cleanConfig.totalSpots[k] = 0;
    });

    await saveRates(cleanRates);
    await saveConfig(cleanConfig);
    
    // Atualiza estado local com os valores limpos
    setRates(cleanRates);
    setConfig(cleanConfig);

    setIsSaving(false);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const renderRateInput = (type: VehicleType, label: string, icon: React.ReactNode) => (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-4">
      <div className="flex items-center gap-3 mb-5 text-slate-800 font-bold border-b border-slate-50 pb-3">
        {icon}
        <span className="text-lg font-black tracking-tight">{label}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-black mb-2 tracking-wider">Vagas Totais</label>
            <input
                type="number"
                inputMode="numeric"
                // Converte para Number para remover zeros a esquerda, a menos que seja string vazia
                value={config.totalSpots[type] === '' as any ? '' : Number(config.totalSpots[type]).toString()}
                onChange={(e) => handleCapacityChange(type, e.target.value)}
                className="w-full bg-[#f4f5ff] border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div>
              <label className="block text-[10px] text-slate-400 uppercase font-black mb-2 tracking-wider">Preço / Hora</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.50"
                  // Converte para Number para remover zeros a esquerda
                  value={rates[type] === '' as any ? '' : Number(rates[type]).toString()}
                  onChange={(e) => handleRateChange(type, e.target.value)}
                  className="w-full bg-[#f4f5ff] border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
          </div>
      </div>
    </div>
  );

  return (
    <div className="pb-32 animate-fade-in">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ajustes</h1>
        <p className="text-slate-500 font-bold text-sm">Configuração do sistema</p>
      </header>

      {/* Pix Configuration with Hostinger Gradient */}
      <div className="bg-gradient-to-br from-[#5847eb] to-[#7d6df3] p-6 rounded-[2rem] shadow-xl shadow-indigo-200 mb-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00b090]/20 rounded-full blur-2xl -ml-5 -mb-5"></div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                <Wallet size={24} className="text-white" />
            </div>
            <div>
                 <span className="font-black text-xl block leading-none">Recebimento</span>
                 <span className="text-indigo-100 text-sm font-medium">Configuração Pix</span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-5 relative z-10">
            <div>
                <label className="block text-[10px] text-indigo-100 uppercase font-black mb-2 tracking-wider">Tipo de Chave</label>
                <div className="relative">
                    <select 
                        value={config.pixKeyType}
                        onChange={(e) => handleTypeChange(e.target.value as PixKeyType)}
                        className="w-full appearance-none bg-[#4c35de] border border-[#6754ff] rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/30"
                    >
                        <option value={PixKeyType.CPF}>CPF</option>
                        <option value={PixKeyType.CNPJ}>CNPJ</option>
                        <option value={PixKeyType.PHONE}>Celular</option>
                        <option value={PixKeyType.EMAIL}>Email</option>
                        <option value={PixKeyType.EVP}>Chave Aleatória</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 pointer-events-none" />
                </div>
            </div>
            <div>
                 <label className="block text-[10px] text-indigo-100 uppercase font-black mb-2 tracking-wider">Chave Pix</label>
                 <div className="relative">
                    <input
                        type={config.pixKeyType === PixKeyType.EMAIL ? 'email' : 'text'}
                        inputMode={config.pixKeyType === PixKeyType.EMAIL ? 'email' : 'text'}
                        placeholder="Digite a chave..."
                        value={config.pixKey || ''}
                        onChange={(e) => handlePixKeyChange(e.target.value)}
                        className={`w-full bg-white text-slate-900 border-2 rounded-xl py-3.5 pl-4 pr-10 font-mono font-bold outline-none shadow-lg shadow-indigo-900/10 focus:ring-4 focus:ring-indigo-500/30 transition-all ${
                            config.pixKey 
                             ? (isValidKey ? 'border-[#00b090]' : 'border-rose-400')
                             : 'border-transparent'
                        }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {config.pixKey && (
                            isValidKey 
                            ? <CheckCircle size={22} className="text-[#00b090]" strokeWidth={3} />
                            : <AlertCircle size={22} className="text-rose-500" strokeWidth={3} />
                        )}
                    </div>
                 </div>
            </div>
        </div>
      </div>

      <div className="space-y-3">
        {renderRateInput(VehicleType.CAR, 'Carro', <Car size={24} className="text-[#5847eb]" />)}
        {renderRateInput(VehicleType.MOTORCYCLE, 'Moto', <Bike size={24} className="text-orange-500" />)}
        {renderRateInput(VehicleType.TRUCK, 'Caminhão', <Truck size={24} className="text-purple-600" />)}
      </div>

      <div className="fixed bottom-24 left-0 w-full px-6 pointer-events-none flex justify-center z-50">
        {toast && (
          <div className="bg-[#00b090] text-white py-3 px-6 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 zoom-in">
            <CheckCircle size={20} className="text-white" strokeWidth={3} />
            <span className="font-bold">Salvo com sucesso!</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={(!isValidKey && config.pixKey.length > 0) || isSaving}
        className="fixed bottom-24 right-6 bg-[#5847eb] text-white h-16 w-16 rounded-2xl shadow-2xl shadow-indigo-300 hover:bg-[#4c35de] transition-all z-40 disabled:opacity-50 disabled:grayscale active:scale-90 flex items-center justify-center ring-4 ring-white"
      >
        {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={28} />}
      </button>
    </div>
  );
};

export default SettingsScreen;