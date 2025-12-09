import { ParkingRecord, ParkingStatus, VehicleType, Rates, AppConfig, PixKeyType } from '../types';

// --- Configuration ---
const STORAGE_KEYS = {
    RECORDS: 'agc_parking_db_vlocal',
    CONFIG: 'agc_parking_config_vlocal'
};

// Cache em memória para acesso rápido
let localRates: Rates = {
  [VehicleType.CAR]: 10.00,
  [VehicleType.MOTORCYCLE]: 5.00,
  [VehicleType.TRUCK]: 20.00,
};

let localConfig: AppConfig = {
  pixKey: '', 
  pixKeyType: PixKeyType.CPF,
  totalSpots: {
    [VehicleType.CAR]: 50,
    [VehicleType.MOTORCYCLE]: 20,
    [VehicleType.TRUCK]: 10
  }
};

// --- Helpers ---

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// No modo local, sempre retornamos true, pois não dependemos de servidor
export const getConnectionStatus = () => true;

// --- Initialization ---

export const initData = async (): Promise<void> => {
    // Carrega dados do LocalStorage na inicialização
    const lsConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (lsConfig) {
        try {
            const parsed = JSON.parse(lsConfig);
            if (parsed.config) localConfig = parsed.config;
            if (parsed.rates) localRates = parsed.rates;
        } catch(err) {
            console.error("Erro ao carregar configurações locais", err);
        }
    }
};

// --- Pix Logic (Standard EMV - Pure Math) ---

function normalizeText(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function crc16(str: string): string {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export const generatePixPayload = (key: string, keyType: PixKeyType, name: string, city: string, amount: number, txId: string): string => {
    let cleanKey = key ? key.trim() : '';
    if (!cleanKey) return '';

    switch (keyType) {
        case PixKeyType.CPF:
        case PixKeyType.CNPJ:
            cleanKey = cleanKey.replace(/\D/g, '');
            break;
        case PixKeyType.PHONE:
            cleanKey = cleanKey.replace(/\D/g, '');
            if (!cleanKey.startsWith('55')) cleanKey = '55' + cleanKey;
            cleanKey = '+' + cleanKey;
            break;
        case PixKeyType.EMAIL:
            cleanKey = cleanKey.toLowerCase();
            break;
    }

    const f = (id: string, value: string) => {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
    };

    const safeName = normalizeText(name || "MERCHANT").substring(0, 25).toUpperCase();
    const safeCity = normalizeText(city || "BRASIL").substring(0, 15).toUpperCase();
    
    let safeTxId = txId.replace(/[^a-zA-Z0-9]/g, '');
    if (!safeTxId) safeTxId = '***';
    if (safeTxId.length > 25) safeTxId = safeTxId.substring(0, 25);
    
    const amountStr = amount.toFixed(2);

    let payload = 
        f('00', '01') +                             
        f('26',                                     
            f('00', 'BR.GOV.BCB.PIX') + 
            f('01', cleanKey)
        ) +
        f('52', '0000') +                           
        f('53', '986') +                            
        f('54', amountStr) +                        
        f('58', 'BR') +                             
        f('59', safeName) +                         
        f('60', safeCity) +                         
        f('62',                                     
            f('05', safeTxId)                       
        ) + 
        '6304';                                     

    payload += crc16(payload);
    return payload;
};

// --- Local Operations (No API) ---

export const getRecords = async (): Promise<ParkingRecord[]> => {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
};

export const saveRecord = async (record: ParkingRecord): Promise<void> => {
    const current = await getRecords(); 
    if (!current.find(r => r.id === record.id)) {
        current.push(record);
        localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(current));
    }
};

export const updateRecord = async (updatedRecord: ParkingRecord): Promise<void> => {
    const current = await getRecords();
    const index = current.findIndex(r => r.id === updatedRecord.id);
    if (index !== -1) {
        current[index] = updatedRecord;
        localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(current));
    }
};

export const getOccupiedSpots = async (type: VehicleType): Promise<number[]> => {
  const records = await getRecords();
  return records
    .filter(r => r.status === ParkingStatus.ACTIVE && r.type === type)
    .map(r => r.spotNumber);
};

// --- Rates & Config ---

export const getRates = (): Rates => localRates;

export const saveRates = async (rates: Rates): Promise<void> => {
  localRates = rates;
  await syncSettings();
};

export const getConfig = (): AppConfig => localConfig;

export const saveConfig = async (config: AppConfig): Promise<void> => {
  localConfig = config;
  await syncSettings();
};

const syncSettings = async () => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ config: localConfig, rates: localRates }));
};

export const calculateCost = (entryTime: number, exitTime: number, type: VehicleType): number => {
  const rates = getRates();
  const durationMs = exitTime - entryTime;
  if (durationMs <= 0) return 0;
  const durationHours = durationMs / (1000 * 60 * 60);
  return durationHours * rates[type];
};