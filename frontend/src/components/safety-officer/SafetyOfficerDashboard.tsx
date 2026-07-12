'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Users, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';
import { DriverProfile, SafetyReport, ChartData, KPIData } from '@/types';
import { useApi } from '@/hooks/useApi';
import KPICard from '@/components/common/KPICard';
import StatusBadge from '@/components/common/StatusBadge';
import Tabs from '@/components/common/Tabs';
import Alert from '@/components/common/Alert';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { SafetyScoreChart } from '@/components/charts/ChartPanel';

interface Props { token: string; }

export default function SafetyOfficerDashboard({ token }: Props) {
  const api = useApi(token);
  const [activeTab, setActiveTab] = useState('overview');
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingScoreValue, setEditingScoreValue] = useState<string>('');
  const showMsg = (type: 'success' | 'error', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [rs, rd, rk, rc] = await Promise.all([
      api.get('/api/analytics/safety'),
      api.get('/api/drivers'),
      api.get('/api/analytics/kpis'),
      api.get('/api/analytics/charts'),
    ]);
    if (rs) setSafetyReport(rs.safetyReport);
    if (rd) setDrivers(rd.drivers);
    if (rk) setKpi(rk.data);
    if (rc) setChartData(rc.charts);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const toggleSuspension = async (driver: DriverProfile) => {
    const nextStatus = driver.status === 'Suspended' ? 'Available' : 'Suspended';
    const action = nextStatus === 'Suspended' ? 'Suspend' : 'Reinstate';
    if (!confirm(`${action} driver ${driver.name}?`)) return;
    const res = await api.put(`/api/drivers/${driver.id}`, { status: nextStatus });
    if (res) { showMsg('success', `${driver.name} is now ${nextStatus}.`); fetchAll(); }
    else showMsg('error', api.error || 'Failed to update driver status');
  };

  const updateSafetyScore = async (driver: DriverProfile, newScore: number) => {
    const res = await api.put(`/api/drivers/${driver.id}`, { safetyScore: newScore });
    if (res) { showMsg('success', `Safety score updated for ${driver.name}`); fetchAll(); }
    else showMsg('error', api.error || 'Failed to update score');
  };

  const TABS = [
    { key: 'overview', label: 'Safety Overview', icon: <ShieldAlert size={14} /> },
    { key: 'drivers', label: 'Driver Audit', icon: <Users size={14} /> },
    { key: 'charts', label: 'Score Analytics', icon: <BarChart3 size={14} /> },
  ];

  if (loading) return <LoadingSpinner message="Loading safety data..." />;

  const stats = safetyReport?.stats;

  return (
    <div>
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <div className="actions-row-responsive">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <button onClick={fetchAll} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ===================== OVERVIEW TAB ===================== */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* KPI Grid */}
          <div className="kpi-grid-responsive" style={{ marginBottom: '1.5rem' }}>
            <KPICard label="Total Drivers" value={stats.totalDrivers} icon={Users} />
            <KPICard label="Avg Safety Score" value={`${stats.avgSafetyScore}/100`} icon={TrendingUp} color={stats.avgSafetyScore >= 80 ? 'success' : stats.avgSafetyScore >= 60 ? 'warning' : 'error'} />
            <KPICard label="Active Drivers" value={stats.activeDrivers} icon={CheckCircle} color="success" />
            <KPICard label="Expired Licenses" value={stats.expiredLicensesCount} icon={AlertTriangle} color={stats.expiredLicensesCount > 0 ? 'error' : 'success'} subtitle="Action required" />
            <KPICard label="Expiring Soon" value={stats.expiringLicensesCount} icon={AlertTriangle} color={stats.expiringLicensesCount > 0 ? 'warning' : 'success'} subtitle="< 30 days" />
            <KPICard label="Suspended" value={stats.suspendedCount} icon={ShieldAlert} color={stats.suspendedCount > 0 ? 'error' : 'success'} />
            <KPICard label="Low Safety Score" value={stats.lowSafetyCount} icon={AlertTriangle} color={stats.lowSafetyCount > 0 ? 'error' : 'success'} subtitle="Score < 60" />
          </div>

          {/* Critical Alerts Section */}
          {(safetyReport?.expiredLicenses.length > 0 || safetyReport?.suspendedDrivers.length > 0 || safetyReport?.lowSafetyDrivers.length > 0) && (
            <div className="compliance-banner">
              <ShieldAlert size={22} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700 }}>Compliance Action Required</div>
                {safetyReport.expiredLicenses.length > 0 && <div>• {safetyReport.expiredLicenses.length} driver(s) with expired licenses must be suspended immediately</div>}
                {safetyReport.lowSafetyDrivers.length > 0 && <div>• {safetyReport.lowSafetyDrivers.length} driver(s) with critically low safety scores (below 60%)</div>}
                {safetyReport.suspendedDrivers.length > 0 && <div>• {safetyReport.suspendedDrivers.length} driver(s) currently suspended</div>}
              </div>
            </div>
          )}

          {/* Compliance Cards */}
          <div className="grid-responsive-2">
            {/* Expired Licenses */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--error)' }} />
                <strong style={{ fontSize: '0.88rem', color: 'var(--error)' }}>Expired Licenses ({safetyReport?.expiredLicenses.length})</strong>
              </div>
              {safetyReport?.expiredLicenses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>✓ All licenses valid</p>
              ) : safetyReport?.expiredLicenses.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{d.licenseNumber} — Exp: {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}</div>
                  </div>
                  <button onClick={() => toggleSuspension(d)} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 'auto' }}>
                    {d.status === 'Suspended' ? 'Reinstate' : 'Suspend'}
                  </button>
                </div>
              ))}
            </div>

            {/* Expiring Soon */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                <strong style={{ fontSize: '0.88rem', color: 'var(--warning)' }}>Expiring in 30 Days ({safetyReport?.expiringLicenses.length})</strong>
              </div>
              {safetyReport?.expiringLicenses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>✓ No licenses expiring soon</p>
              ) : safetyReport?.expiringLicenses.map(d => {
                const daysLeft = Math.ceil((new Date(d.licenseExpiryDate).getTime() - Date.now()) / 86400000);
                return (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>{daysLeft} days left — {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>{daysLeft}d</span>
                  </div>
                );
              })}
            </div>

            {/* Low Safety Drivers */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <TrendingUp size={16} style={{ color: 'var(--error)' }} />
                <strong style={{ fontSize: '0.88rem', color: 'var(--error)' }}>Low Safety Score (&lt;60) ({safetyReport?.lowSafetyDrivers.length})</strong>
              </div>
              {safetyReport?.lowSafetyDrivers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>✓ All drivers above threshold</p>
              ) : safetyReport?.lowSafetyDrivers.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ color: 'var(--error)', fontSize: '0.75rem', fontWeight: 700 }}>Score: {d.safetyScore}/100</div>
                  </div>
                  <button onClick={() => toggleSuspension(d)} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', width: 'auto' }}>
                    {d.status === 'Suspended' ? 'Reinstate' : 'Suspend'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Integrated safety charts */}
          {chartData && (
            <div style={{ marginTop: '1.5rem' }}>
              <SafetyScoreChart data={chartData.driverSafetyScores} />
            </div>
          )}
        </div>
      )}
      {/* ===================== DRIVER AUDIT TAB ===================== */}
      {activeTab === 'drivers' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem' }}>
            <strong>Full Driver Compliance Audit ({drivers.length} drivers)</strong>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr style={{ backgroundColor: 'var(--background)' }}>
                  <th style={{ padding: '0.6rem 1rem' }}>Driver</th>
                  <th style={{ padding: '0.6rem 1rem' }}>License</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Expiry</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Safety Score</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const daysLeft = Math.ceil((new Date(d.licenseExpiryDate).getTime() - Date.now()) / 86400000);
                  const expired = daysLeft <= 0;
                  const expiringSoon = daysLeft > 0 && daysLeft < 30;
                  const isEditing = editingDriverId === d.id;
                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: expired ? 'rgba(211,47,47,0.04)' : 'transparent' }}>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.contactNumber}</div>
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {d.licenseNumber}<br />
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: '0.72rem' }}>{d.licenseCategory}</span>
                      </td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <div style={{ color: expired ? 'var(--error)' : expiringSoon ? 'var(--warning)' : 'var(--text-primary)', fontWeight: expired || expiringSoon ? 700 : 400 }}>
                          {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.72rem' }}>
                          {expired ? <span style={{ color: 'var(--error)' }}>⚠ EXPIRED</span> : expiringSoon ? <span style={{ color: 'var(--warning)' }}>{daysLeft}d left</span> : <span style={{ color: 'var(--success)' }}>Valid</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            <input type="number" min={0} max={100} className="input-field" style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.8rem' }} value={editingScoreValue} onChange={e => setEditingScoreValue(e.target.value)} />
                            <button onClick={() => { updateSafetyScore(d, parseFloat(editingScoreValue)); setEditingDriverId(null); }} className="btn btn-primary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', width: 'auto' }}>✓</button>
                            <button onClick={() => setEditingDriverId(null)} className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', width: 'auto' }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: d.safetyScore < 60 ? 'var(--error)' : d.safetyScore < 80 ? 'var(--warning)' : 'var(--success)' }}>{d.safetyScore}%</span>
                            <button onClick={() => { setEditingDriverId(d.id); setEditingScoreValue(String(d.safetyScore)); }} className="btn btn-secondary" style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem', width: 'auto' }}>Edit</button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.6rem 1rem' }}><StatusBadge status={d.status} size="sm" /></td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <button
                          onClick={() => toggleSuspension(d)}
                          className={`btn ${d.status === 'Suspended' ? 'btn-secondary' : 'btn-danger'}`}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', width: 'auto' }}
                          disabled={d.status === 'On Trip'}
                        >
                          {d.status === 'Suspended' ? 'Reinstate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {drivers.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No drivers found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== CHARTS TAB ===================== */}
      {activeTab === 'charts' && (
        <div>
          {chartData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem' }}>
              <SafetyScoreChart data={chartData.driverSafetyScores} />
            </div>
          ) : <LoadingSpinner />}
        </div>
      )}
    </div>
  );
}
