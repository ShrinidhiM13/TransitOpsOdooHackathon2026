// TransitOps - Shared Types
export type UserRole = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  type: 'VAN' | 'TRUCK' | 'CAR';
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  region: string;
  createdAt?: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  status: 'Draft' | 'Dispatched' | 'En Route to Pickup' | 'Loading Cargo' | 'In Transit' | 'Completed' | 'Cancelled';
  finalOdometer?: number;
  fuelConsumedLiters?: number;
  fuelCost?: number;
  driverName?: string;
  vehicleReg?: string;
  vehicleModel?: string;
  vehicleType?: string;
  vehicleOdometer?: number;
  createdAt?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  type: 'Scheduled' | 'Unscheduled';
  cost: number;
  startDate: string;
  endDate: string | null;
  finalCost: number | null;
  status: 'Open' | 'Closed';
  notes: string | null;
  registrationNumber?: string;
  vehicleModel?: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  tripId: string | null;
  driverId: string | null;
  amount: number;
  category: 'Toll' | 'Fuel' | 'Maintenance' | 'Cleaning' | 'Misc';
  description: string;
  date: string;
  registrationNumber?: string;
  vehicleModel?: string;
  driverName?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  driverId: string;
  tripId: string | null;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  odometer: number;
  date: string;
  registrationNumber?: string;
  vehicleModel?: string;
  driverName?: string;
}

export interface KPIData {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPercent: number;
}

export interface PerformanceVehicle {
  vehicleId: string;
  registrationNumber: string;
  model: string;
  type: string;
  region: string;
  acquisitionCost: number;
  completedTrips: number;
  totalDistance: number;
  totalFuelLiters: number;
  fuelEfficiencyKml: number;
  fleetUtilizationPercent: number;
  totalFuelCost: number;
  totalMaintCost: number;
  totalOtherCost: number;
  totalOperationalCost: number;
  revenue: number;
  roiPercent: number;
}

export interface ChartData {
  tripsPerDay: Array<{ date: string; total: number; completed: number; cancelled: number }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  fuelEfficiency: Array<{ registrationNumber: string; model: string; efficiencyKmL: number; totalDistance: number; totalFuel: number }>;
  driverSafetyScores: Array<{ name: string; safetyScore: number; status: string; licenseExpiryDate: string }>;
  monthlyCosts: Array<{ month: string; total: number; fuelCost: number; maintCost: number }>;
  vehicleStatusDist: Array<{ status: string; count: number }>;
}

export interface SafetyReport {
  stats: {
    totalDrivers: number;
    avgSafetyScore: number;
    activeDrivers: number;
    expiredLicensesCount: number;
    expiringLicensesCount: number;
    suspendedCount: number;
    lowSafetyCount: number;
  };
  expiredLicenses: DriverProfile[];
  expiringLicenses: DriverProfile[];
  suspendedDrivers: DriverProfile[];
  lowSafetyDrivers: DriverProfile[];
}

export interface ExpenseSummary {
  grandTotal: number;
  totalByCategory: Record<string, number>;
}
