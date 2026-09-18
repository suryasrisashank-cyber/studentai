'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, RefreshCw, Smartphone, Monitor, Tablet, Globe } from 'lucide-react';

interface UserSessionItem {
  id: string;
  anonymousId: string;
  deviceCategory: string;
  firstSeen: string;
  lastActiveAt: string;
  toolsUsed: number;
  aiRequests: number;
  isActiveNow: boolean;
  sessionStatus?: string;
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserSessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async (p = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${p}&pageSize=15`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const DeviceIcon = ({ device }: { device: string }) => {
    const d = device.toLowerCase();
    if (d.includes('mobile')) return <Smartphone className="w-4 h-4 text-slate-400" />;
    if (d.includes('tablet')) return <Tablet className="w-4 h-4 text-slate-400" />;
    return <Monitor className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Users & Anonymous Sessions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Privacy-conscious session tracking. Public users do not require accounts to access tools.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchUsers(page)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Privacy Guarantee Alert */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-300 text-xs flex items-start gap-3">
        <Shield className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
        <p className="leading-relaxed">
          <strong>Privacy Architecture:</strong> To uphold student anonymity, sessions are identified via an ephemeral random token. IP addresses, input documents, calculations, and academic scores are never recorded into user records.
        </p>
      </div>

      {/* Sessions Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Recorded Sessions:</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">{total}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading user sessions...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No sessions recorded yet. Active sessions will appear here as users open the platform.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Anonymous ID</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">Tools Used</th>
                  <th className="py-3 px-4">AI Queries</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">First Seen</th>
                  <th className="py-3 px-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-900 dark:text-white font-semibold">
                      {item.anonymousId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 capitalize">
                        <DeviceIcon device={item.deviceCategory} />
                        <span>{item.deviceCategory}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.toolsUsed ?? 0}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-violet-600 dark:text-violet-400">
                      {item.aiRequests ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      {item.isActiveNow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active Now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Idle
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.firstSeen).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.lastActiveAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
