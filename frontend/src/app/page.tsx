'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Truck, Loader2, ShieldAlert, Lock, Mail } from 'lucide-react';
import { UserProfile, DriverProfile, Trip } from '@/types';
import { API_BASE } from '@/hooks/useApi';
import Header from '@/components/common/Header';
import FleetManagerDashboard from '@/components/fleet-manager/FleetManagerDashboard';
import SafetyOfficerDashboard from '@/components/safety-officer/SafetyOfficerDashboard';
import FinancialAnalystDashboard from '@/components/financial-analyst/FinancialAnalystDashboard';
import DriverDashboard from '@/components/driver/DriverDashboard';
import Alert from '@/components/common/Alert';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const STORAGE_KEYS = {
  TOKEN: 'transitops_driver_token',
  USER: 'transitops_driver_user',
  DRIVER: 'transitops_driver_profile',
  ACTIVE_TRIP: 'transitops_active_trip',
  PENDING_EXPENSES: 'transitops_pending_expenses',
  PENDING_STATUS_UPDATES: 'transitops_pending_status_updates',
  THEME: 'transitops_theme'
};

export default function HomePortal() {
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Call Web Push Notification Hook for Driver
  usePushNotifications(token, user?.role);


  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play alert sound for driver dispatch
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

  // Fetch active trip (Driver only)
  const fetchActiveTrip = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/trips/active`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveTrip(data.trip);
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP, JSON.stringify(data.trip));
      } else {
        setActiveTrip(null);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
      }
    } catch (err) {
      const cached = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP);
      if (cached) {
        setActiveTrip(JSON.parse(cached));
      }
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
              body: JSON.stringify(exp)
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

  // Fetch profile
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
        
        if (data.user.role === 'DRIVER') {
          fetchActiveTrip(authToken);
        }
      }
    } catch (err) {
      const cachedUser = localStorage.getItem(STORAGE_KEYS.USER);
      const cachedDriver = localStorage.getItem(STORAGE_KEYS.DRIVER);
      if (cachedUser) {
        const u = JSON.parse(cachedUser);
        setUser(u);
      }
      if (cachedDriver) setDriver(JSON.parse(cachedDriver));
    }
  }, [fetchActiveTrip]);

  // Initial load
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

  // WebSocket connection for real-time status updates
  useEffect(() => {
    if (!token) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = () => {
      if (typeof window === 'undefined') return;
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname === 'localhost' ? 'localhost:3000' : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/ws`;

      console.log('[WebSocket Client] Connecting to', wsUrl);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WebSocket Client] Connection established');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket Client] Received event:', data);
          
          // Trigger a data refresh for panels
          setRefreshTrigger((prev) => prev + 1);

          // For driver: fetch active trip on status transitions or dispatches
          if (user?.role === 'DRIVER') {
            fetchActiveTrip(token);
          }
        } catch (err) {
          console.error('[WebSocket Client] Error parsing message:', err);
        }
      };

      socket.onclose = () => {
        console.log('[WebSocket Client] Connection closed, scheduling reconnect...');
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      socket.onerror = (err) => {
        console.error('[WebSocket Client] Socket error:', err);
      };
    };

    connectWS();

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [token, user?.role, fetchActiveTrip]);

  // Polling for driver status updates
  useEffect(() => {
    if (!token || isOffline || user?.role !== 'DRIVER') return;
    const interval = setInterval(() => {
      fetchActiveTrip(token);
    }, 8000);
    return () => clearInterval(interval);
  }, [token, isOffline, user?.role, fetchActiveTrip]);

  // Alert siren when driver gets new dispatch
  useEffect(() => {
    if (user?.role === 'DRIVER' && activeTrip && activeTrip.status === 'Dispatched' && !isOverlayDismissed) {
      playAlertSound();
      const soundInterval = setInterval(playAlertSound, 3000);
      return () => clearInterval(soundInterval);
    }
  }, [activeTrip, user?.role, isOverlayDismissed, playAlertSound]);

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
        setLoginError(data.message || 'Verification failed.');
      }
    } catch (err) {
      setLoginError('Failed to connect to server.');
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
  };

  // Driver Status progression helper
  const handleDriverStatusTransition = async (nextStatus: 'En Route to Pickup' | 'Loading Cargo' | 'In Transit' | 'Completed') => {
    if (!activeTrip || !token) return;
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
      await fetch(`${API_BASE}/api/trips/${activeTrip.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch (e) {
      localStorage.setItem(
        STORAGE_KEYS.PENDING_STATUS_UPDATES,
        JSON.stringify({ tripId: activeTrip.id, status: nextStatus })
      );
    }
  };

  // Driver Trip Completion Submit
  const handleDriverTripCompletion = async (odo: number, liters: number, cost: number): Promise<boolean> => {
    if (!activeTrip || !token) return false;
    try {
      const res = await fetch(`${API_BASE}/api/trips/${activeTrip.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          finalOdometer: odo,
          fuelConsumedLiters: liters,
          fuelCost: cost
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveTrip(null);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
        await fetchProfile(token);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Driver Expense Log Submit
  const handleDriverExpenseCreate = async (amount: number, category: string, description: string): Promise<boolean> => {
    if (!token) return false;
    const expensePayload = {
      vehicleId: activeTrip ? activeTrip.vehicleId : 'veh_default',
      tripId: activeTrip?.id || null,
      driverId: driver?.id || null,
      amount,
      category,
      description,
      date: new Date().toISOString().split('T')[0]
    };

    if (isOffline) {
      const pendingExpensesStr = localStorage.getItem(STORAGE_KEYS.PENDING_EXPENSES);
      const pending = pendingExpensesStr ? JSON.parse(pendingExpensesStr) : [];
      pending.push(expensePayload);
      localStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(pending));
      return true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expensePayload)
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      const pendingExpensesStr = localStorage.getItem(STORAGE_KEYS.PENDING_EXPENSES);
      const pending = pendingExpensesStr ? JSON.parse(pendingExpensesStr) : [];
      pending.push(expensePayload);
      localStorage.setItem(STORAGE_KEYS.PENDING_EXPENSES, JSON.stringify(pending));
      return true;
    }
  };

  const fillLoginCreds = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('SecurePassword123');
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
        <Loader2 size={40} className="alert-pulse" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Login View
  if (!token) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backgroundColor: 'var(--background)' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <Truck size={32} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>TransitOps</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Operations Control Room Login</p>
          </div>

          {loginError && <Alert type="error" message={loginError} />}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  placeholder="user@transitops.in"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={loginLoading}>
              {loginLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Sign In'}
            </button>
          </form>

          {/* Dev Quick Fills */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>
              Evaluation Quick Login
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
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Active Authenticated Session
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        user={user}
        isOffline={isOffline}
        syncing={syncing}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
      />

      <main className="container-wide" style={{ flex: 1, padding: '1.5rem' }}>
        {user?.role === 'FLEET_MANAGER' && (
          <FleetManagerDashboard token={token} refreshTrigger={refreshTrigger} />
        )}
        {user?.role === 'SAFETY_OFFICER' && (
          <SafetyOfficerDashboard token={token} refreshTrigger={refreshTrigger} />
        )}
        {user?.role === 'FINANCIAL_ANALYST' && (
          <FinancialAnalystDashboard token={token} refreshTrigger={refreshTrigger} />
        )}
        {user?.role === 'DRIVER' && user && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <DriverDashboard
              token={token}
              user={user}
              driver={driver}
              activeTrip={activeTrip}
              isOffline={isOffline}
              syncing={syncing}
              isOverlayDismissed={isOverlayDismissed}
              onOverlayDismiss={() => setIsOverlayDismissed(true)}
              onStatusTransition={handleDriverStatusTransition}
              onTripCompletion={handleDriverTripCompletion}
              onExpenseCreate={handleDriverExpenseCreate}
            />
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', marginTop: 'auto' }}>
        TransitOps Logistics Management Solutions &copy; 2026. All Rights Reserved.
      </footer>
    </div>
  );
}
