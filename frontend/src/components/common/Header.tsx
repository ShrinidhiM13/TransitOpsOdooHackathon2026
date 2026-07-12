'use client';
import React from 'react';
import { Truck, Moon, Sun, LogOut, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { UserProfile } from '@/types';

interface HeaderProps {
  user: UserProfile | null;
  isOffline: boolean;
  syncing: boolean;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
  DRIVER: 'Driver',
};

export default function Header({ user, isOffline, syncing, theme, onThemeToggle, onLogout }: HeaderProps) {
  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Truck size={24} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>TransitOps</span>
        {user?.role && (
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            {ROLE_LABELS[user.role] || user.role}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Online/Offline + Sync indicator */}
        {syncing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--warning)', fontSize: '0.78rem' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Syncing
          </div>
        ) : isOffline ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--error)', fontSize: '0.78rem' }}>
            <WifiOff size={14} /> Offline
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)', fontSize: '0.78rem' }}>
            <Wifi size={14} /> Live
          </div>
        )}

        {/* User avatar + name */}
        {user && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hide-mobile">{user.name.split(' ')[0]}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button onClick={onThemeToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Logout */}
        <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
          <LogOut size={18} />
        </button>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </header>
  );
}
