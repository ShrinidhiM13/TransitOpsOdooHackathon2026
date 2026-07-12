'use client';
import React, { useState } from 'react';
import { Truck, Moon, Sun, LogOut, Wifi, WifiOff, Loader2, ChevronDown } from 'lucide-react';
import { UserProfile, UserRole } from '@/types';

interface HeaderProps {
  user: UserProfile | null;
  simulatedRole: string | null;
  isOffline: boolean;
  syncing: boolean;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onLogout: () => void;
  onRoleChange: (role: string) => void;
}

export default function Header({
  user, simulatedRole, isOffline, syncing, theme, onThemeToggle, onLogout, onRoleChange,
}: HeaderProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const ROLE_LABELS: Record<string, string> = {
    FLEET_MANAGER: 'Fleet Manager',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst',
    DRIVER: 'Driver',
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Truck size={24} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>TransitOps</span>
        {simulatedRole && (
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{ROLE_LABELS[simulatedRole] || simulatedRole}</span>
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

        {/* Role Switcher — for non-DRIVER roles (demo/evaluation) */}
        {user && user.role !== 'DRIVER' && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.35rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border)',
                background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.78rem',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              View As <ChevronDown size={12} />
            </button>
            {roleMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: '8px', minWidth: '170px',
                zIndex: 200, boxShadow: 'var(--card-shadow)', overflow: 'hidden',
              }}>
                {(['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] as UserRole[]).map((r) => (
                  <button key={r} onClick={() => { onRoleChange(r); setRoleMenuOpen(false); }} style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 1rem',
                    background: simulatedRole === r ? 'var(--primary-light)' : 'transparent',
                    border: 'none', color: simulatedRole === r ? 'var(--primary)' : 'var(--text-primary)',
                    fontSize: '0.82rem', fontWeight: simulatedRole === r ? 700 : 400, cursor: 'pointer',
                  }}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User info */}
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
