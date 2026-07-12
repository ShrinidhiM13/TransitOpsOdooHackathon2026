'use client';
import React from 'react';

interface TabsProps {
  tabs: { key: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div
      className="tabs-scroll-container"
      style={{
        display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)',
        marginBottom: '1.5rem', overflowX: 'auto', width: '100%',
        scrollbarWidth: 'none', msOverflowStyle: 'none'
      }}
    >
      <style>{`
        .tabs-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
