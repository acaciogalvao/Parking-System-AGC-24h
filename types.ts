export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK'
}

export enum ParkingStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export enum PaymentMethod {
  PIX = 'PIX',
  CASH = 'CASH',
  CARD = 'CARD'
}

export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  EVP = 'EVP' // Random key
}

export interface ParkingRecord {
  id: string;
  plate: string;
  type: VehicleType;
  spotNumber: number; // Added spot number
  entryTime: number; // Timestamp
  exitTime?: number; // Timestamp
  status: ParkingStatus;
  totalCost?: number;
  paymentMethod?: PaymentMethod; // Added payment method
  notes?: string;
  entryImage?: string; // Base64 placeholder or reference
}

export interface Rates {
  [VehicleType.CAR]: number;
  [VehicleType.MOTORCYCLE]: number;
  [VehicleType.TRUCK]: number;
}

export interface AppConfig {
  pixKey: string; // Chave Pix para recebimento
  pixKeyType: PixKeyType; // Tipo da chave
  totalSpots: {
    [VehicleType.CAR]: number;
    [VehicleType.MOTORCYCLE]: number;
    [VehicleType.TRUCK]: number;
  };
}

export interface DashboardStats {
  activeVehicles: number;
  todayRevenue: number;
  todayEntries: number;
}