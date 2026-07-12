'use client';
import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_COLORS: Record<string, string> = {
  Available: 'badge-success',
  'On Trip': 'badge-info',
  'In Shop': 'badge-warning',
  Retired: 'badge-muted',
  Suspended: 'badge-danger',
  'Off Duty': 'badge-muted',
  Draft: 'badge-warning',
  Dispatched: 'badge-info',
  'En Route to Pickup': 'badge-info',
  'Loading Cargo': 'badge-info',
  'In Transit': 'badge-info',
  Completed: 'badge-success',
  Cancelled: 'badge-danger',
  Open: 'badge-warning',
  Closed: 'badge-success',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || 'badge-info';
  const badgeStyle: React.CSSProperties = size === 'sm'
    ? { fontSize: '0.7rem', padding: '0.15rem 0.4rem' }
    : {};

  let style: React.CSSProperties = { ...badgeStyle };
  if (colorClass === 'badge-danger') {
    style = { ...style, backgroundColor: 'rgba(211,47,47,0.15)', color: 'var(--error)', border: '1px solid var(--error)' };
  } else if (colorClass === 'badge-muted') {
    style = { ...style, backgroundColor: 'rgba(159,160,181,0.2)', color: 'var(--text-muted)', border: '1px solid var(--border)' };
  }

  return (
    <span className={`badge ${colorClass}`} style={style}>
      {status}
    </span>
  );
}
