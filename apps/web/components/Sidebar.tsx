'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Film,
  FolderKanban,
  History,
  ShieldCheck,
  CreditCard,
  Settings,
  Sparkles,
  Lock,
} from 'lucide-react';

interface SidebarProps {
  ownerEmail?: string;
}

export function Sidebar({ ownerEmail: initialEmail }: SidebarProps) {
  const pathname = usePathname();
  const [displayEmail, setDisplayEmail] = React.useState<string>(initialEmail || 'Admin Owner');

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data?.user?.email) {
          setDisplayEmail(json.data.user.email);
        } else if (json?.data?.authorizedOwnerEmail) {
          setDisplayEmail(json.data.authorizedOwnerEmail);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-cine-900 border-r border-cine-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Wordmark */}
      <div className="p-5 border-b border-cine-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/25 transition-all">
            <Sparkles className="w-5 h-5 text-cine-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-white tracking-tight">CineFlow</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-cine-400 uppercase tracking-widest font-medium">Private Studio</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-cine-400 uppercase">
          Studio Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cine-800 text-amber-400 border border-cine-700 shadow-sm'
                  : 'text-cine-300 hover:text-white hover:bg-cine-850'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-cine-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Authorized Owner Guard Badge */}
      <div className="p-3 border-t border-cine-800">
        <div className="p-3 rounded-xl bg-cine-850 border border-cine-800">
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Private Access
            </span>
          </div>
          <p className="text-xs text-white font-medium truncate" title={displayEmail}>
            {displayEmail}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-cine-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authorized Personal Mode</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
