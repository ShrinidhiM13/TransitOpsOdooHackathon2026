'use client';
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'error';
  subtitle?: string;
}

const COLOR_CONFIG = {
  primary: {
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.2)'
  },
  success: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.2)'
  },
  warning: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.2)'
  },
  error: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.2)'
  },
};

export default function KPICard({ label, value, icon: Icon, color = 'primary', subtitle }: KPICardProps) {
  const conf = COLOR_CONFIG[color];
  return (
    <div
      className="card"
      style={{
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${conf.color}`,
        padding: '1.25rem 1.5rem',
        background: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: conf.bg,
            color: conf.color,
            border: `1px solid ${conf.border}`
          }}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 500 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
