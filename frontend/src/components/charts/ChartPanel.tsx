'use client';
import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChartData } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ChartPanelProps {
  chartData: ChartData | null;
  loading?: boolean;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
      {children}
    </div>
  );
}

const customTooltipStyle = {
  backgroundColor: 'var(--surface-solid)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  fontSize: '13px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
  color: 'var(--text-primary)',
  padding: '8px 12px'
};

export function TripsBarChart({ data }: { data: ChartData['tripsPerDay'] }) {
  if (!data?.length) return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>No trip data in last 14 days.</div>;
  const formatted = data.map(d => ({ ...d, date: d.date.slice(5) }));
  return (
    <div className="card">
      <SectionTitle>Trip Volume – Last 14 Days</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={customTooltipStyle} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpensePieChart({ data }: { data: ChartData['expensesByCategory'] }) {
  if (!data?.length) return (
    <div className="card">
      <SectionTitle>Expense Breakdown by Category</SectionTitle>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>No expense data yet.</div>
    </div>
  );
  const total = data.reduce((sum, d) => sum + Number(d.total), 0);
  return (
    <div className="card">
      <SectionTitle>Expense Breakdown by Category</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={3}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
              contentStyle={customTooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, minWidth: '150px' }}>
          {data.map((d, i) => (
            <div key={d.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{d.category}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>₹{Number(d.total).toLocaleString('en-IN')}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: '0.35rem' }}>{((Number(d.total) / total) * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.82rem', fontWeight: 700, marginTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
            <span>Total</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>₹{total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FuelEfficiencyChart({ data }: { data: ChartData['fuelEfficiency'] }) {
  if (!data?.length) return null;
  const filtered = data.filter(d => d.efficiencyKmL > 0);
  if (!filtered.length) return (
    <div className="card">
      <SectionTitle>Fuel Efficiency by Vehicle (km/L)</SectionTitle>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>Complete at least one trip to see fuel efficiency data.</div>
    </div>
  );
  return (
    <div className="card">
      <SectionTitle>Fuel Efficiency by Vehicle (km/L)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={filtered} layout="vertical" barSize={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} axisLine={false} tickLine={false} unit=" km/L" />
          <YAxis type="category" dataKey="registrationNumber" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
          <Tooltip
            formatter={(val: any) => [`${val} km/L`, 'Efficiency']}
            contentStyle={customTooltipStyle}
          />
          <Bar dataKey="efficiencyKmL" name="km/L" radius={[0, 4, 4, 0]}>
            {filtered.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyCostsChart({ data }: { data: ChartData['monthlyCosts'] }) {
  if (!data?.length) return null;
  const formatted = data.map(d => ({ ...d, month: d.month.slice(2) }));
  return (
    <div className="card">
      <SectionTitle>Monthly Operational Cost Trend (₹)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
            contentStyle={customTooltipStyle}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Line type="monotone" dataKey="total" name="Total" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-solid)' }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="fuelCost" name="Fuel" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="maintCost" name="Maintenance" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VehicleStatusPieChart({ data }: { data: ChartData['vehicleStatusDist'] }) {
  if (!data?.length) return null;
  const STATUS_COLORS: Record<string, string> = {
    Available: '#10b981', 'On Trip': '#3b82f6', 'In Shop': '#f59e0b', Retired: '#64748b',
  };
  return (
    <div className="card">
      <SectionTitle>Fleet Status Distribution</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={60} innerRadius={40} paddingAngle={4}>
              {data.map((d) => <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#ccc'} />)}
            </Pie>
            <Tooltip contentStyle={customTooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1 }}>
          {data.map(d => (
            <div key={d.status} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS[d.status] || '#ccc' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{d.status}</span>
              </div>
              <strong style={{ color: 'var(--text-primary)' }}>{d.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SafetyScoreChart({ data }: { data: ChartData['driverSafetyScores'] }) {
  if (!data?.length) return null;
  const formatted = data.map(d => ({
    name: d.name.split(' ')[0],
    score: Number(d.safetyScore),
    status: d.status,
  }));
  return (
    <div className="card">
      <SectionTitle>Driver Safety Scores (Lowest First)</SectionTitle>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted} layout="vertical" barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} axisLine={false} tickLine={false} unit="%" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} axisLine={false} tickLine={false} width={65} />
          <Tooltip
            formatter={(val: any) => [`${val}%`, 'Safety Score']}
            contentStyle={customTooltipStyle}
          />
          <Bar dataKey="score" name="Safety Score" radius={[0, 4, 4, 0]}>
            {formatted.map((d, i) => (
              <Cell key={i} fill={d.score < 60 ? '#ef4444' : d.score < 80 ? '#f59e0b' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ChartPanel({ chartData, loading }: ChartPanelProps) {
  if (loading) return <LoadingSpinner message="Loading analytics data..." />;
  if (!chartData) return null;

  return (
    <div>
      <div className="grid-responsive-2">
        <TripsBarChart data={chartData.tripsPerDay} />
        <ExpensePieChart data={chartData.expensesByCategory} />
        <FuelEfficiencyChart data={chartData.fuelEfficiency} />
        <MonthlyCostsChart data={chartData.monthlyCosts} />
        <VehicleStatusPieChart data={chartData.vehicleStatusDist} />
        <SafetyScoreChart data={chartData.driverSafetyScores} />
      </div>
    </div>
  );
}
