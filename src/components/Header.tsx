import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Globe, 
  UserCheck, 
  PlusCircle, 
  MinusCircle, 
  MessageSquare, 
  Check, 
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Search,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  onOpenInboundModal: () => void;
  onOpenOutboundModal: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInboundModal,
  onOpenOutboundModal,
  searchTerm,
  setSearchTerm
}) => {
  const { 
    language, 
    setLanguage, 
    t, 
    users, 
    currentUser, 
    setCurrentUser, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    lineConfig,
    setActiveTab,
    logout
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
      
      {/* Mobile Brand / Search toggle */}
      <div className="flex items-center gap-3 md:hidden">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-2xs">
          K
        </div>
        <span className="font-bold text-slate-900 text-sm">{t.appName}</span>
      </div>

      {/* Center: Search Input */}
      <div className="flex-1 max-w-sm sm:max-w-md mx-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.header.searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Quick Action Buttons */}
        <button
          onClick={onOpenInboundModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium rounded-md shadow-2xs transition-all"
          title={t.header.quickInbound}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{t.header.quickInbound}</span>
        </button>

        <button
          onClick={onOpenOutboundModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium rounded-md shadow-2xs transition-all"
          title={t.header.quickOutbound}
        >
          <MinusCircle className="w-3.5 h-3.5" />
          <span>{t.header.quickOutbound}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-medium text-slate-700 transition-all"
          title="Switch Language / เปลี่ยนภาษา"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span className="uppercase font-bold text-blue-700 text-[11px]">{language}</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all"
            title={t.header.notifications}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-slate-800">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-xs text-slate-900">{t.header.notifications}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {notifications.length}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {t.header.markAllRead}
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">ไม่มีการแจ้งเตือน</p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${
                        !notif.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === 'INBOUND' && (
                          <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {notif.type === 'OUTBOUND' && (
                          <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                        {(notif.type === 'LOW_STOCK' || notif.type === 'DAMAGED_STOCK') && (
                          <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile / Operator Selector */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 border border-slate-200 hover:bg-slate-50 rounded-md transition-all"
            title="ผู้ใช้งานระบบปัจจุบัน"
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.firstName}
              className="w-6 h-6 rounded-full object-cover border border-slate-300"
            />
            <div className="hidden lg:block text-left text-xs">
              <span className="font-semibold text-slate-900 block leading-none">
                {currentUser.firstName} {currentUser.lastName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentUser.role}
              </span>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 text-slate-800">
              <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ผู้ปฏิบัติงาน (Operator)
              </p>
              <div className="mt-1 space-y-1">
                {users.filter(u => u.status === 1).map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      u.id === currentUser.id
                        ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-100'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <div className="text-left">
                        <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.employeeCode}</p>
                      </div>
                    </div>
                    {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>ออกจากระบบ (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
