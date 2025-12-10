import { ParkingRecord, VehicleType, Rates, AppConfig, PixKeyType } from '../types';

// --- Configuration ---
const API_BASE_URL = 'http://localhost:3000/api';

// --- Helpers ---

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// --- API Communication ---

export const getConnectionStatus = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/sync`);
        const data = await response.json();
        return !data.error;
    } catch (e) {
        console.error("Erro ao verificar status da API:", e);
        return false;
    }
};

export const initData = async (): Promise<void> => {
    // A inicialização agora é feita pelo backend (initializeDefaults)
    // Esta função apenas sincroniza as configurações iniciais
    await syncSettings();
};

export const syncSettings = async (): Promise<{ config: AppConfig, rates: Rates } | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/sync`);
        const data = await response.json();
        if (data.error) {
            console.error("Erro ao sincronizar configurações:", data.error);
            return null;
        }
        return { config: data.config, rates: data.rates };
    } catch (e) {
        console.error("Erro de rede ao sincronizar configurações:", e);
        return null;
    }
};

// --- Records Operations (API) ---

export const getRecords = async (): Promise<ParkingRecord[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/records`);
        const data = await response.json();
        if (data.error) {
            console.error("Erro ao buscar registros:", data.error);
            return [];
        }
        return data as ParkingRecord[];
    } catch (e) {
        console.error("Erro de rede ao buscar registros:", e);
        return [];
    }
};

export const saveRecord = async (record: ParkingRecord): Promise<ParkingRecord | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const data = await response.json();
        if (response.status !== 201) {
            console.error("Erro ao salvar registro:", data.error);
            return null;
        }
        return data as ParkingRecord;
    } catch (e) {
        console.error("Erro de rede ao salvar registro:", e);
        return null;
    }
};

export const updateRecord = async (updatedRecord: ParkingRecord): Promise<ParkingRecord | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/records/${updatedRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRecord)
        });
        const data = await response.json();
        if (response.status !== 200) {
            console.error("Erro ao atualizar registro:", data.error);
            return null;
        }
        return data as ParkingRecord;
    } catch (e) {
        console.error("Erro de rede ao atualizar registro:", e);
        return null;
    }
};

export const getOccupiedSpots = async (type: VehicleType): Promise<number[]> => {
  const records = await getRecords();
  return records
    .filter(r => r.status === 'ACTIVE' && r.type === type)
    .map(r => r.spotNumber);
};

// --- Rates & Config Operations (API) ---

export const getRates = async (): Promise<Rates> => {
    const settings = await syncSettings();
    return settings?.rates || { [VehicleType.CAR]: 10, [VehicleType.MOTORCYCLE]: 5, [VehicleType.TRUCK]: 20 };
};

export const saveRates = async (rates: Rates): Promise<boolean> => {
    const config = await getConfig();
    if (!config) return false;
    return saveSettings({ config, rates });
};

export const getConfig = async (): Promise<AppConfig> => {
    const settings = await syncSettings();
    return settings?.config || { pixKey: '', pixKeyType: PixKeyType.CPF, totalSpots: { CAR: 50, MOTORCYCLE: 20, TRUCK: 10 } };
};

export const saveConfig = async (config: AppConfig): Promise<boolean> => {
    const rates = await getRates();
    return saveSettings({ config, rates });
};

const saveSettings = async (settings: { config: AppConfig, rates: Rates }): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const data = await response.json();
        return response.status === 200 && data.success;
    } catch (e) {
        console.error("Erro de rede ao salvar configurações:", e);
        return false;
    }
};

export const calculateCost = (entryTime: number, exitTime: number, type: VehicleType, rates: Rates): number => {
  const durationMs = exitTime - entryTime;
  if (durationMs <= 0) return 0;
  const durationHours = durationMs / (1000 * 60 * 60);
  return durationHours * rates[type];
};

// --- PIX Operations (API) ---

export const createPaymentIntent = async (txid: string, amount: number): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/payment/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txid, amount })
        });
        const data = await response.json();
        return response.status === 200 && data.success;
    } catch (e) {
        console.error("Erro de rede ao criar intenção de pagamento:", e);
        return false;
    }
};

export const checkPaymentStatus = async (txId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/payment/status/${txId}`);
        const data = await response.json();
        return response.status === 200 && data.paid;
    } catch (e) {
        console.error("Erro de rede ao verificar status de pagamento:", e);
        return false;
    }
};
