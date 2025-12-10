import React, { useState, useRef, useEffect } from 'react';
import { VehicleType, ParkingRecord, ParkingStatus } from '../types';
import { saveRecord, getConfig, getOccupiedSpots, getRecords } from '../services/apiService';
import { analyzeLicensePlate } from '../services/geminiService';
import { Camera, Loader2, Save, Car, Truck, Bike, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

interface EntryScreenProps {
  onSuccess: () => void;
}

const EntryScreen: React.FC<EntryScreenProps> = ({ onSuccess }) => {
  const [plate, setPlate] = useState('');
  const [isPlateValid, setIsPlateValid] = useState(false);
  const [type, setType] = useState<VehicleType>(VehicleType.CAR);
  const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [capacity, setCapacity] = useState(0);
  const [occupiedSpots, setOccupiedSpots] = useState<number[]>([]);

  const oldFormatRegex = /^[A-Z]{3}[0-9]{4}$/;
  const mercosulFormatRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

  useEffect(() => {
    const fetchSpots = async () => {
        const config = getConfig();
        setCapacity(config.totalSpots[type]);
        const spots = await getOccupiedSpots(type);
        setOccupiedSpots(spots);
        setSelectedSpot(null);
    };
    fetchSpots();
  }, [type]);

  const validatePlate = (value: string) => {
    const cleanValue = value.replace(/[^A-Z0-9]/g, '');
    const isValid = oldFormatRegex.test(cleanValue) || mercosulFormatRegex.test(cleanValue);
    setIsPlateValid(isValid);
    return isValid;
  };

  const formatPlate = (value: string) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const trimmed = clean.slice(0, 7);
    if (trimmed.length < 5) {
        if (trimmed.length > 3) return `${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
        return trimmed;
    }
    const fifthChar = trimmed[4];
    return /^[A-Z]$/.test(fifthChar) ? trimmed : `${trimmed.slice(0, 3)}-${trimmed.slice(3)}`;
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Limpa erro ao digitar
    const formatted = formatPlate(e.target.value);
    setPlate(formatted);
    validatePlate(formatted.replace(/[^A-Z0-9]/g, ''));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setLoading(true);
      const result = await analyzeLicensePlate(base64);
      setLoading(false);

      if (result) {
        const formatted = formatPlate(result.plate);
        setPlate(formatted);
        validatePlate(formatted.replace(/[^A-Z0-9]/g, ''));
        if (result.detectedType) {
            if (result.detectedType.includes('MOTO')) setType(VehicleType.MOTORCYCLE);
            else if (result.detectedType.includes('TRUCK')) setType(VehicleType.TRUCK);
            else setType(VehicleType.CAR);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlateValid || selectedSpot === null || isSubmitting) return;
    
    setIsSubmitting(true);
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 1. Verificação de Duplicidade
    const allRecords = await getRecords();
    const existingActive = allRecords.find(r => 
        r.status === ParkingStatus.ACTIVE && 
        r.plate === cleanPlate
    );

    if (existingActive) {
        setError(`Veículo já estacionado na vaga ${existingActive.spotNumber}!`);
        setIsSubmitting(false);
        return;
    }

    // 2. Salva se não houver duplicidade
    const newRecord: ParkingRecord = {
      id: crypto.randomUUID(),
      plate: cleanPlate, 
      type,
      spotNumber: selectedSpot,
      entryTime: Date.now(),
      status: ParkingStatus.ACTIVE,
      entryImage: imagePreview || undefined,
    };

    await saveRecord(newRecord);
    setIsSuccess(true);
    setTimeout(() => onSuccess(), 1000);
  };

  return (
    <div className="pb-24 animate-fade-in relative"> 
      {/* Header Compacto */}
      <header className="mb-4 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Nova Entrada</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Preencha os dados</p>
        </div>
        {/* Toggle de Tipo de Veículo (Compacto) */}
        <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
             {[
                { id: VehicleType.CAR, icon: Car },
                { id: VehicleType.MOTORCYCLE, icon: Bike },
                { id: VehicleType.TRUCK, icon: Truck },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setType(v.id)}
                  className={`p-2 rounded-lg transition-all ${type === v.id ? 'bg-[#5847eb] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <v.icon size={20} />
                </button>
              ))}
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Success Overlay */}
        {isSuccess && (
            <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in duration-300">
                <div className="bg-emerald-100 p-4 rounded-full mb-4 text-[#00b090]">
                    <CheckCircle2 size={56} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Registrado!</h2>
            </div>
        )}

        <div className="p-5 space-y-6">
            
            {/* Seção da Câmera Compacta */}
            <div className="flex gap-4 items-stretch h-24">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 bg-[#f4f5ff] rounded-2xl flex flex-col items-center justify-center shrink-0 border-2 border-dashed border-indigo-200 cursor-pointer active:bg-indigo-50 relative overflow-hidden transition-all hover:border-[#5847eb]"
                >
                    {imagePreview ? (
                         <img src={imagePreview} className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <Camera size={24} className="text-[#5847eb] mb-1" />
                            <span className="text-[10px] text-[#5847eb] font-bold uppercase">Foto</span>
                        </>
                    )}
                    {loading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-[#5847eb]" /></div>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

                {/* Input de Placa */}
                <div className="flex-1 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider absolute top-2 left-4">Placa</label>
                    <input
                        type="text"
                        value={plate}
                        onChange={handlePlateChange}
                        placeholder="ABC-1234"
                        maxLength={8}
                        className={`w-full h-full text-3xl font-mono font-black text-slate-800 bg-slate-50 border-2 rounded-2xl pt-5 pl-4 pr-10 focus:outline-none uppercase transition-all
                            ${plate.length > 0 
                                ? (isPlateValid ? 'border-[#00b090] bg-[#e0f7fa]/30' : 'border-rose-300 bg-rose-50/30')
                                : 'border-slate-100 focus:border-[#5847eb]'
                            }
                        `}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pt-1">
                        {plate.length >= 7 && (
                            isPlateValid ? <CheckCircle2 size={24} className="text-[#00b090]" strokeWidth={3} /> : <AlertCircle size={24} className="text-rose-500" strokeWidth={3} />
                        )}
                    </div>
                </div>
            </div>

            {/* Mensagem de Erro de Duplicidade */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <Ban size={20} className="shrink-0" />
                    <span className="text-sm font-bold">{error}</span>
                </div>
            )}

            {/* Grid de Vagas */}
            <div>
                 <div className="flex justify-between items-center mb-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Selecionar Vaga</label>
                     <span className="text-[10px] font-bold bg-[#f4f5ff] text-[#5847eb] px-2 py-1 rounded-md">
                        {occupiedSpots.length}/{capacity} Ocupadas
                     </span>
                 </div>
                 
                 <div className="bg-[#f8f9ff] rounded-2xl border border-slate-100 p-3 max-h-[35vh] overflow-y-auto custom-scrollbar">
                     <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: capacity }, (_, i) => i + 1).map(i => {
                             const isOccupied = occupiedSpots.includes(i);
                             const isSelected = selectedSpot === i;
                             return (
                                <button
                                    key={i}
                                    disabled={isOccupied}
                                    onClick={() => setSelectedSpot(i)}
                                    className={`
                                        h-10 rounded-xl text-sm font-black transition-all
                                        ${isOccupied 
                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                        : isSelected
                                            ? 'bg-[#5847eb] text-white shadow-lg shadow-indigo-200 scale-105'
                                            : 'bg-white text-slate-500 border border-slate-200 hover:border-[#5847eb]'
                                        }
                                    `}
                                >
                                    {i}
                                </button>
                             )
                        })}
                     </div>
                 </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!isPlateValid || !selectedSpot || isSuccess || isSubmitting || !!error}
                className="w-full bg-[#5847eb] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4c35de] transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-[0.98]"
            >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Registrar Entrada</>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default EntryScreen;