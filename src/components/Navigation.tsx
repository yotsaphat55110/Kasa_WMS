import React from 'react';
import { useApp } from '../context/AppContext';
import { ViewTab } from '../types';
import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Boxes, 
  MapPin,
  Users, 
  FileText, 
  MessageSquare, 
  BarChart3,
  Database 
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, t, notifications, inboundRecords, outboundRecords, lineConfig, googleSheetsConfig } = useApp();

  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const navItems: Array<{
    id: ViewTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
  }> = [
    {
      id: 'inventory',
      label: t.nav.inventory,
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'inbound',
      label: t.nav.inbound,
      icon: <ArrowDownLeft className="w-4 h-4 text-emerald-600" />,
      badge: inboundRecords.length > 0 ? inboundRecords.length : undefined
    },
    {
      id: 'outbound',
      label: t.nav.outbound,
      icon: <ArrowUpRight className="w-4 h-4 text-sky-600" />,
      badge: outboundRecords.length > 0 ? outboundRecords.length : undefined
    },
    {
      id: 'catalog',
      label: t.nav.catalog,
      icon: <Boxes className="w-4 h-4" />,
    },
    {
      id: 'zones',
      label: t.nav.zones,
      icon: <MapPin className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'users',
      label: t.nav.users,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'audit-log',
      label: t.nav.auditLog,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'line-oa',
      label: t.nav.lineOa,
      icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
      badge: unreadNotifs > 0 ? unreadNotifs : undefined
    },
    {
      id: 'reports',
      label: t.nav.reports,
      icon: <BarChart3 className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'database',
      label: t.nav.database,
      icon: <Database className="w-4 h-4 text-teal-600" />,
      badge: googleSheetsConfig.syncStatus === 'CONNECTED' ? 'Cloud' : undefined
    }
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-60 lg:w-64 bg-white border-r border-slate-200 flex-col shrink-0 h-screen sticky top-0 z-40">
        <div className="p-5 flex-1 flex flex-col min-h-0">
          
          {/* Brand Title */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-2xs shrink-0">
              K
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">
                WMS Central
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                KASA Chemical Ltd.
              </p>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label || item.id}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* LINE OA Widget Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">
                LINE OA Connected
              </span>
            </div>
            <p className="text-[11px] text-green-700 font-medium truncate">
              Bot Active: <span className="font-semibold">{lineConfig.lineBotGroupId || 'Logistics_Group'}</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  isActive
                    ? 'text-blue-700 bg-blue-50 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[60px] mt-0.5">{(item.label || item.id).split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
