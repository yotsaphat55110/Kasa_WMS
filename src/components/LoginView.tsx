import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Shield, 
  Lock, 
  UserCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Boxes, 
  ArrowRight,
  Sparkles,
  Building2,
  KeyRound,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, login, lineConfig } = useApp();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active Users for Quick Demo Login
  const activeUsers = (users || []).filter(u => u && u.status === 1);
  const inactiveUsers = (users || []).filter(u => u && u.status === 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!usernameInput.trim()) {
      setErrorMessage('กรุณาระบุรหัสพนักงาน หรือ อีเมลผู้ใช้งาน');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(usernameInput, passwordInput);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  const handleQuickLogin = (user: typeof activeUsers[0]) => {
    const loginKey = user.username || user.employeeCode;
    const pass = user.password || '123456';
    
    setUsernameInput(loginKey);
    setPasswordInput(pass);
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(loginKey, pass);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/50 border border-blue-400/30">
            K
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base text-white tracking-wide">
              KASA PARTNERSHIP
            </h1>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Chemical Warehouse Management System (WMS)
            </p>
          </div>
        </div>

        {lineConfig?.webhookStatus === 'CONNECTED' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 rounded-full text-[11px] text-emerald-300 font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>LINE OA Bot: Connected</span>
          </div>
        )}
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Login Card (5 cols on lg) */}
          <div className="lg:col-span-6 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            
            {/* Top accent border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold rounded-lg uppercase">
                  Secured Access v2.4
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white">
                เข้าสู่ระบบใช้งาน
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                กรอกรหัสพนักงาน หรือ อีเมล เพื่อเข้าสู่ระบบจัดการสต๊อกเคมีภัณฑ์
              </p>

              {/* Alert Feedback Messages */}
              {errorMessage && (
                <div className="mt-4 p-3.5 bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-start gap-2.5 font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mt-4 p-3.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl flex items-center gap-2.5 font-semibold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    รหัสพนักงาน / อีเมลผู้ใช้ (Employee Code / Email) *
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="เช่น EMP-001 หรือ yotsaphat55110@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-500 font-medium transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="ป้อนรหัสผ่าน (สาธิตใช้ 123456)"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-500 font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                    />
                    <span>จดจำการเข้าสู่ระบบ</span>
                  </label>
                  <span className="text-[11px] text-blue-400 font-medium">
                    ติดต่อฝ่าย IT โทร 081-551-3997
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>เข้าสู่ระบบ WMS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>SSL Encrypted Connection</span>
              </span>
              <span>KASA Partnership Ltd.</span>
            </div>

          </div>

          {/* Right Column: Quick Demo Users & Info (6 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* Quick Demo User Switcher Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs text-amber-300 uppercase tracking-wider">
                  เลือกผู้ใช้งานสาธิต (Quick Login for Testing)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                คลิกเลือกเจ้าหน้าที่ผู้ปฏิบัติงานด้านล่างเพื่อสลับบทบาทและเข้าใช้งานระบบได้ทันที:
              </p>

              <div className="space-y-2.5">
                {activeUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    className="w-full bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 p-3 rounded-2xl text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.firstName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-white group-hover:text-blue-300 transition-colors">
                            {user.firstName} {user.lastName}
                          </h4>
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-md ${
                            user.role === 'Admin' 
                              ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30' 
                              : user.role === 'Stock Manager'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-900/60 text-blue-300 border border-blue-500/30'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          User: <strong className="text-blue-300">{user.username || user.employeeCode}</strong> | Pass: <strong className="text-amber-300">{user.password || '123456'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 bg-blue-600/10 group-hover:bg-blue-600 text-blue-400 group-hover:text-white rounded-xl text-xs font-semibold transition-all shrink-0">
                      เข้าใช้งาน ➔
                    </div>
                  </button>
                ))}

                {/* Show Inactive User Demo Alert */}
                {inactiveUsers.length > 0 && inactiveUsers[0] && (
                  <div className="mt-3 p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>{inactiveUsers[0]?.firstName} {inactiveUsers[0]?.lastName} ({inactiveUsers[0]?.employeeCode})</span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800/50 rounded-md text-[10px] font-semibold">
                      ระงับใช้งาน (Inactive)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse Facilities Summary Card */}
            <div className="bg-gradient-to-br from-slate-900/80 to-blue-950/40 border border-slate-800 rounded-3xl p-5">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>คลังสินค้าและจุดจัดเก็บสารเคมี (KASA Facilities)</span>
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-slate-300 text-[11px] font-medium pt-1">
                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                  <p className="font-bold text-blue-400">WH-01</p>
                  <p className="text-[10px] text-slate-400 truncate">คลังเคมีผง</p>
                </div>
                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                  <p className="font-bold text-amber-400">WH-02</p>
                  <p className="text-[10px] text-slate-400 truncate">คลังเคมีเหลว</p>
                </div>
                <div className="p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                  <p className="font-bold text-emerald-400">WH-03</p>
                  <p className="text-[10px] text-slate-400 truncate">คลังบำบัดน้ำ</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-400 relative z-10">
        © 2026 ห้างหุ้นส่วนจำกัด กาสะ พาร์ทเนอร์ชิพ (KASA Partnership Limited Partnership). All Rights Reserved.
      </footer>

    </div>
  );
};
