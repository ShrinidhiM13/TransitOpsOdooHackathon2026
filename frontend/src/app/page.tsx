'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Truck,
  User,
  Calendar,
  Award,
  AlertTriangle,
  LogOut,
  Moon,
  Sun,
  Activity,
  Wifi,
  WifiOff,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  ShieldAlert,
  Loader2,
  Lock,
  Mail,
  Navigation,
  Plus,
  Wrench,
  Download,
  Users,
  Eye,
  Settings
} from 'lucide-react';

const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '')
  : 'http://localhost:3000';

const STORAGE_KEYS = {
  TOKEN: 'transitops_driver_token',
  USER: 'transitops_driver_user',
  DRIVER: 'transitops_driver_profile',
  ACTIVE_TRIP: 'transitops_active_trip',
  PENDING_EXPENSES: 'transitops_pending_expenses',
  PENDING_STATUS_UPDATES: 'transitops_pending_status_updates',
  THEME: 'transitops_theme'
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DriverProfile {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: string;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  region: string;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  status: 'Draft' | 'Dispatched' | 'En Route to Pickup' | 'Loading Cargo' | 'In Transit' | 'Completed' | 'Cancelled';
  driverName?: string;
  vehicleReg?: string;
}

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  type: string;
  cost: number;
  startDate: string;
  endDate: string | null;
  finalCost: number | null;
  status: 'Open' | 'Closed';
  notes: string | null;
}

