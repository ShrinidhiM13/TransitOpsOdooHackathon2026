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

const BRAND_COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export default function KPICard({ label, value, icon: Icon, color = 'primary', subtitle }: KPICardProps) {
  const accentColor = BRAND_COLORS[color];

  return (
    <div
      className="card"
      style={{
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        background: 'var(--surface-solid)',
        borderRadius: '12px',
        boxShadow: 'none', // Removed heavy/cheap shadows
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* Subtle indicator dot instead of full colored borders */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          display: 'inline-block'
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)'
        }}>
          {label}
        </span>
        <div style={{
          fontSize: '1.6rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
      </div>

      {subtitle && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          marginTop: 'auto',
          paddingTop: '0.25rem',
          borderTop: '1px solid var(--border)',
          fontWeight: 400,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
