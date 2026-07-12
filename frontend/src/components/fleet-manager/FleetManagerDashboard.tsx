'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck, Users, MapPin, Wrench, BarChart3, Plus, Send, X, RotateCcw,
  FileDown, RefreshCw, Search, Archive
} from 'lucide-react';
import { Vehicle, DriverProfile, Trip, MaintenanceLog, KPIData, ChartData } from '@/types';
import { useApi, API_BASE } from '@/hooks/useApi';
import KPICard from '@/components/common/KPICard';
import StatusBadge from '@/components/common/StatusBadge';
import Tabs from '@/components/common/Tabs';
import Alert from '@/components/common/Alert';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ChartPanel from '@/components/charts/ChartPanel';

interface Props { token: string; refreshTrigger?: number; }

const REGIONS = ['West India', 'North India', 'South India', 'East India', 'Central India'];
const LICENSE_CATS = ['MCWG/LMV', 'LMV-TR', 'HMV', 'HGV', 'HPMV', 'TRANS'];

export default function FleetManagerDashboard({ token, refreshTrigger }: Props) {
  const api = useApi(token);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  // Search / filter states
  const [vehSearch, setVehSearch] = useState('');
  const [drvSearch, setDrvSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState('');

  // Feedback messages
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showMsg = (type: 'success' | 'error', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  // Vehicle form
  const [vf, setVf] = useState({ reg: '', model: '', type: 'VAN', capacity: '', odometer: '', cost: '', region: 'West India' });
  // Driver form
  const [df, setDf] = useState({ name: '', licenseNum: '', licenseCat: 'MCWG/LMV', licenseExp: '', contact: '+91', email: '', password: '' });
  // Trip form
  const [tf, setTf] = useState({ source: '', dest: '', vehicleId: '', driverId: '', weight: '', distance: '' });
  // Maintenance forms
  const [mf, setMf] = useState({ vehicleId: '', desc: '', type: 'Scheduled', cost: '' });
  const [closeMf, setCloseMf] = useState<{ id: string; vehicleId: string; cost: string; notes: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setDataLoading(true);
    const [rv, rd, rt, rm, rk] = await Promise.all([
      api.get('/api/vehicles'),
      api.get('/api/drivers'),
      api.get('/api/trips'),
      api.get('/api/maintenance'),
      api.get('/api/analytics/kpis'),
    ]);
    if (rv) setVehicles(rv.vehicles);
    if (rd) setDrivers(rd.drivers);
    if (rt) setTrips(rt.trips);
    if (rm) setMaintenanceLogs(rm.maintenanceLogs);
    if (rk) setKpi(rk.data);
    setDataLoading(false);
  }, []); // eslint-disable-line

  const fetchCharts = useCallback(async () => {
    setChartLoading(true);
    const rc = await api.get('/api/analytics/charts');
    if (rc) setChartData(rc.charts);
    setChartLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); fetchCharts(); }, [refreshTrigger]); // eslint-disable-line

  // ---- Actions ----
  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/api/vehicles', {
      registrationNumber: vf.reg, model: vf.model, type: vf.type,
      maxLoadCapacity: parseFloat(vf.capacity), odometer: parseFloat(vf.odometer) || 0,
      acquisitionCost: parseFloat(vf.cost), region: vf.region,
    });
    if (res) { showMsg('success', 'Vehicle registered successfully!'); setVf({ reg: '', model: '', type: 'VAN', capacity: '', odometer: '', cost: '', region: 'West India' }); fetchAll(); }
    else showMsg('error', api.error || 'Failed to register vehicle');
  };

  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/api/drivers', {
      name: df.name, licenseNumber: df.licenseNum, licenseCategory: df.licenseCat,
      licenseExpiryDate: df.licenseExp, contactNumber: df.contact, email: df.email, password: df.password,
    });
    if (res) { showMsg('success', `Driver ${res.driver.name} registered! Login: ${res.provisionedCredentials.email}`); setDf({ name: '', licenseNum: '', licenseCat: 'MCWG/LMV', licenseExp: '', contact: '+91', email: '', password: '' }); fetchAll(); }
    else showMsg('error', api.error || 'Failed to register driver');
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/api/trips', {
      source: tf.source, destination: tf.dest, vehicleId: tf.vehicleId,
      driverId: tf.driverId, cargoWeight: parseFloat(tf.weight), plannedDistance: parseFloat(tf.distance),
    });
    if (res) { showMsg('success', 'Trip draft created!'); setTf({ source: '', dest: '', vehicleId: '', driverId: '', weight: '', distance: '' }); fetchAll(); }
    else showMsg('error', api.error || 'Failed to create trip');
  };

  const handleDispatch = async (tripId: string) => {
    const res = await api.put(`/api/trips/${tripId}/dispatch`, {});
    if (res) { showMsg('success', 'Trip dispatched! Vehicle and driver now On Trip.'); fetchAll(); }
    else showMsg('error', api.error || 'Dispatch failed');
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('Cancel this trip?')) return;
    const res = await api.put(`/api/trips/${tripId}/cancel`, {});
    if (res) { showMsg('success', 'Trip cancelled. Resources freed.'); fetchAll(); }
    else showMsg('error', api.error || 'Cancel failed');
  };

  const handleOpenMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/api/maintenance', {
      vehicleId: mf.vehicleId, description: mf.desc, type: mf.type,
      cost: parseFloat(mf.cost) || 0, startDate: new Date().toISOString().split('T')[0],
    });
    if (res) { showMsg('success', 'Maintenance opened. Vehicle is now In Shop.'); setMf({ vehicleId: '', desc: '', type: 'Scheduled', cost: '' }); fetchAll(); }
    else showMsg('error', api.error || 'Failed to open maintenance');
  };

  const handleCloseMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeMf) return;
    const res = await api.put(`/api/maintenance/${closeMf.id}/close`, {
      finalCost: parseFloat(closeMf.cost), notes: closeMf.notes,
      endDate: new Date().toISOString().split('T')[0],
    });
    if (res) { showMsg('success', 'Maintenance closed. Vehicle restored to Available.'); setCloseMf(null); fetchAll(); }
    else showMsg('error', api.error || 'Failed to close maintenance');
  };

  const handleRetireVehicle = async (vehicle: Vehicle) => {
    if (!confirm(`Retire vehicle ${vehicle.registrationNumber}? This cannot be undone.`)) return;
    const res = await api.put(`/api/vehicles/${vehicle.id}/retire`, {});
    if (res) { showMsg('success', `${vehicle.registrationNumber} retired.`); fetchAll(); }
    else showMsg('error', api.error || 'Failed to retire vehicle');
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (!confirm(`Delete ${vehicle.registrationNumber}? This is permanent.`)) return;
    const res = await api.del(`/api/vehicles/${vehicle.id}`);
    if (res) { showMsg('success', 'Vehicle deleted.'); fetchAll(); }
    else showMsg('error', api.error || 'Failed to delete vehicle');
  };

  const handleDeleteDriver = async (driver: DriverProfile) => {
    if (!confirm(`Delete driver ${driver.name}?`)) return;
    const res = await api.del(`/api/drivers/${driver.id}`);
    if (res) { showMsg('success', 'Driver deleted.'); fetchAll(); }
    else showMsg('error', api.error || 'Failed to delete driver');
  };

  const handleExportPDF = () => {
    window.open(`${API_BASE}/api/analytics/export/pdf?token=${token}`, '_blank');
  };

  const filteredVehicles = vehicles.filter(v =>
    !vehSearch || v.registrationNumber.toLowerCase().includes(vehSearch.toLowerCase()) || v.model.toLowerCase().includes(vehSearch.toLowerCase())
  );
  const filteredDrivers = drivers.filter(d =>
    !drvSearch || d.name.toLowerCase().includes(drvSearch.toLowerCase()) || d.licenseNumber.toLowerCase().includes(drvSearch.toLowerCase())
  );
  const filteredTrips = trips.filter(t => !tripStatusFilter || t.status === tripStatusFilter);

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d => d.status === 'Available');
  const openMaintenanceLogs = maintenanceLogs.filter(m => m.status === 'Open');

  const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={14} /> },
    { key: 'trips', label: 'Trips & Dispatch', icon: <MapPin size={14} /> },
    { key: 'vehicles', label: 'Vehicle Registry', icon: <Truck size={14} /> },
    { key: 'drivers', label: 'Drivers', icon: <Users size={14} /> },
    { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={14} /> },
    { key: 'charts', label: 'Analytics', icon: <BarChart3 size={14} /> },
  ];

  return (
    <div>
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <div className="actions-row-responsive">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={fetchAll} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={handleExportPDF} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileDown size={13} /> PDF Report
          </button>
          <a href={`${API_BASE}/api/analytics/export`} download className="btn btn-primary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileDown size={13} /> CSV Export
          </a>
        </div>
      </div>

      {/* ===================== DASHBOARD TAB ===================== */}
      {activeTab === 'dashboard' && (
        <div>
          {dataLoading ? <LoadingSpinner /> : kpi && (
            <div className="kpi-grid-responsive" style={{ marginBottom: '1.5rem' }}>
              <KPICard label="Active Vehicles" value={kpi.activeVehicles} icon={Truck} color="primary" />
              <KPICard label="Available" value={kpi.availableVehicles} icon={Truck} color="success" />
              <KPICard label="In Maintenance" value={kpi.vehiclesInMaintenance} icon={Wrench} color="warning" />
              <KPICard label="Active Trips" value={kpi.activeTrips} icon={MapPin} color="primary" />
              <KPICard label="Pending Trips" value={kpi.pendingTrips} icon={MapPin} color="warning" />
              <KPICard label="Drivers On Duty" value={kpi.driversOnDuty} icon={Users} color="success" />
              <KPICard label="Fleet Utilization" value={`${kpi.fleetUtilizationPercent}%`} color={kpi.fleetUtilizationPercent >= 70 ? 'success' : 'warning'} subtitle="Active / Total Fleet" />
            </div>
          )}

          {/* Integrated Charts in main dashboard view */}
          <div style={{ marginBottom: '1.5rem' }}>
            <ChartPanel chartData={chartData} loading={chartLoading} />
          </div>

          {/* Recent trips quick view */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Recent Trips (Top 8)</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)' }}>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Route</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Vehicle</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Driver</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.slice(0, 8).map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{t.source} → {t.destination}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{t.vehicleReg || t.vehicleId}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>{t.driverName || t.driverId}</td>
                      <td style={{ padding: '0.5rem 0.75rem' }}><StatusBadge status={t.status} size="sm" /></td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {t.status === 'Draft' && <button onClick={() => handleDispatch(t.id)} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 'auto' }}><Send size={11} /> Dispatch</button>}
                          {['Dispatched', 'En Route to Pickup', 'Loading Cargo', 'In Transit'].includes(t.status) && (
                            <button onClick={() => handleCancelTrip(t.id)} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 'auto' }}><X size={11} /> Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {trips.length === 0 && <tr><td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No trips yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TRIPS TAB ===================== */}
      {activeTab === 'trips' && (
        <div className="grid-responsive-2-right-heavy">
          {/* Create Trip form */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}><Plus size={16} /> Create Trip Draft</h3>
            <form onSubmit={handleCreateTrip}>
              <div className="form-group">
                <label className="form-label">Source Location</label>
                <input className="input-field" placeholder="Mumbai Warehouse" value={tf.source} onChange={e => setTf(p => ({ ...p, source: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Destination</label>
                <input className="input-field" placeholder="Pune Retail Outlet" value={tf.dest} onChange={e => setTf(p => ({ ...p, dest: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Available Vehicle</label>
                <select className="input-field" value={tf.vehicleId} onChange={e => setTf(p => ({ ...p, vehicleId: e.target.value }))} required>
                  <option value="">-- Choose --</option>
                  {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} · {v.model} · {v.maxLoadCapacity}kg max</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Available Driver</label>
                <select className="input-field" value={tf.driverId} onChange={e => setTf(p => ({ ...p, driverId: e.target.value }))} required>
                  <option value="">-- Choose --</option>
                  {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} · Safety: {d.safetyScore}/100</option>)}
                </select>
              </div>
              <div className="form-split-2">
                <div className="form-group">
                  <label className="form-label">Cargo Weight (kg)</label>
                  <input type="number" className="input-field" value={tf.weight} onChange={e => setTf(p => ({ ...p, weight: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Distance (km)</label>
                  <input type="number" className="input-field" value={tf.distance} onChange={e => setTf(p => ({ ...p, distance: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={api.loading}>
                {api.loading ? 'Creating...' : 'Create Draft'}
              </button>
            </form>
          </div>

          {/* Trip list */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem' }}>Trip Log ({filteredTrips.length})</strong>
              <select className="input-field" style={{ width: '150px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} value={tripStatusFilter} onChange={e => setTripStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {['Draft', 'Dispatched', 'En Route to Pickup', 'Loading Cargo', 'In Transit', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <table>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>
                  <tr><th style={{ padding: '0.5rem 1rem' }}>Route</th><th style={{ padding: '0.5rem 1rem' }}>Status</th><th style={{ padding: '0.5rem 1rem' }}>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredTrips.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{t.source} → {t.destination}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{t.vehicleReg} · {t.driverName} · {t.cargoWeight}kg</div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem' }}><StatusBadge status={t.status} size="sm" /></td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {t.status === 'Draft' && <button onClick={() => handleDispatch(t.id)} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 'auto' }}><Send size={11} /> Dispatch</button>}
                          {['Dispatched', 'En Route to Pickup', 'Loading Cargo', 'In Transit'].includes(t.status) && (
                            <button onClick={() => handleCancelTrip(t.id)} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 'auto' }}><X size={11} /> Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTrips.length === 0 && <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No trips match the filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VEHICLES TAB ===================== */}
      {activeTab === 'vehicles' && (
        <div className="grid-responsive-2-right-heavy">
          {/* Register form */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16} /> Register Vehicle</h3>
            <form onSubmit={handleRegisterVehicle}>
              <div className="form-split-2">
                <div className="form-group">
                  <label className="form-label">Plate No.</label>
                  <input className="input-field" placeholder="MH-12-PQ-1234" value={vf.reg} onChange={e => setVf(p => ({ ...p, reg: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input className="input-field" placeholder="Tata Winger 2023" value={vf.model} onChange={e => setVf(p => ({ ...p, model: e.target.value }))} required />
                </div>
              </div>
              <div className="form-split-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="input-field" value={vf.type} onChange={e => setVf(p => ({ ...p, type: e.target.value }))}>
                    <option>VAN</option><option>TRUCK</option><option>CAR</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Load (kg)</label>
                  <input type="number" className="input-field" value={vf.capacity} onChange={e => setVf(p => ({ ...p, capacity: e.target.value }))} required />
                </div>
              </div>
              <div className="form-split-2">
                <div className="form-group">
                  <label className="form-label">Odometer (km)</label>
                  <input type="number" className="input-field" value={vf.odometer} onChange={e => setVf(p => ({ ...p, odometer: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Acq. Cost (₹)</label>
                  <input type="number" className="input-field" value={vf.cost} onChange={e => setVf(p => ({ ...p, cost: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Region</label>
                <select className="input-field" value={vf.region} onChange={e => setVf(p => ({ ...p, region: e.target.value }))}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={api.loading}>{api.loading ? 'Registering...' : 'Register Vehicle'}</button>
            </form>
          </div>

          {/* Vehicle list */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem' }}>Vehicle Registry ({filteredVehicles.length})</strong>
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" style={{ padding: '0.35rem 0.5rem 0.35rem 1.8rem', fontSize: '0.8rem' }} placeholder="Search..." value={vehSearch} onChange={e => setVehSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <table>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '0.5rem 1rem' }}>Vehicle</th>
                    <th style={{ padding: '0.5rem 1rem' }}>Details</th>
                    <th style={{ padding: '0.5rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.5rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{v.registrationNumber}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.model} · {v.type}</div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Max: {v.maxLoadCapacity}kg</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Odo: {Number(v.odometer).toLocaleString('en-IN')} km</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Region: {v.region}</div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem' }}><StatusBadge status={v.status} size="sm" /></td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {v.status !== 'Retired' && v.status !== 'On Trip' && (
                            <button onClick={() => handleRetireVehicle(v)} title="Retire" className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', width: 'auto' }}>
                              <Archive size={11} />
                            </button>
                          )}
                          <button onClick={() => handleDeleteVehicle(v)} title="Delete" className="btn btn-danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', width: 'auto' }}>
                            <X size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredVehicles.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No vehicles found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DRIVERS TAB ===================== */}
      {activeTab === 'drivers' && (
        <div className="grid-responsive-2-right-heavy">
          {/* Register driver form */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16} /> Register Driver</h3>
            <form onSubmit={handleRegisterDriver}>
              <div className="form-group"><label className="form-label">Full Name</label><input className="input-field" placeholder="Ramesh Kumar" value={df.name} onChange={e => setDf(p => ({ ...p, name: e.target.value }))} required /></div>
              <div className="form-split-2">
                <div className="form-group"><label className="form-label">License No.</label><input className="input-field" placeholder="MH-0120110012345" value={df.licenseNum} onChange={e => setDf(p => ({ ...p, licenseNum: e.target.value }))} required /></div>
                <div className="form-group"><label className="form-label">Category</label><select className="input-field" value={df.licenseCat} onChange={e => setDf(p => ({ ...p, licenseCat: e.target.value }))}>{LICENSE_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">License Expiry</label><input type="date" className="input-field" value={df.licenseExp} onChange={e => setDf(p => ({ ...p, licenseExp: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Contact (+91XXXXXXXXXX)</label><input className="input-field" placeholder="+919876543210" value={df.contact} onChange={e => setDf(p => ({ ...p, contact: e.target.value }))} required /></div>
              <div className="form-split-2">
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="input-field" placeholder="driver@transitops.in" value={df.email} onChange={e => setDf(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Password</label><input type="password" className="input-field" placeholder="Min 6 chars" value={df.password} onChange={e => setDf(p => ({ ...p, password: e.target.value }))} /></div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={api.loading}>{api.loading ? 'Registering...' : 'Register Driver'}</button>
            </form>
          </div>

          {/* Driver list */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem' }}>Driver Registry ({filteredDrivers.length})</strong>
              <div style={{ position: 'relative', width: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" style={{ padding: '0.35rem 0.5rem 0.35rem 1.8rem', fontSize: '0.8rem' }} placeholder="Search..." value={drvSearch} onChange={e => setDrvSearch(e.target.value)} />
              </div>
            </div>
            <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
              <table>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>
                  <tr><th style={{ padding: '0.5rem 1rem' }}>Driver</th><th style={{ padding: '0.5rem 1rem' }}>License</th><th style={{ padding: '0.5rem 1rem' }}>Score</th><th style={{ padding: '0.5rem 1rem' }}>Status</th><th style={{ padding: '0.5rem 1rem' }}>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredDrivers.map(d => {
                    const daysLeft = Math.ceil((new Date(d.licenseExpiryDate).getTime() - Date.now()) / 86400000);
                    const expired = daysLeft <= 0;
                    const expiringSoon = daysLeft > 0 && daysLeft < 30;
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem', backgroundColor: expired ? 'rgba(211,47,47,0.05)' : 'transparent' }}>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <div style={{ fontWeight: 600 }}>{d.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.contactNumber}</div>
                        </td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{d.licenseNumber}</div>
                          <div style={{ color: expired ? 'var(--error)' : expiringSoon ? 'var(--warning)' : 'var(--text-muted)', fontSize: '0.72rem', fontWeight: expired || expiringSoon ? 700 : 400 }}>
                            Exp: {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')} {expired ? '⚠ EXPIRED' : expiringSoon ? `(${daysLeft}d)` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: d.safetyScore < 60 ? 'var(--error)' : d.safetyScore < 80 ? 'var(--warning)' : 'var(--success)' }}>{d.safetyScore}/100</span>
                        </td>
                        <td style={{ padding: '0.5rem 1rem' }}><StatusBadge status={d.status} size="sm" /></td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <button onClick={() => handleDeleteDriver(d)} className="btn btn-danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', width: 'auto' }}><X size={11} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDrivers.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No drivers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MAINTENANCE TAB ===================== */}
      {activeTab === 'maintenance' && (
        <div className="grid-responsive-2-right-heavy">
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--primary)' }}>Open Maintenance</h3>
            <form onSubmit={handleOpenMaintenance}>
              <div className="form-group">
                <label className="form-label">Vehicle (Available only)</label>
                <select className="input-field" value={mf.vehicleId} onChange={e => setMf(p => ({ ...p, vehicleId: e.target.value }))} required>
                  <option value="">-- Select --</option>
                  {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} · {v.model}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Maintenance Type</label>
                <select className="input-field" value={mf.type} onChange={e => setMf(p => ({ ...p, type: e.target.value }))}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Unscheduled">Unscheduled / Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="input-field" rows={3} placeholder="Brake pad replacement, oil change..." value={mf.desc} onChange={e => setMf(p => ({ ...p, desc: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Cost (₹)</label>
                <input type="number" className="input-field" value={mf.cost} onChange={e => setMf(p => ({ ...p, cost: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={api.loading}>{api.loading ? 'Opening...' : 'Send to Shop'}</button>
            </form>

            {/* Close Maintenance inline form */}
            {closeMf && (
              <div style={{ marginTop: '1.5rem', borderTop: '2px solid var(--primary)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary)' }}><RotateCcw size={14} style={{ display: 'inline' }} /> Close Maintenance</h4>
                <form onSubmit={handleCloseMaintenance}>
                  <div className="form-group"><label className="form-label">Final Invoice Cost (₹)</label><input type="number" className="input-field" value={closeMf.cost} onChange={e => setCloseMf(p => p ? ({ ...p, cost: e.target.value }) : null)} required /></div>
                  <div className="form-group"><label className="form-label">Closing Notes</label><input className="input-field" value={closeMf.notes} onChange={e => setCloseMf(p => p ? ({ ...p, notes: e.target.value }) : null)} /></div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={api.loading} style={{ flex: 1 }}>{api.loading ? 'Closing...' : 'Close & Release'}</button>
                    <button type="button" onClick={() => setCloseMf(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Maintenance log list */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1rem 0.75rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>Maintenance Logs ({maintenanceLogs.length})</strong>
            </div>
            <div style={{ maxHeight: '540px', overflowY: 'auto' }}>
              <table>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface)', zIndex: 1 }}>
                  <tr><th style={{ padding: '0.5rem 1rem' }}>Vehicle</th><th style={{ padding: '0.5rem 1rem' }}>Description</th><th style={{ padding: '0.5rem 1rem' }}>Cost</th><th style={{ padding: '0.5rem 1rem' }}>Status</th><th style={{ padding: '0.5rem 1rem' }}>Action</th></tr>
                </thead>
                <tbody>
                  {maintenanceLogs.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{m.registrationNumber || m.vehicleId}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{m.type} · {new Date(m.startDate).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</div>
                      </td>
                      <td style={{ padding: '0.5rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {m.finalCost != null ? `₹${Number(m.finalCost).toLocaleString('en-IN')}` : m.cost > 0 ? `~₹${Number(m.cost).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ padding: '0.5rem 1rem' }}><StatusBadge status={m.status} size="sm" /></td>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        {m.status === 'Open' && (
                          <button onClick={() => setCloseMf({ id: m.id, vehicleId: m.vehicleId, cost: '', notes: '' })} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 'auto' }}><RotateCcw size={11} /> Close</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {maintenanceLogs.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No maintenance logs.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CHARTS TAB ===================== */}
      {activeTab === 'charts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={fetchCharts} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={13} /> Refresh Charts
            </button>
          </div>
          <ChartPanel chartData={chartData} loading={chartLoading} />
        </div>
      )}
    </div>
  );
}
