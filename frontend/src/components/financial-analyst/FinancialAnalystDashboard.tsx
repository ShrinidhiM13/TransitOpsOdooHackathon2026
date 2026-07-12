'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, DollarSign, Fuel, Award, BarChart3, RefreshCw,
  FileDown, ArrowUpRight, ArrowDownRight, Percent, Calendar
} from 'lucide-react';
import { Vehicle, Expense, FuelLog, KPIData, PerformanceVehicle, ChartData } from '@/types';
import { useApi, API_BASE } from '@/hooks/useApi';
import KPICard from '@/components/common/KPICard';
import Tabs from '@/components/common/Tabs';
import Alert from '@/components/common/Alert';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ChartPanel from '@/components/charts/ChartPanel';

interface Props { token: string; refreshTrigger?: number; }

export default function FinancialAnalystDashboard({ token, refreshTrigger }: Props) {
  const api = useApi(token);
  const [activeTab, setActiveTab] = useState('overview');
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [performance, setPerformance] = useState<PerformanceVehicle[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  // Filters
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [vehSearch, setVehSearch] = useState('');

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showMsg = (type: 'success' | 'error', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [rk, rp, re, rf] = await Promise.all([
      api.get('/api/analytics/kpis'),
      api.get('/api/analytics/performance'),
      api.get('/api/expenses'),
      api.get('/api/expenses/fuel-logs'),
    ]);
    if (rk) setKpi(rk.data);
    if (rp) setPerformance(rp.report.vehicles);
    if (re) setExpenses(re.expenses);
    if (rf) setFuelLogs(rf.fuelLogs);
    setLoading(false);
  }, []); // eslint-disable-line

  const fetchCharts = useCallback(async () => {
    setChartLoading(true);
    const rc = await api.get('/api/analytics/charts');
    if (rc) setChartData(rc.charts);
    setChartLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); fetchCharts(); }, [refreshTrigger]); // eslint-disable-line

  const TABS = [
    { key: 'overview', label: 'Financial Overview', icon: <TrendingUp size={14} /> },
    { key: 'roi', label: 'Vehicle ROI Report', icon: <DollarSign size={14} /> },
    { key: 'expenses', label: 'Expense Ledger', icon: <DollarSign size={14} /> },
    { key: 'fuel', label: 'Fuel Audits', icon: <Fuel size={14} /> },
    { key: 'charts', label: 'Cost Charts', icon: <BarChart3 size={14} /> },
  ];

  if (loading) return <LoadingSpinner message="Loading financial data..." />;

  // Calculate overall metrics
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + Number(f.totalCost), 0);
  const totalMaintCost = expenses.filter(e => e.category === 'Maintenance').reduce((sum, e) => sum + Number(e.amount), 0);

  const filteredExpenses = expenses.filter(e => !expenseCategoryFilter || e.category === expenseCategoryFilter);
  const filteredPerformance = performance.filter(p =>
    !vehSearch || p.registrationNumber.toLowerCase().includes(vehSearch.toLowerCase()) || p.model.toLowerCase().includes(vehSearch.toLowerCase())
  );

  return (
    <div>
      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <div className="actions-row-responsive">
        <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={fetchAll} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <a href={`${API_BASE}/api/analytics/export`} download className="btn btn-primary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <FileDown size={13} /> Export CSV
          </a>
        </div>
      </div>

      {/* ===================== OVERVIEW TAB ===================== */}
      {activeTab === 'overview' && (
        <div>
          <div className="kpi-grid-responsive" style={{ marginBottom: '1.5rem' }}>
            <KPICard label="Total Operational Expense" value={`₹${totalExpenses.toLocaleString('en-IN')}`} icon={DollarSign} color="error" subtitle="Fuel + Maintenance + Tolls + Misc" />
            <KPICard label="Fuel Expenditures" value={`₹${totalFuelCost.toLocaleString('en-IN')}`} icon={Fuel} color="warning" subtitle={`${((totalFuelCost / (totalExpenses || 1)) * 100).toFixed(1)}% of total expenses`} />
            <KPICard label="Maintenance Expenditures" value={`₹${totalMaintCost.toLocaleString('en-IN')}`} icon={TrendingUp} color="error" subtitle={`${((totalMaintCost / (totalExpenses || 1)) * 100).toFixed(1)}% of total expenses`} />
            {kpi && <KPICard label="Active Fleet Utilization" value={`${kpi.fleetUtilizationPercent}%`} color="success" />}
          </div>

          <div className="grid-responsive-2" style={{ marginBottom: '1.5rem' }}>
            {/* Quick expense breakdown */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Category Wise Distribution</div>
              <div>
                {['Fuel', 'Maintenance', 'Toll', 'Cleaning', 'Misc'].map(cat => {
                  const catTotal = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0);
                  const pct = ((catTotal / (totalExpenses || 1)) * 100).toFixed(1);
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                      <div style={{ textAlign: 'right' }}>
                        <strong className="mono">₹{catTotal.toLocaleString('en-IN')}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Expending Vehicles */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Top 5 High Expense Vehicles</div>
              <div>
                {performance.slice(0, 5).map(p => (
                  <div key={p.vehicleId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <div>
                      <strong className="mono">{p.registrationNumber}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.model} · {p.region}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong className="mono">₹{p.totalOperationalCost.toLocaleString('en-IN')}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ROI: {p.roiPercent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cost Trend & Categorical Charts */}
          <div style={{ marginBottom: '1.5rem' }}>
            <ChartPanel chartData={chartData} loading={chartLoading} />
          </div>
        </div>
      )}

      {/* ===================== VEHICLE ROI REPORT TAB ===================== */}
      {activeTab === 'roi' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem' }}>Vehicle Operating Costs & ROI Metrics</strong>
            <input
              className="input-field"
              style={{ width: '200px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
              placeholder="Search registration/model..."
              value={vehSearch}
              onChange={e => setVehSearch(e.target.value)}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr style={{ backgroundColor: 'var(--background)' }}>
                  <th style={{ padding: '0.6rem 1rem' }}>Vehicle</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Odo / Distance</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Fuel Cost</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Maint Cost</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Total Cost</th>
                  <th style={{ padding: '0.6rem 1rem' }}>ROI %</th>
                </tr>
              </thead>
              <tbody>
                {filteredPerformance.map(p => (
                  <tr key={p.vehicleId} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <strong className="mono">{p.registrationNumber}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.model}</div>
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <div>Total: {p.totalDistance.toLocaleString()} km</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Efficiency: {p.fuelEfficiencyKml} km/L</div>
                    </td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)' }}>₹{p.totalFuelCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)' }}>₹{p.totalMaintCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{p.totalOperationalCost.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: p.roiPercent < 0 ? 'var(--error)' : 'var(--success)' }}>
                        {p.roiPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredPerformance.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No performance reports.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== EXPENSE LEDGER TAB ===================== */}
      {activeTab === 'expenses' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.9rem' }}>Comprehensive Expense Ledger</strong>
            <select
              className="input-field"
              style={{ width: '150px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
              value={expenseCategoryFilter}
              onChange={e => setExpenseCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Fuel">Fuel</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Toll">Toll</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Misc">Misc</option>
            </select>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '480px' }}>
            <table>
              <thead>
                <tr style={{ backgroundColor: 'var(--background)' }}>
                  <th style={{ padding: '0.6rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Vehicle</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Description</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                    <td style={{ padding: '0.6rem 1rem' }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '0.6rem 1rem' }}>
                      <strong className="mono">{e.registrationNumber || e.vehicleId}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.driverName || 'System'}</div>
                    </td>
                    <td style={{ padding: '0.6rem 1rem' }}><span className="badge badge-info">{e.category}</span></td>
                    <td style={{ padding: '0.6rem 1rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.description}>{e.description}</td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expenses match filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== FUEL AUDITS TAB ===================== */}
      {activeTab === 'fuel' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem' }}>
            <strong style={{ fontSize: '0.9rem' }}>Fuel Log Audits & Cost Metrics</strong>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '480px' }}>
            <table>
              <thead>
                <tr style={{ backgroundColor: 'var(--background)' }}>
                  <th style={{ padding: '0.6rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Vehicle</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Driver</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Fuel (Liters)</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Rate / Liter</th>
                  <th style={{ padding: '0.6rem 1rem' }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.83rem' }}>
                    <td style={{ padding: '0.6rem 1rem' }}>{new Date(f.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '0.6rem 1rem' }}><strong className="mono">{f.registrationNumber || f.vehicleId}</strong></td>
                    <td style={{ padding: '0.6rem 1rem' }}>{f.driverName || f.driverId}</td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)' }}>{f.liters} L</td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)' }}>₹{f.costPerLiter}</td>
                    <td style={{ padding: '0.6rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{Number(f.totalCost).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {fuelLogs.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No fuel logs.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== CHARTS TAB ===================== */}
      {activeTab === 'charts' && (
        <div>
          <ChartPanel chartData={chartData} loading={chartLoading} />
        </div>
      )}
    </div>
  );
}
