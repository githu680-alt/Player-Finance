import React from 'react';
import { PRIVATE_TABS, type PrivateTabKey } from '../../constants/ownerPrivate';

interface Props {
  activeTab: PrivateTabKey;
  onChange: (tab: PrivateTabKey) => void;
}

export default function TabBar({ activeTab, onChange }: Props) {
  return (
    <div className="px-5 pb-2">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-slate-100 p-2 shadow-sm">
        {PRIVATE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
