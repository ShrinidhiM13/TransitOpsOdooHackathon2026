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
  Navigation
} from 'lucide-react';

// Detect connection base dynamically
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

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  status: 'Draft' | 'Dispatched' | 'En Route to Pickup' | 'Loading Cargo' | 'In Transit' | 'Completed' | 'Cancelled';
}

interface PendingExpense {
  id: string;
  amount: number;
  category: 'Toll' | 'Fuel' | 'Cleaning' | 'Misc';
  description: string;
  date: string;
  vehicleId: string;
  tripId: string;
}

export default function DriverApp() {
  // App States
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Expense Form States
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Toll' | 'Fuel' | 'Cleaning' | 'Misc'>('Toll');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseSuccessMsg, setExpenseSuccessMsg] = useState('');
  const [expenseErrorMsg, setExpenseErrorMsg] = useState('');

  // Trip Completion Form States
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [completionView, setCompletionView] = useState(false);

  // Audio Playback helper
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playAlertSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      // Play a dual tone sirens sound (Zomato alert style)
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

      gainNode.gain.setValueAtTime(0.3, now);
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
        const pendingExpenses: PendingExpense[] = JSON.parse(pendingExpensesStr);
        const remainingExpenses: PendingExpense[] = [];
        
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
            if (!data.success) {
              remainingExpenses.push(exp);
            }
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

  // Fetch active trip from API
  const fetchActiveTrip = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/trips/active`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveTrip(data.trip);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP, JSON.stringify(data.trip));
        return data.trip;
      }
    } catch (err) {
      console.warn("Could not fetch active trip, reading from cache");
      const cached = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP);
      if (cached) {
        const parsed = JSON.parse(cached);
        setActiveTrip(parsed);
        return parsed;
      }
    }
    return null;
  }, []);

  // Fetch current session details
  const fetchProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setDriver(data.driver);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        localStorage.setItem(STORAGE_KEYS.DRIVER, JSON.stringify(data.driver));
        
        if (data.user.role !== 'DRIVER') {
          setLoginError('Error: Access restricted to Driver accounts only.');
          handleLogout();
        }
        return data.driver;
      }
    } catch (err) {
      console.warn("Could not fetch profile, reading from cache");
      const cachedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const cachedDriver = localStorage.getItem(STORAGE_KEYS.DRIVER);
      if (cachedUser && cachedDriver) {
        setUser(JSON.parse(cachedUser));
        setDriver(JSON.parse(cachedDriver));
      }
    }
    return null;
  }, []);

  // Core App Initializer
  useEffect(() => {
    const localToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const localTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | null;
    
    // Set theme
    if (localTheme) {
      setTheme(localTheme);
      document.documentElement.setAttribute('data-theme', localTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Set network status event listeners
    const handleOnline = () => {
      setIsOffline(false);
      if (localToken) {
        syncOfflineData(localToken);
        fetchActiveTrip(localToken);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    if (localToken) {
      setToken(localToken);
      Promise.all([fetchProfile(localToken), fetchActiveTrip(localToken)]).then(() => {
        setLoading(false);
        syncOfflineData(localToken);
      });
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchProfile, fetchActiveTrip, syncOfflineData]);

  // Polling for new dispatches (when online)
  useEffect(() => {
    if (!token || isOffline) return;

    const interval = setInterval(() => {
      fetchActiveTrip(token);
    }, 8000);

    return () => clearInterval(interval);
  }, [token, isOffline, fetchActiveTrip]);

  // Zomato Style Overlay Audio Trigger
  useEffect(() => {
    if (activeTrip && activeTrip.status === 'Dispatched' && !isOverlayDismissed) {
      playAlertSound();
      const soundInterval = setInterval(playAlertSound, 3000);
      return () => clearInterval(soundInterval);
    }
  }, [activeTrip, isOverlayDismissed, playAlertSound]);

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
      setLoginError('All fields are required.');
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
        const authToken = data.token;
        if (data.user.role !== 'DRIVER') {
          setLoginError('Authentication failed: Only drivers can sign in here.');
          setLoginLoading(false);
          return;
        }

        setToken(authToken);
        setUser(data.user);
        localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

        // Fetch driver profile
        const driverProf = await fetchProfile(authToken);
        await fetchActiveTrip(authToken);
        
        setLoginEmail('');
        setLoginPassword('');
      } else {
        setLoginError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
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
  };

  // Transition active trip state
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
      // Store in pending transitions
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
        console.error("Transition failed, reverting status", data.message);
        fetchActiveTrip(token);
      }
    } catch (e) {
      console.warn("API transition failed, offline caching triggered");
      localStorage.setItem(
        STORAGE_KEYS.PENDING_STATUS_UPDATES,
        JSON.stringify({ tripId: activeTrip.id, status: nextStatus })
      );
    }
  };

  // Log Expense Stop
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseSuccessMsg('');
    setExpenseErrorMsg('');

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) {
      setExpenseErrorMsg('Amount must be a positive number.');
      return;
    }
    if (!expenseDescription) {
      setExpenseErrorMsg('Description is required.');
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
      setExpenseSuccessMsg('Expense logged locally (Offline Mode). Will sync when online.');
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
        setExpenseSuccessMsg('Expense successfully uploaded to server.');
        setExpenseAmount('');
        setExpenseDescription('');
      } else {
        setExpenseErrorMsg(data.message || 'Failed to submit expense.');
      }
    } catch (err) {
      // API fallback
      const pendingExpensesStr = localStorage.getItem(STORAGE_KEYS.PENDING_EXPENSES);
      const pending = pendingExpensesStr ? JSON.parse(pendingExpensesStr) : [];
      pending.push(expensePayload);
      localStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(pending));
      setExpenseSuccessMsg('Network error. Saved expense locally to sync later.');
      setExpenseAmount('');
      setExpenseDescription('');
    }
  };

  // Trip Completion Handler
  const handleTripCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompletionError('');

    if (!activeTrip || !token) return;

    const finalOdo = parseFloat(finalOdometer);
    const fuelLiters = parseFloat(fuelConsumed);
    const cost = parseFloat(fuelCost);

    if (isNaN(finalOdo) || finalOdo <= 0) {
      setCompletionError('Valid final odometer is required.');
      return;
    }
    if (isNaN(fuelLiters) || fuelLiters <= 0) {
      setCompletionError('Valid fuel consumed volume is required.');
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      setCompletionError('Valid fuel cost is required.');
      return;
    }

    if (isOffline) {
      setCompletionError('Cannot complete trip while offline. Odometer and fuel updates must be committed to the server. Please reconnect to complete.');
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
        fetchProfile(token); // Update driver status back to Available
      } else {
        setCompletionError(data.message || 'Failed to complete trip.');
      }
    } catch (err) {
      setCompletionError('Network error. Failed to commit trip completion.');
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <Loader2 size={40} className="alert-pulse" style={{ color: 'var(--primary)', animationDuration: '1s' }} />
      </div>
    );
  }

  // 1. Authentication View
  if (!token) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }}>
              <Truck size={36} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>TransitOps</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Driver Console Login</p>
          </div>

          {loginError && (
            <div className="compliance-banner" style={{ marginBottom: '1.25rem' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <div>{loginError}</div>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Driver Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@transitops.in"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">PIN / Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loginLoading} style={{ marginTop: '1rem' }}>
              {loginLoading ? <Loader2 className="alert-pulse" size={20} /> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate compliance rules (license expiration < 30 days)
  const daysToExpiry = driver ? Math.ceil((new Date(driver.licenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 999;
  const isLicenseExpiringSoon = daysToExpiry < 30;

  // Active state buttons helper
  const renderZomatoButtons = () => {
    if (!activeTrip) return null;
    switch (activeTrip.status) {
      case 'Dispatched':
        return (
          <button onClick={() => executeStatusTransition('En Route to Pickup')} className="btn btn-primary alert-pulse">
            <Navigation size={18} /> Start Trip
          </button>
        );
      case 'En Route to Pickup':
        return (
          <button onClick={() => executeStatusTransition('Loading Cargo')} className="btn btn-primary">
            <Activity size={18} /> Arrived at Pickup
          </button>
        );
      case 'Loading Cargo':
        return (
          <button onClick={() => executeStatusTransition('In Transit')} className="btn btn-primary">
            <Truck size={18} /> Out for Delivery
          </button>
        );
      case 'In Transit':
        return (
          <button onClick={() => executeStatusTransition('Completed')} className="btn btn-danger">
            <CheckCircle size={18} /> Mark Delivered
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* 2. Header panel */}
      <header className="app-header">
        <div className="brand">
          <Truck size={24} />
          <span>TransitOps Driver</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isOffline ? (
            <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <WifiOff size={16} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Offline</span>
            </div>
          ) : (
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Wifi size={16} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Online</span>
            </div>
          )}
          
          <button onClick={handleThemeToggle} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="container" style={{ flex: 1 }}>
        {/* Compliance Warning License Banner */}
        {isLicenseExpiringSoon && driver && (
          <div className="compliance-banner">
            <AlertTriangle size={24} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>License Expiry Notice</div>
              Your HGV commercial license ({driver.licenseNumber}) expires on {new Date(driver.licenseExpiryDate).toLocaleDateString('en-IN')} ({daysToExpiry} days remaining). Please renew before expiration to avoid suspended dispatches.
            </div>
          </div>
        )}

        {/* Syncing Overlay Loader */}
        {syncing && (
          <div className="sync-indicator" style={{ justifyContent: 'center', margin: '0.5rem 0' }}>
            <Loader2 className="alert-pulse" size={16} />
            <span>Syncing offline records...</span>
          </div>
        )}

        {/* 3. Zomato-style Fullscreen Intercept Overlay for Assigned Trip */}
        {activeTrip && activeTrip.status === 'Dispatched' && !isOverlayDismissed && (
          <div className="fullscreen-overlay">
            <div className="overlay-card">
              <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1.25rem' }} className="alert-pulse">
                <Navigation size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>New Dispatch Order</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>You have been assigned a new delivery route!</p>
              
              <div style={{ backgroundColor: 'var(--background)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ROUTE</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, margin: '0.25rem 0' }}>{activeTrip.source} ➔ {activeTrip.destination}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Cargo Weight:</span> <strong className="mono">{activeTrip.cargoWeight} kg</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Distance:</span> <strong className="mono">{activeTrip.plannedDistance} km</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
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

        {/* 4. Active Trip Panel OR Available State */}
        {completionView && activeTrip ? (
          /* Trip Completion Form */
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} /> Complete Trip Details
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Please enter final vehicle parameters to release the vehicle and set your status back to Available.
            </p>

            {completionError && (
              <div className="compliance-banner">
                <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                <div>{completionError}</div>
              </div>
            )}

            <form onSubmit={handleTripCompletionSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="finalOdo">Final Odometer (km)</label>
                <input
                  id="finalOdo"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 12650.5"
                  className="input-field mono"
                  value={finalOdometer}
                  onChange={(e) => setFinalOdometer(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fuelLiters">Fuel Consumed (Liters)</label>
                <input
                  id="fuelLiters"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 24.5"
                  className="input-field mono"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fuelCost">Total Fuel Cost (₹ INR)</label>
                <input
                  id="fuelCost"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 2500"
                  className="input-field mono"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit & Complete</button>
                <button type="button" onClick={() => setCompletionView(false)} className="btn btn-secondary">Back</button>
              </div>
            </form>
          </div>
        ) : activeTrip ? (
          /* Active Trip Card & Lifecycle Progress Panel */
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>Active Delivery Order</h2>
              <span className={`badge ${
                activeTrip.status === 'Dispatched' ? 'badge-warning' : 'badge-info'
              }`}>
                {activeTrip.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOURCE ORIGIN</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{activeTrip.source}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DESTINATION TARGET</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{activeTrip.destination}</div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-box">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CARGO WEIGHT</div>
                <div className="stat-val mono" style={{ fontSize: '1.25rem' }}>{activeTrip.cargoWeight} kg</div>
              </div>
              <div className="stat-box">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PLANNED DISTANCE</div>
                <div className="stat-val mono" style={{ fontSize: '1.25rem' }}>{activeTrip.plannedDistance} km</div>
              </div>
            </div>

            {/* Step-by-Step active progression timeline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0 1.5rem 0', position: 'relative' }}>
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
                    <span style={{ fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {renderZomatoButtons()}
            </div>
          </div>
        ) : (
          /* Available State */
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1.25rem' }} className="alert-pulse">
              <Truck size={36} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Awaiting Next Dispatch</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You are currently marked as <span style={{ color: 'var(--success)', fontWeight: 700 }}>Available</span>. Dispatches assigned by Fleet Managers will pop up here in real-time.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span className="status-dot status-dot-active alert-pulse"></span>
              <span>Active GPS Tracking Enabled</span>
            </div>
          </div>
        )}

        {/* 5. Driver Profile Panel */}
        {driver && (
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Driver Profile
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Name</span>
                <span style={{ fontWeight: 600 }}>{driver.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>License Number</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{driver.licenseNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Category</span>
                <span style={{ fontWeight: 600 }}>{driver.licenseCategory}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contact Number</span>
                <span style={{ fontWeight: 600 }}>{driver.contactNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Safety Score</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Award size={16} /> {driver.safetyScore}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Status</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <span className={`status-dot ${driver.status === 'Available' ? 'status-dot-active' : 'status-dot-warning'}`}></span>
                  {driver.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6. Expense Stop Logging Form */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={18} /> Record Road Expense
          </h3>

          {expenseSuccessMsg && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(46, 125, 50, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} />
              <span>{expenseSuccessMsg}</span>
            </div>
          )}

          {expenseErrorMsg && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(211, 47, 47, 0.1)', color: 'var(--error)', border: '1px solid var(--error)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              <span>{expenseErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogExpense}>
            <div className="form-group">
              <label className="form-label" htmlFor="expenseAmt">Amount (₹ INR)</label>
              <input
                id="expenseAmt"
                type="number"
                step="0.01"
                placeholder="e.g. 350.00"
                className="input-field mono"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expenseCat">Category</label>
              <select
                id="expenseCat"
                className="input-field"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as any)}
              >
                <option value="Toll">Toll gate tax</option>
                <option value="Fuel">Ad-hoc Fuel Stop</option>
                <option value="Cleaning">Vehicle Wash / Cleaning</option>
                <option value="Misc">Miscellaneous Road Costs</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expenseDesc">Description</label>
              <input
                id="expenseDesc"
                type="text"
                placeholder="e.g. Mumbai Pune Expressway Toll Plaza"
                className="input-field"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-secondary">
              Log Road Expense
            </button>
          </form>
        </div>
      </main>
      
      <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', marginTop: 'auto' }}>
        TransitOps Logistics Management Solutions &copy; 2026. Made with Precision.
      </footer>
    </div>
  );
}