export default function HomePortal() {
  // App States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null); // Driver details if DRIVER role
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null); // Active trip if DRIVER role
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);

  // Dev Quick-Switcher Simulator Role
  const [activeTab, setActiveTab] = useState('dashboard'); // For Multi-Tabs in Manager View
  const [simulatedRole, setSimulatedRole] = useState<string | null>(null);

  // Manager/Analyst Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [kpiData, setKpiData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  // Form inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Vehicle Reg Form
  const [vehReg, setVehReg] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehType, setVehType] = useState('VAN');
  const [vehCapacity, setVehCapacity] = useState('');
  const [vehOdometer, setVehOdometer] = useState('');
  const [vehCost, setVehCost] = useState('');
  const [vehRegion, setVehRegion] = useState('West India');
  const [vehSuccess, setVehSuccess] = useState('');

  // Driver Reg Form
  const [drvName, setDrvName] = useState('');
  const [drvLicenseNum, setDrvLicenseNum] = useState('');
  const [drvLicenseCat, setDrvLicenseCat] = useState('MCWG/LMV');
  const [drvLicenseExp, setDrvLicenseExp] = useState('');
  const [drvContact, setDrvContact] = useState('+91');
  const [drvEmail, setDrvEmail] = useState('');
  const [drvPassword, setDrvPassword] = useState('');
  const [drvSuccess, setDrvSuccess] = useState('');

  // Dispatch Planner Form
  const [tripSource, setTripSource] = useState('');
  const [tripDest, setTripDest] = useState('');
  const [tripVehId, setTripVehId] = useState('');
  const [tripDrvId, setTripDrvId] = useState('');
  const [tripWeight, setTripWeight] = useState('');
  const [tripDistance, setTripDistance] = useState('');
  const [tripSuccess, setTripSuccess] = useState('');

  // Maintenance Log Form
  const [maintVehId, setMaintVehId] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintType, setMaintType] = useState('Scheduled');
  const [maintCost, setMaintCost] = useState('');
  const [maintSuccess, setMaintSuccess] = useState('');

  // Close Maintenance Form
  const [closeMaintId, setCloseMaintId] = useState('');
  const [closeMaintCost, setCloseMaintCost] = useState('');
  const [closeMaintNotes, setCloseMaintNotes] = useState('');
  const [closeMaintSuccess, setCloseMaintSuccess] = useState('');

  // Driver Expense Log Form (Driver Role)
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Toll' | 'Fuel' | 'Cleaning' | 'Misc'>('Toll');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseSuccessMsg, setExpenseSuccessMsg] = useState('');
  const [expenseErrorMsg, setExpenseErrorMsg] = useState('');

  // Driver Trip Completion Form
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [completionView, setCompletionView] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play alert sirens (for Dispatched trip overlay)
  const playAlertSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.linearRampToValueAtTime(880, now + 0.3); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, now); // D4
      osc2.frequency.linearRampToValueAtTime(440, now + 0.3); // A4

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio play failed: ', e);
    }
  }, []);

  // Sync Offline Storage Data
  const syncOfflineData = useCallback(async (authToken: string) => {
    if (navigator.onLine === false) return;
    setSyncing(true);
    try {
      // 1. Sync Pending Expenses
      const pendingExpensesStr = localStorage.getItem(STORAGE_KEYS.PENDING_EXPENSES);
      if (pendingExpensesStr) {
        const pendingExpenses = JSON.parse(pendingExpensesStr);
        const remainingExpenses = [];
        
        for (const exp of pendingExpenses) {
          try {
            const res = await fetch(`${API_BASE}/api/expenses`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                vehicleId: exp.vehicleId,
                tripId: exp.tripId,
                amount: exp.amount,
                category: exp.category,
                description: exp.description,
                date: exp.date
              })
            });
            const data = await res.json();
            if (!data.success) remainingExpenses.push(exp);
          } catch (e) {
            remainingExpenses.push(exp);
          }
        }
        if (remainingExpenses.length > 0) {
          localStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(remainingExpenses));
        } else {
          localStorage.removeItem(STORAGE_KEYS.PENDING_EXPENSES);
        }
      }

      // 2. Sync Pending Status Transitions
      const pendingStatusStr = localStorage.getItem(STORAGE_KEYS.PENDING_STATUS_UPDATES);
      if (pendingStatusStr) {
        const pendingStatus = JSON.parse(pendingStatusStr);
        try {
          const res = await fetch(`${API_BASE}/api/trips/${pendingStatus.tripId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status: pendingStatus.status })
          });
          const data = await res.json();
          if (data.success) {
            localStorage.removeItem(STORAGE_KEYS.PENDING_STATUS_UPDATES);
          }
        } catch (e) {
          console.error("Failed to sync status update:", e);
        }
      }
    } catch (err) {
      console.error('Sync failed: ', err);
    } finally {
      setSyncing(false);
    }
  }, []);

  // Fetch driver-specific active trip
  const fetchActiveTrip = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/trips/active`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveTrip(data.trip);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP, JSON.stringify(data.trip));
      }
    } catch (err) {
      const cached = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP);
      if (cached) {
        setActiveTrip(JSON.parse(cached));
      }
    }
  }, []);

  // Manager and Analysts: Fetch dashboards data
  const fetchManagerData = useCallback(async (authToken: string) => {
    try {
      // Fetch vehicles
      const resVeh = await fetch(`${API_BASE}/api/vehicles`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const dataVeh = await resVeh.json();
      if (dataVeh.success) setVehicles(dataVeh.vehicles);

      // Fetch drivers
      const resDrv = await fetch(`${API_BASE}/api/drivers`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const dataDrv = await resDrv.json();
      if (dataDrv.success) setDrivers(dataDrv.drivers);

      // Fetch trips
      const resTrips = await fetch(`${API_BASE}/api/trips`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const dataTrips = await resTrips.json();
      if (dataTrips.success) setTrips(dataTrips.trips);

      // Fetch KPIs
      const resKPI = await fetch(`${API_BASE}/api/analytics/kpis`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const dataKPI = await resKPI.json();
      if (dataKPI.success) setKpiData(dataKPI.data);

      // Fetch performance reports
      const resPerf = await fetch(`${API_BASE}/api/analytics/performance`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const dataPerf = await resPerf.json();
      if (dataPerf.success) setPerformanceData(dataPerf.report.vehicles);

    } catch (e) {
      console.warn("Error fetching manager/analyst reports:", e);
    }
  }, []);

  // Fetch profiles
  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setSimulatedRole(data.user.role);
        setDriver(data.driver);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEYS.DRIVER, JSON.stringify(data.driver));
        
        if (data.user.role === 'DRIVER') {
          fetchActiveTrip(authToken);
        } else {
          fetchManagerData(authToken);
        }
      }
    } catch (err) {
      const cachedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const cachedDriver = localStorage.getItem(STORAGE_KEYS.DRIVER);
      if (cachedUser) {
        const u = JSON.parse(cachedUser);
        setUser(u);
        setSimulatedRole(u.role);
      }
      if (cachedDriver) setDriver(JSON.parse(cachedDriver));
    }
  }, [fetchActiveTrip, fetchManagerData]);

  // Initializer
  useEffect(() => {
    const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const localTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | null;
    
    if (localTheme) {
      setTheme(localTheme);
      document.documentElement.setAttribute('data-theme', localTheme);
    }

    const handleOnline = () => {
      setIsOffline(false);
      if (localToken) {
        syncOfflineData(localToken);
        fetchProfile(localToken);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    if (localToken) {
      setToken(localToken);
      fetchProfile(localToken).then(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchProfile, syncOfflineData]);

  // Polling for Driver state
  useEffect(() => {
    if (!token || isOffline || simulatedRole !== 'DRIVER') return;
    const interval = setInterval(() => {
      fetchActiveTrip(token);
    }, 8000);
    return () => clearInterval(interval);
  }, [token, isOffline, simulatedRole, fetchActiveTrip]);

  // Zomato overlay sirens
  useEffect(() => {
    if (simulatedRole === 'DRIVER' && activeTrip && activeTrip.status === 'Dispatched' && !isOverlayDismissed) {
      playAlertSound();
      const soundInterval = setInterval(playAlertSound, 3000);
      return () => clearInterval(soundInterval);
    }
  }, [activeTrip, simulatedRole, isOverlayDismissed, playAlertSound]);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Credentials cannot be blank.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        await fetchProfile(data.token);
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(data.message || 'Verification failed. Double check your email.');
      }
    } catch (err) {
      setLoginError('Connectivity issue. Failed to connect to server.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.DRIVER);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
    setToken(null);
    setUser(null);
    setDriver(null);
    setActiveTrip(null);
    setIsOverlayDismissed(false);
    setCompletionView(false);
    setSimulatedRole(null);
  };

  // Quick fill developer log in details
  const fillLoginCreds = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('SecurePassword123');
  };

  // Fleet Manager: Register Vehicle
  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehSuccess('');
    const cap = parseFloat(vehCapacity);
    const odo = parseFloat(vehOdometer);
    const cost = parseFloat(vehCost);

    if (!vehReg || !vehModel || isNaN(cap) || isNaN(odo) || isNaN(cost)) {
      setVehSuccess('Error: Missing or invalid registration parameters.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          registrationNumber: vehReg,
          model: vehModel,
          type: vehType,
          maxLoadCapacity: cap,
          odometer: odo,
          acquisitionCost: cost,
          region: vehRegion
        })
      });
      const data = await res.json();
      if (data.success) {
        setVehSuccess('Vehicle successfully added to fleet registry.');
        setVehReg('');
        setVehModel('');
        setVehCapacity('');
        setVehOdometer('');
        setVehCost('');
        fetchManagerData(token!);
      } else {
        setVehSuccess(`Error: ${data.message}`);
      }
    } catch (err) {
      setVehSuccess('Failed to submit: server connection error.');
    }
  };

  // Fleet Manager: Register Driver
  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrvSuccess('');

    if (!drvName || !drvLicenseNum || !drvLicenseExp || !drvContact || !drvEmail || !drvPassword) {
      setDrvSuccess('Error: Missing driver form inputs.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: drvName,
          licenseNumber: drvLicenseNum,
          licenseCategory: drvLicenseCat,
          licenseExpiryDate: drvLicenseExp,
          contactNumber: drvContact,
          email: drvEmail,
          password: drvPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setDrvSuccess(`Driver registration successful! Seeded login account created: ${data.driver.name}`);
        setDrvName('');
        setDrvLicenseNum('');
        setDrvLicenseExp('');
        setDrvContact('+91');
        setDrvEmail('');
        setDrvPassword('');
        fetchManagerData(token!);
      } else {
        setDrvSuccess(`Error: ${data.message}`);
      }
    } catch (err) {
      setDrvSuccess('Failed to register: server connection error.');
    }
  };

  // Fleet Manager: Dispatch Planner
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setTripSuccess('');
    const weight = parseFloat(tripWeight);
    const dist = parseFloat(tripDistance);

    if (!tripSource || !tripDest || !tripVehId || !tripDrvId || isNaN(weight) || isNaN(dist)) {
      setTripSuccess('Error: Fields missing or invalid.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          source: tripSource,
          destination: tripDest,
          vehicleId: tripVehId,
          driverId: tripDrvId,
          cargoWeight: weight,
          plannedDistance: dist
        })
      });
      const data = await res.json();
      if (data.success) {
        setTripSuccess(`Draft order ${data.trip.id} created successfully.`);
        setTripSource('');
        setTripDest('');
        setTripVehId('');
        setTripDrvId('');
        setTripWeight('');
        setTripDistance('');
        fetchManagerData(token!);
      } else {
        setTripSuccess(`Error: ${data.message}`);
      }
    } catch (err) {
      setTripSuccess('Failed to dispatch: server connection error.');
    }
  };

  // Fleet Manager: Dispatch Trip
  const dispatchTrip = async (tripId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/dispatch`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchManagerData(token!);
      } else {
        alert(`Dispatch failed: ${data.message}`);
      }
    } catch (e) {
      alert("Failed to contact server.");
    }
  };

  // Fleet Manager: Cancel Trip
  const cancelTrip = async (tripId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/trips/${tripId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchManagerData(token!);
      }
    } catch (e) {
      alert("Failed to cancel trip.");
    }
  };

  // Fleet Manager: Send Vehicle to Shop
  const handleOpenMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintSuccess('');
    const costVal = parseFloat(maintCost) || 0;

    if (!maintVehId || !maintDesc) {
      setMaintSuccess('Error: Vehicle ID and description required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: maintVehId,
          description: maintDesc,
          type: maintType,
          cost: costVal,
          startDate: new Date().toISOString().split('T')[0]
        })
      });
      const data = await res.json();
      if (data.success) {
        setMaintSuccess('Maintenance log registered. Vehicle status updated to In Shop.');
        setMaintVehId('');
        setMaintDesc('');
        setMaintCost('');
        fetchManagerData(token!);
      } else {
        setMaintSuccess(`Error: ${data.message}`);
      }
    } catch (e) {
      setMaintSuccess('Failed to schedule: server connection error.');
    }
  };

  // Fleet Manager: Close Maintenance
  const handleCloseMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setCloseMaintSuccess('');
    const costVal = parseFloat(closeMaintCost);
    if (!closeMaintId || isNaN(costVal)) {
      setCloseMaintSuccess('Error: Maintenance ID and final cost are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/maintenance/${closeMaintId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          finalCost: costVal,
          notes: closeMaintNotes || 'Repairs completed.',
          endDate: new Date().toISOString().split('T')[0]
        })
      });
      const data = await res.json();
      if (data.success) {
        setCloseMaintSuccess('Vehicle maintenance resolved. Odometer and status restored.');
        setCloseMaintId('');
        setCloseMaintCost('');
        setCloseMaintNotes('');
        fetchManagerData(token!);
      } else {
        setCloseMaintSuccess(`Error: ${data.message}`);
      }
    } catch (e) {
      setCloseMaintSuccess('Failed to close log: server connection error.');
    }
  };

  // Safety Officer: Toggle Driver Suspension status
  const toggleSuspension = async (drv: DriverProfile) => {
    const nextStatus = drv.status === 'Suspended' ? 'Available' : 'Suspended';
    try {
      const res = await fetch(`${API_BASE}/api/drivers/${drv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchManagerData(token!);
      } else {
        alert(`Failed: ${data.message}`);
      }
    } catch (err) {
      alert("Failed to toggle suspension: network error.");
    }
  };

  // Driver Status progression helper (Driver Role)
  const executeStatusTransition = async (nextStatus: 'En Route to Pickup' | 'Loading Cargo' | 'In Transit' | 'Completed') => {
    if (!activeTrip || !token) return;
    if (nextStatus === 'Completed') {
      setCompletionView(true);
      return;
    }

    const optimisticTrip = { ...activeTrip, status: nextStatus };
    setActiveTrip(optimisticTrip);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP, JSON.stringify(optimisticTrip));

    if (isOffline) {
      localStorage.setItem(
        STORAGE_KEYS.PENDING_STATUS_UPDATES,
        JSON.stringify({ tripId: activeTrip.id, status: nextStatus })
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/trips/${activeTrip.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!data.success) {
        fetchActiveTrip(token);
      }
    } catch (e) {
      localStorage.setItem(
        STORAGE_KEYS.PENDING_STATUS_UPDATES,
        JSON.stringify({ tripId: activeTrip.id, status: nextStatus })
      );
    }
  };

  // Driver Log Expense
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseSuccessMsg('');
    setExpenseErrorMsg('');

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0 || !expenseDescription) {
      setExpenseErrorMsg('Ensure amount is positive and description is populated.');
      return;
    }

    const expensePayload = {
      id: 'local_exp_' + Date.now(),
      amount: amt,
      category: expenseCategory,
      description: expenseDescription,
      date: new Date().toISOString(),
      vehicleId: activeTrip ? activeTrip.vehicleId : 'veh_unlinked',
      tripId: activeTrip ? activeTrip.id : 'trip_unlinked'
    };

    if (isOffline) {
      const pendingExpensesStr = localStorage.getItem(STORAGE_KEYS.PENDING_EXPENSES);
      const pending = pendingExpensesStr ? JSON.parse(pendingExpensesStr) : [];
      pending.push(expensePayload);
      localStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(pending));
      setExpenseSuccessMsg('Expense saved locally. Will upload when network is back.');
      setExpenseAmount('');
      setExpenseDescription('');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicleId: expensePayload.vehicleId,
          tripId: expensePayload.tripId,
          amount: expensePayload.amount,
          category: expensePayload.category,
          description: expensePayload.description,
          date: expensePayload.date
        })
      });
      const data = await res.json();
      if (data.success) {
        setExpenseSuccessMsg('Expense logged and synchronized to DB.');
        setExpenseAmount('');
        setExpenseDescription('');
      } else {
        setExpenseErrorMsg(data.message || 'Failed to submit expense.');
      }
    } catch (err) {
      const pendingExpensesStr = localStorage.getItem(STORAGE_KEYS.PENDING_EXPENSES);
      const pending = pendingExpensesStr ? JSON.parse(pendingExpensesStr) : [];
      pending.push(expensePayload);
      localStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(pending));
      setExpenseSuccessMsg('Expense logged locally. Will sync when online.');
      setExpenseAmount('');
      setExpenseDescription('');
    }
  };

  // Driver Trip Completion Submit
  const handleTripCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompletionError('');

    if (!activeTrip || !token) return;

    const finalOdo = parseFloat(finalOdometer);
    const fuelLiters = parseFloat(fuelConsumed);
    const cost = parseFloat(fuelCost);

    if (isNaN(finalOdo) || isNaN(fuelLiters) || isNaN(cost) || finalOdo <= 0 || fuelLiters <= 0 || cost <= 0) {
      setCompletionError('Odometer, volume, and cost values must be positive.');
      return;
    }

    if (isOffline) {
      setCompletionError('Trip completion requires database writes. Reconnect to sync.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/trips/${activeTrip.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          finalOdometer: finalOdo,
          fuelConsumedLiters: fuelLiters,
          fuelCost: cost
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveTrip(null);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
        setCompletionView(false);
        setFinalOdometer('');
        setFuelConsumed('');
        setFuelCost('');
        fetchProfile(token); // Reload status back to Available
      } else {
        setCompletionError(data.message || 'Failed to submit trip details.');
      }
    } catch (err) {
      setCompletionError('Connection timed out. Failed to complete trip.');
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <Loader2 size={40} className="alert-pulse" style={{ color: 'var(--primary)', animationDuration: '1s' }} />
      </div>
    );
  }

  // 1. Authentication Interface (Login Page)
  if (!token) {
    return (
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <Truck size={32} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>TransitOps</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Operations Control Room Login</p>
          </div>

          {loginError && (
            <div className="compliance-banner" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <div>{loginError}</div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="user@transitops.in"
                className="input-field"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={loginLoading}>
              {loginLoading ? <Loader2 size={18} className="alert-pulse" /> : 'Sign In'}
            </button>
          </form>

          {/* Dev Quick Fills */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>
              Developer Quick Login
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button onClick={() => fillLoginCreds('manager@transitops.in')} className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>
                Fleet Manager
              </button>
              <button onClick={() => fillLoginCreds('rahul@transitops.in')} className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>
                Driver (Rahul)
              </button>
              <button onClick={() => fillLoginCreds('safety@transitops.in')} className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>
                Safety Officer
              </button>
              <button onClick={() => fillLoginCreds('finance@transitops.in')} className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }}>
                Financial Analyst
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Session Layout
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header bar */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck size={24} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>TransitOps Control Room</span>
          <span className="badge badge-info" style={{ marginLeft: '0.25rem' }}>{simulatedRole}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Quick Switcher for development/evaluation */}
          {user && user.role !== 'DRIVER' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--background)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Simulate:</span>
              <select
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                value={simulatedRole || ''}
                onChange={(e) => {
                  setSimulatedRole(e.target.value);
                  fetchManagerData(token!);
                }}
              >
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst</option>
              </select>
            </div>
          )}

          {isOffline ? (
            <div style={{ color: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
              <WifiOff size={16} />
              <span>Offline</span>
            </div>
          ) : (
            <div style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
              <Wifi size={16} />
              <span>Online</span>
            </div>
          )}
          
          <button onClick={handleThemeToggle} className="btn-secondary" style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 3. Role-Based Rendering */}
      <main className="container" style={{ flex: 1, maxWidth: simulatedRole === 'DRIVER' ? '600px' : '1024px', margin: '0 auto', padding: '1.5rem' }}>
        
        {/* DRIVER PORTAL */}
        {simulatedRole === 'DRIVER' && (
          <div>
            {/* License Compliance warning check */}
            {driver && Math.ceil((new Date(driver.licenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) < 30 && (
              <div className="compliance-banner">
                <AlertTriangle size={24} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700 }}>Driving License Expiring Soon</div>
                  License {driver.licenseNumber} expires on {new Date(driver.licenseExpiryDate).toLocaleDateString('en-IN')}. Please submit renewal to Fleet Manager control room.
                </div>
              </div>
            )}

            {/* Offline notification banner */}
            {syncing && (
              <div className="sync-indicator" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                <Loader2 className="alert-pulse" size={16} />
                <span>Syncing pending offline database transactions...</span>
              </div>
            )}

            {/* Zomato Overlay Pop-Up */}
            {activeTrip && activeTrip.status === 'Dispatched' && !isOverlayDismissed && (
              <div className="fullscreen-overlay">
                <div className="overlay-card">
                  <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }} className="alert-pulse">
                    <Navigation size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>New Dispatch Assigned</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Check details and acknowledge route dispatch immediately.</p>
                  
                  <div style={{ backgroundColor: 'var(--background)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>SOURCE TO TARGET</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0' }}>{activeTrip.source} ➔ {activeTrip.destination}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>Cargo: <strong>{activeTrip.cargoWeight} kg</strong></div>
                      <div>Distance: <strong>{activeTrip.plannedDistance} km</strong></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => {
                      executeStatusTransition('En Route to Pickup');
                      setIsOverlayDismissed(true);
                    }} className="btn btn-primary" style={{ flex: 2 }}>
                      Accept & Start
                    </button>
                    <button onClick={() => setIsOverlayDismissed(true)} className="btn btn-secondary" style={{ flex: 1 }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Form or Main Driver Card */}
            {completionView && activeTrip ? (
              <div className="card">
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={20} /> Complete Active Delivery
                </h2>
                
                {completionError && (
                  <div className="compliance-banner" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div>{completionError}</div>
                  </div>
                )}

                <form onSubmit={handleTripCompletionSubmit}>
                  <div className="form-group">
                    <label className="form-label">Final Odometer (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field mono"
                      value={finalOdometer}
                      onChange={(e) => setFinalOdometer(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fuel Added (Liters)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-field mono"
                      value={fuelConsumed}
                      onChange={(e) => setFuelConsumed(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fuel Cost (₹ INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field mono"
                      value={fuelCost}
                      onChange={(e) => setFuelCost(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Details</button>
                    <button type="button" onClick={() => setCompletionView(false)} className="btn btn-secondary">Go Back</button>
                  </div>
                </form>
              </div>
            ) : activeTrip ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>Assigned Trip</h2>
                  <span className="badge badge-info">{activeTrip.status}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOURCE ORIGIN</span>
                    <div style={{ fontWeight: 700 }}>{activeTrip.source}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DESTINATION TARGET</span>
                    <div style={{ fontWeight: 700 }}>{activeTrip.destination}</div>
                  </div>
                </div>

                <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
                  <div className="stat-box">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CARGO WEIGHT</div>
                    <div className="stat-val mono" style={{ fontSize: '1.1rem' }}>{activeTrip.cargoWeight} kg</div>
                  </div>
                  <div className="stat-box">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PLANNED ROUTE</div>
                    <div className="stat-val mono" style={{ fontSize: '1.1rem' }}>{activeTrip.plannedDistance} km</div>
                  </div>
                </div>

                {/* Progress bar line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0 1.25rem 0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--border)', zIndex: 1 }}></div>
                  {[
                    { label: 'Start', status: 'Dispatched' },
                    { label: 'Pickup', status: 'En Route to Pickup' },
                    { label: 'Loading', status: 'Loading Cargo' },
                    { label: 'Transit', status: 'In Transit' }
                  ].map((step, idx) => {
                    const stepOrder = ['Dispatched', 'En Route to Pickup', 'Loading Cargo', 'In Transit'];
                    const currentIdx = stepOrder.indexOf(activeTrip.status);
                    const isCompleted = stepOrder.indexOf(step.status) <= currentIdx;
                    const isActive = step.status === activeTrip.status;

                    return (
                      <div key={step.status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '25%' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--surface)',
                          border: '2px solid ' + (isCompleted ? 'var(--success)' : 'var(--border)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isCompleted ? '#fff' : 'var(--text-muted)',
                          fontSize: '10px',
                          fontWeight: 700
                        }}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Next transition actions buttons */}
                <div style={{ marginTop: '1.25rem' }}>
                  {activeTrip.status === 'Dispatched' && (
                    <button onClick={() => executeStatusTransition('En Route to Pickup')} className="btn btn-primary alert-pulse">
                      Start Trip
                    </button>
                  )}
                  {activeTrip.status === 'En Route to Pickup' && (
                    <button onClick={() => executeStatusTransition('Loading Cargo')} className="btn btn-primary">
                      Arrived at Pickup
                    </button>
                  )}
                  {activeTrip.status === 'Loading Cargo' && (
                    <button onClick={() => executeStatusTransition('In Transit')} className="btn btn-primary">
                      Out for Delivery
                    </button>
                  )}
                  {activeTrip.status === 'In Transit' && (
                    <button onClick={() => executeStatusTransition('Completed')} className="btn btn-danger">
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }} className="alert-pulse">
                  <Truck size={32} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>Ready for Dispatch</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Your vehicle is marked as Available. Dispatches will update here instantly.</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span className="status-dot status-dot-active alert-pulse"></span>
                  <span>Active GPS Tracking</span>
                </div>
              </div>
            )}

            {/* Profile summary card */}
            {driver && (
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} /> Driver Info
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>License Plate</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{driver.licenseNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Safety Rating</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>★ {driver.safetyScore}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Duty Status</span>
                    <span>{driver.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Road Expense logs */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={16} /> Record Road Expense
              </h3>
              {expenseSuccessMsg && <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{expenseSuccessMsg}</div>}
              {expenseErrorMsg && <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{expenseErrorMsg}</div>}
              <form onSubmit={handleLogExpense}>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" step="0.01" className="input-field mono" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input-field" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value as any)}>
                    <option value="Toll">Toll Tax</option>
                    <option value="Fuel">Fuel stop</option>
                    <option value="Cleaning">Washing</option>
                    <option value="Misc">Incident/Misc</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location/Description</label>
                  <input type="text" placeholder="e.g. Expressway Toll" className="input-field" value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-secondary">Submit Expense</button>
              </form>
            </div>
          </div>
        )}

        {/* FLEET MANAGER DASHBOARD */}
        {simulatedRole === 'FLEET_MANAGER' && (
          <div>
            {/* KPIs statistics overview */}
            {kpiData && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE VEHICLES</div>
                  <div className="stat-val">{kpiData.activeVehicles}</div>
                </div>
                <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>AVAILABLE VEHICLES</div>
                  <div className="stat-val">{kpiData.availableVehicles}</div>
                </div>
                <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>IN MAINTENANCE</div>
                  <div className="stat-val">{kpiData.vehiclesInMaintenance}</div>
                </div>
                <div className="card" style={{ marginBottom: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>UTILIZATION RATE</div>
                  <div className="stat-val" style={{ color: 'var(--success)' }}>{kpiData.fleetUtilizationPercent}%</div>
                </div>
              </div>
            )}

            {/* Tab switchers */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <button onClick={() => setActiveTab('dispatches')} className={`btn ${activeTab === 'dispatches' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                Trips & Dispatches
              </button>
              <button onClick={() => setActiveTab('registry')} className={`btn ${activeTab === 'registry' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                Asset Registry
              </button>
              <button onClick={() => setActiveTab('maintenance')} className={`btn ${activeTab === 'maintenance' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                Maintenance Scheduler
              </button>
            </div>

            {/* TAB 1: Trips & Dispatches */}
            {activeTab === 'dispatches' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Trip Planner form */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>Draft Dispatch Order</h3>
                  {tripSuccess && <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.8rem', borderRadius: '6px', marginBottom: '1rem' }}>{tripSuccess}</div>}
                  <form onSubmit={handleCreateTrip}>
                    <div className="form-group">
                      <label className="form-label">Origin Source</label>
                      <input type="text" placeholder="e.g. Mumbai Warehouse" className="input-field" value={tripSource} onChange={(e) => setTripSource(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Destination Retail Plaza</label>
                      <input type="text" placeholder="e.g. Pune Retail Outlet" className="input-field" value={tripDest} onChange={(e) => setTripDest(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Select Available Vehicle</label>
                      <select className="input-field" value={tripVehId} onChange={(e) => setTripVehId(e.target.value)}>
                        <option value="">-- Choose Vehicle --</option>
                        {vehicles.filter(v => v.status === 'Available').map(v => (
                          <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model} - Max: {v.maxLoadCapacity}kg)</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Select Available Driver</label>
                      <select className="input-field" value={tripDrvId} onChange={(e) => setTripDrvId(e.target.value)}>
                        <option value="">-- Choose Driver --</option>
                        {drivers.filter(d => d.status === 'Available').map(d => (
                          <option key={d.id} value={d.id}>{d.name} (Safety: {d.safetyScore}%)</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label">Cargo Weight (kg)</label>
                        <input type="number" className="input-field mono" value={tripWeight} onChange={(e) => setTripWeight(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Distance (km)</label>
                        <input type="number" className="input-field mono" value={tripDistance} onChange={(e) => setTripDistance(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                      Create Dispatch Draft
                    </button>
                  </form>
                </div>

                {/* List of dispatches and trips */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Dispatches & Trip Logs</h3>
                  <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {trips.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No trips registered in database.</p>
                    ) : (
                      trips.map(t => (
                        <div key={t.id} className="card" style={{ padding: '1rem', marginBottom: 0, fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <strong className="mono">{t.id}</strong>
                            <span className={`badge ${t.status === 'Draft' ? 'badge-warning' : t.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>{t.status}</span>
                          </div>
                          <div>Route: <strong>{t.source} ➔ {t.destination}</strong></div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Driver: {t.driverName || t.driverId} | Vehicle: {t.vehicleReg || t.vehicleId}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            {t.status === 'Draft' && (
                              <button onClick={() => dispatchTrip(t.id)} className="btn btn-primary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                                Dispatch
                              </button>
                            )}
                            {['Dispatched', 'En Route to Pickup', 'Loading Cargo', 'In Transit'].includes(t.status) && (
                              <button onClick={() => cancelTrip(t.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                                Cancel Trip
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Asset Registry */}
            {activeTab === 'registry' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Vehicles list & registry form */}
                <div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>Register New Vehicle</h3>
                    {vehSuccess && <div style={{ color: 'var(--primary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{vehSuccess}</div>}
                    <form onSubmit={handleRegisterVehicle}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Plate Registration</label>
                          <input type="text" placeholder="MH-12-PQ-1234" className="input-field mono" value={vehReg} onChange={(e) => setVehReg(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Model</label>
                          <input type="text" placeholder="Tata Winger 2023" className="input-field" value={vehModel} onChange={(e) => setVehModel(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Vehicle Type</label>
                          <select className="input-field" value={vehType} onChange={(e) => setVehType(e.target.value)}>
                            <option value="VAN">VAN</option>
                            <option value="TRUCK">TRUCK</option>
                            <option value="CAR">CAR</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Max Load (kg)</label>
                          <input type="number" className="input-field mono" value={vehCapacity} onChange={(e) => setVehCapacity(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Odometer (km)</label>
                          <input type="number" className="input-field mono" value={vehOdometer} onChange={(e) => setVehOdometer(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Cost (₹)</label>
                          <input type="number" className="input-field mono" value={vehCost} onChange={(e) => setVehCost(e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Operational Region</label>
                        <select className="input-field" value={vehRegion} onChange={(e) => setVehRegion(e.target.value)}>
                          <option value="West India">West India</option>
                          <option value="North India">North India</option>
                          <option value="South India">South India</option>
                          <option value="East India">East India</option>
                        </select>
                      </div>
                      <button type="submit" className="btn btn-primary">Register Vehicle</button>
                    </form>
                  </div>

                  {/* Vehicles List */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '1.5rem 0 1rem 0' }}>Vehicle Assets ({vehicles.length})</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {vehicles.map(v => (
                      <div key={v.id} className="card" style={{ padding: '0.75rem', marginBottom: 0, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong className="mono" style={{ fontSize: '0.9rem' }}>{v.registrationNumber}</strong>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{v.model} | Cap: {v.maxLoadCapacity}kg | Odo: {v.odometer}km</div>
                        </div>
                        <span className={`badge ${v.status === 'Available' ? 'badge-success' : v.status === 'In Shop' ? 'badge-warning' : 'badge-info'}`}>{v.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drivers list & registration form */}
                <div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>Register Fleet Driver</h3>
                    {drvSuccess && <div style={{ color: 'var(--primary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{drvSuccess}</div>}
                    <form onSubmit={handleRegisterDriver}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input type="text" placeholder="Rahul Sharma" className="input-field" value={drvName} onChange={(e) => setDrvName(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">License Plate / ID</label>
                          <input type="text" placeholder="MH-12-2023-004" className="input-field mono" value={drvLicenseNum} onChange={(e) => setDrvLicenseNum(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">License Class</label>
                          <input type="text" placeholder="MCWG/LMV" className="input-field mono" value={drvLicenseCat} onChange={(e) => setDrvLicenseCat(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Expiry Date</label>
                          <input type="date" className="input-field" value={drvLicenseExp} onChange={(e) => setDrvLicenseExp(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contact Number</label>
                          <input type="text" placeholder="+919876543210" className="input-field mono" value={drvContact} onChange={(e) => setDrvContact(e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group">
                          <label className="form-label">Login Email</label>
                          <input type="email" placeholder="rahul@transitops.in" className="input-field" value={drvEmail} onChange={(e) => setDrvEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Password</label>
                          <input type="password" placeholder="••••••••" className="input-field" value={drvPassword} onChange={(e) => setDrvPassword(e.target.value)} />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary">Register & Provision Driver</button>
                    </form>
                  </div>

                  {/* Drivers List */}
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '1.5rem 0 1rem 0' }}>Driver Records ({drivers.length})</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {drivers.map(d => (
                      <div key={d.id} className="card" style={{ padding: '0.75rem', marginBottom: 0, fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{d.name}</strong>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>License: {d.licenseNumber} | Contact: {d.contactNumber}</div>
                        </div>
                        <span className={`badge ${d.status === 'Available' ? 'badge-success' : d.status === 'Suspended' ? 'badge-warning' : 'badge-info'}`}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Maintenance Scheduler */}
            {activeTab === 'maintenance' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Send to Maintenance form */}
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>Schedule Vehicle Repair</h3>
                  {maintSuccess && <div style={{ color: 'var(--primary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{maintSuccess}</div>}
                  <form onSubmit={handleOpenMaintenance}>
                    <div className="form-group">
                      <label className="form-label">Choose Active Vehicle</label>
                      <select className="input-field" value={maintVehId} onChange={(e) => setMaintVehId(e.target.value)}>
                        <option value="">-- Select --</option>
                        {vehicles.filter(v => v.status === 'Available').map(v => (
                          <option key={v.id} value={v.id}>{v.registrationNumber} ({v.model})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Maintenance Type</label>
                      <select className="input-field" value={maintType} onChange={(e) => setMaintType(e.target.value)}>
                        <option value="Scheduled">Scheduled Oil/Tire Service</option>
                        <option value="Unscheduled">Emergency Repairs</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estimated Cost (₹)</label>
                      <input type="number" className="input-field mono" value={maintCost} onChange={(e) => setMaintCost(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Issue Details / Description</label>
                      <textarea rows={3} placeholder="Routine brake pad replacement" className="input-field" value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} style={{ resize: 'none' }}></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary">Dispatch to Shop</button>
                  </form>
                </div>

                {/* Vehicles in Shop & Close Maintenance form */}
                <div>
                  <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>Resolve Active Maintenance</h3>
                    {closeMaintSuccess && <div style={{ color: 'var(--primary)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{closeMaintSuccess}</div>}
                    <form onSubmit={handleCloseMaintenance}>
                      <div className="form-group">
                        <label className="form-label">Choose Vehicle in Shop</label>
                        <select className="input-field" value={closeMaintId} onChange={(e) => setCloseMaintId(e.target.value)}>
                          <option value="">-- Choose Log --</option>
                          {vehicles.filter(v => v.status === 'In Shop').map(v => (
                            <option key={v.id} value={v.id}>{v.registrationNumber} (Currently In Shop)</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Final Invoice Cost (₹)</label>
                        <input type="number" className="input-field mono" value={closeMaintCost} onChange={(e) => setCloseMaintCost(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Closing Notes</label>
                        <input type="text" placeholder="Replaced brake pads and fluids." className="input-field" value={closeMaintNotes} onChange={(e) => setCloseMaintNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-secondary">Resolve & Release Vehicle</button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SAFETY OFFICER AUDIT VIEW */}
        {simulatedRole === 'SAFETY_OFFICER' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>Driver Safety & License Audit Console</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Driver Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>License Details</th>
                    <th style={{ padding: '0.75rem 1rem' }}>License Expiry</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Safety Score</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Current Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No drivers found in the system.</td>
                    </tr>
                  ) : (
                    drivers.map(d => {
                      const daysLeft = Math.ceil((new Date(d.licenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const isExpired = daysLeft <= 0;
                      const isExpiringSoon = daysLeft > 0 && daysLeft < 30;

                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{d.name}</td>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{d.licenseNumber} ({d.licenseCategory})</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span>{new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}</span>
                              {isExpired && <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', backgroundColor: 'rgba(211,47,47,0.15)', color: 'var(--error)' }}>EXPIRED</span>}
                              {isExpiringSoon && <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>{daysLeft}d left</span>}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontWeight: 700, color: d.safetyScore < 85 ? 'var(--error)' : 'var(--success)' }}>
                              {d.safetyScore}%
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span className={`badge ${d.status === 'Available' ? 'badge-success' : d.status === 'Suspended' ? 'badge-warning' : 'badge-info'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <button
                              onClick={() => toggleSuspension(d)}
                              className={`btn ${d.status === 'Suspended' ? 'btn-secondary' : 'btn-danger'}`}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: 'auto' }}
                            >
                              {d.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCIAL ANALYST BUSINESS VIEWS */}
        {simulatedRole === 'FINANCIAL_ANALYST' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Business ROI & Operations Analysis</h2>
              
              {/* CSV download link */}
              <a href={`${API_BASE}/api/analytics/export`} download className="btn btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', textDecoration: 'none' }}>
                <Download size={16} /> Export Performance CSV
              </a>
            </div>

            {/* Performance table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Registration Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Fuel Efficiency (km/L)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Fleet Utilization (%)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Operating Expenses (₹)</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Investment ROI (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No performance reports available.</td>
                    </tr>
                  ) : (
                    performanceData.map(p => (
                      <tr key={p.vehicleId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{p.registrationNumber}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{p.fuelEfficiencyKml} km/L</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{p.fleetUtilizationPercent}%</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>₹{p.totalOperationalCost.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: p.roiPercent < 0 ? 'var(--error)' : 'var(--success)' }}>
                            {p.roiPercent}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', marginTop: 'auto' }}>
        TransitOps Logistics Management Solutions &copy; 2026. Made with Precision.
      </footer>
    </div>
  );
}
