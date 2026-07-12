'use client';
import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const CONFIG: Record<AlertType, { icon: any; bg: string; border: string; text: string }> = {
  success: { icon: CheckCircle, bg: 'rgba(46,125,50,0.1)', border: 'var(--success)', text: 'var(--success)' },
  error: { icon: AlertTriangle, bg: 'rgba(211,47,47,0.1)', border: 'var(--error)', text: 'var(--error)' },
  warning: { icon: AlertTriangle, bg: 'rgba(245,124,0,0.1)', border: 'var(--warning)', text: 'var(--warning)' },
  info: { icon: Info, bg: 'var(--primary-light)', border: 'var(--primary)', text: 'var(--primary)' },
};

export default function Alert({ type, message, onClose }: AlertProps) {
  const { icon: Icon, bg, border, text } = CONFIG[type];
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem',
      backgroundColor: bg, border: `1px solid ${border}`, color: text,
      fontSize: '0.875rem', fontWeight: 500,
    }}>
      <Icon size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: text, cursor: 'pointer', padding: '0', display: 'flex' }}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
