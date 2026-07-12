'use client';
import React, { useState, useEffect } from 'react';
import {
  Navigation, AlertTriangle, CheckCircle, DollarSign, Clock, MapPin, Plus, ShieldAlert, Loader2, Award
} from 'lucide-react';
import { DriverProfile, Trip, UserProfile } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import Alert from '@/components/common/Alert';

interface Props {
  token: string;
  user: UserProfile;
  driver: DriverProfile | null;
  activeTrip: Trip | null;
  isOffline: boolean;
  syncing: boolean;
  isOverlayDismissed: boolean;
  onOverlayDismiss: () => void;
  onStatusTransition: (nextStatus: 'En Route to Pickup' | 'Loading Cargo' | 'In Transit' | 'Completed') => void;
  onTripCompletion: (odo: number, liters: number, cost: number) => Promise<boolean>;
  onExpenseCreate: (amount: number, category: string, description: string) => Promise<boolean>;
}

export default function DriverDashboard({
  token, user, driver, activeTrip, isOffline, syncing, isOverlayDismissed, onOverlayDismiss,
  onStatusTransition, onTripCompletion, onExpenseCreate
}: Props) {
  const [completionView, setCompletionView] = useState(false);
  const [finalOdometer, setFinalOdometer] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [completionError, setCompletionError] = useState('');
  const [completionLoading, setCompletionLoading] = useState(false);

  // Expense form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Toll' | 'Fuel' | 'Cleaning' | 'Misc'>('Toll');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseSuccessMsg, setExpenseSuccessMsg] = useState('');
  const [expenseErrorMsg, setExpenseErrorMsg] = useState('');
  const [expenseLoading, setExpenseLoading] = useState(false);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompletionError('');
    const odo = parseFloat(finalOdometer);
    const fuel = parseFloat(fuelConsumed);
    const cost = parseFloat(fuelCost);

    if (isNaN(odo) || isNaN(fuel) || isNaN(cost) || odo <= 0 || fuel <= 0 || cost <= 0) {
      setCompletionError('Odometer, volume, and cost values must be positive.');
      return;
    }

    const startOdo = activeTrip?.vehicleOdometer || 0;
    if (odo < startOdo) {
      setCompletionError(`Final odometer cannot be less than vehicle's starting odometer (${startOdo.toLocaleString('en-IN')} km).`);
      return;
    }

    setCompletionLoading(true);
    const ok = await onTripCompletion(odo, fuel, cost);
    setCompletionLoading(false);
    if (ok) {
      setCompletionView(false);
      setFinalOdometer('');
      setFuelConsumed('');
      setFuelCost('');
    } else {
      setCompletionError('Failed to complete trip. Verify network or database records.');
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseSuccessMsg('');
    setExpenseErrorMsg('');
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0 || !expenseDescription) {
      setExpenseErrorMsg('Amount must be positive and description is required.');
      return;
    }

    setExpenseLoading(true);
    const ok = await onExpenseCreate(amt, expenseCategory, expenseDescription);
    setExpenseLoading(false);
    if (ok) {
      setExpenseSuccessMsg(isOffline ? 'Expense saved locally (offline).' : 'Expense logged successfully!');
      setExpenseAmount('');
      setExpenseDescription('');
    } else {
      setExpenseErrorMsg('Failed to log expense.');
    }
  };

  const daysToExpiry = driver
    ? Math.ceil((new Date(driver.licenseExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 100;

  return (
    <div>
      {/* License Warning */}
      {driver && daysToExpiry < 30 && (
        <Alert
          type={daysToExpiry <= 0 ? 'error' : 'warning'}
          message={`Driving License ${driver.licenseNumber} ${daysToExpiry <= 0 ? 'has EXPIRED' : `expires in ${daysToExpiry} days`} (on ${new Date(driver.licenseExpiryDate).toLocaleDateString('en-IN')}). Please submit renewal immediately.`}
        />
      )}

      {/* Syncing indicator */}
      {syncing && (
        <div className="sync-indicator" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <Loader2 className="alert-pulse" size={16} />
          <span>Syncing pending offline database transactions...</span>
        </div>
      )}

      {/* Dispatched alert overlay */}
      {activeTrip && activeTrip.status === 'Dispatched' && !isOverlayDismissed && (
        <div className="fullscreen-overlay">
          <div className="overlay-card">
            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }} className="alert-pulse">
              <Navigation size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>New Dispatch Assigned</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Acknowledge and start route transit immediately.</p>
            
            <div style={{ backgroundColor: 'var(--background)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ROUTE</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.25rem 0' }}>{activeTrip.source} ➔ {activeTrip.destination}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div>Cargo: <strong>{activeTrip.cargoWeight} kg</strong></div>
                <div>Distance: <strong>{activeTrip.plannedDistance} km</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { onStatusTransition('En Route to Pickup'); onOverlayDismiss(); }} className="btn btn-primary" style={{ flex: 2 }}>
                Accept & Start
              </button>
              <button onClick={onOverlayDismiss} className="btn btn-secondary" style={{ flex: 1 }}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Trip Info or No Trip Card */}
      {completionView && activeTrip ? (
        <div className="card">
          <h2 style={{ fontSize: '1.20rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} /> Complete Active Delivery
          </h2>
          
          {completionError && <Alert type="error" message={completionError} />}

          <form onSubmit={handleCompleteSubmit}>
            <div className="form-group">
              <label className="form-label">Final Odometer (km)</label>
              <input type="number" step="0.1" className="input-field mono" value={finalOdometer} onChange={e => setFinalOdometer(e.target.value)} required />
              {activeTrip.vehicleOdometer && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Starting Odometer: <strong>{Number(activeTrip.vehicleOdometer).toLocaleString('en-IN')} km</strong> (final value must be greater than this)
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Fuel Added (Liters)</label>
              <input type="number" step="0.1" className="input-field mono" value={fuelConsumed} onChange={e => setFuelConsumed(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Fuel Cost (₹ INR)</label>
              <input type="number" step="0.01" className="input-field mono" value={fuelCost} onChange={e => setFuelCost(e.target.value)} required />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={completionLoading}>
                {completionLoading ? 'Submitting...' : 'Submit & Complete'}
              </button>
              <button type="button" onClick={() => setCompletionView(false)} className="btn btn-secondary">Go Back</button>
            </div>
          </form>
        </div>
      ) : activeTrip ? (
        <div>
          {/* Active Trip Status Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Navigation size={18} /> Active Delivery Transit
              </h2>
              <StatusBadge status={activeTrip.status} />
            </div>

            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', margin: '0.75rem 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>SOURCE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeTrip.source}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>➔</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>DESTINATION</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeTrip.destination}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0 0.5rem', background: 'var(--background)', padding: '0.75rem', borderRadius: '8px' }}>
                <div>Cargo: <strong>{activeTrip.cargoWeight} kg</strong></div>
                <div>Distance: <strong>{activeTrip.plannedDistance} km</strong></div>
                <div>Vehicle: <strong>{activeTrip.vehicleReg}</strong></div>
              </div>
            </div>

            {/* Quick Status transition triggers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {activeTrip.status === 'En Route to Pickup' && (
                <button onClick={() => onStatusTransition('Loading Cargo')} className="btn btn-primary">
                  Arrived at Source (Start Loading)
                </button>
              )}
              {activeTrip.status === 'Loading Cargo' && (
                <button onClick={() => onStatusTransition('In Transit')} className="btn btn-primary">
                  Cargo Loaded (Start Transit)
                </button>
              )}
              {activeTrip.status === 'In Transit' && (
                <button onClick={() => setCompletionView(true)} className="btn btn-primary">
                  Arrived at Destination (Complete Delivery)
                </button>
              )}
            </div>
          </div>

          {/* Quick Expense Log Card (Inside trip context) */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}>
              <DollarSign size={16} /> Log Expense (Tolls, Parking, etc.)
            </h3>
            {expenseSuccessMsg && <Alert type="success" message={expenseSuccessMsg} />}
            {expenseErrorMsg && <Alert type="error" message={expenseErrorMsg} />}

            <form onSubmit={handleExpenseSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="input-field" value={expenseCategory} onChange={e => setExpenseCategory(e.target.value as any)}>
                    <option>Toll</option>
                    <option>Fuel</option>
                    <option>Cleaning</option>
                    <option>Misc</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input type="number" step="0.01" className="input-field mono" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="input-field" placeholder="Toll Plaza expense" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={expenseLoading}>
                {expenseLoading ? 'Logging...' : 'Log Expense'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Clock size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Active Shipments</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '320px', margin: '0 auto 1.5rem' }}>
            You are currently available in the dispatch pool. Wait for Fleet Manager to issue route orders.
          </p>
          {driver && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--background)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
              <Award size={15} style={{ color: 'var(--warning)' }} />
              Driver Safety Score: <strong>{driver.safetyScore}%</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
