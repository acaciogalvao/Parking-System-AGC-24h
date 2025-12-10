import { VehicleType } from '../types';
import { calculateCost as apiCalculateCost, getRates } from './apiService';

// Wrapper que busca as rates automaticamente
export const calculateCostAuto = async (entryTime: number, exitTime: number, type: VehicleType): Promise<number> => {
  const rates = await getRates();
  return apiCalculateCost(entryTime, exitTime, type, rates);
};

// Versão síncrona com rates default
export const calculateCostSync = (entryTime: number, exitTime: number, type: VehicleType): number => {
  const defaultRates = { CAR: 10, MOTORCYCLE: 5, TRUCK: 20 };
  const durationMs = exitTime - entryTime;
  if (durationMs <= 0) return 0;
  const durationHours = durationMs / (1000 * 60 * 60);
  return durationHours * defaultRates[type];
};
