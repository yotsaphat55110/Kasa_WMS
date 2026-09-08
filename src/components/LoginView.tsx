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
  const { users, login, lineConfig, liffProfile, saveUser } = useApp();

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
      const query = usernameInput.trim().toLowerCase();
      const userObj = users.find(u => 
        (u.username && u.username.toLowerCase() === query) ||
        u.employeeCode.toLowerCase() === query || 
        u.email.toLowerCase() === query
      );

      const res = login(usernameInput, passwordInput);
      setIsLoading(false);

      if (res.success) {
        setSuccessMessage(res.message);
        if (liffProfile && userObj) {
          saveUser({
            ...userObj,
            lineUserId: liffProfile.userId,
            lineDisplayName: liffProfile.displayName
          });
          setSuccessMessage(prev => prev + '\n✓ ผูกบัญชี LINE เรียบร้อยแล้ว!');
        }
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
        if (liffProfile && user) {
          saveUser({
            ...user,
            lineUserId: liffProfile.userId,
            lineDisplayName: liffProfile.displayName
          });
          setSuccessMessage(prev => prev + '\n✓ ผูกบัญชี LINE เรียบร้อยแล้ว!');
        }
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
        <div className="w-full max-w-md">
          
          {/* Login Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            
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

              {/* LINE Detection banner */}
              {liffProfile && (
                <div className="mt-4 p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">L</span>
                  <div className="text-xs">
                    <p className="font-bold text-emerald-300">พบการเข้าใช้งานผ่าน LINE</p>
                    <p className="text-emerald-100 mt-0.5">
                      คุณกำลังใช้ LINE: <strong className="font-bold text-white">{liffProfile.displayName}</strong>
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1.5 leading-normal">
                      กรุณาเข้าสู่ระบบด้วยรหัสพนักงาน/รหัสผ่านด้านล่าง เพื่อทำการผูกบัญชี LINE นี้เข้ากับโปรไฟล์พนักงานในระบบโดยอัตโนมัติ
                    </p>
                  </div>
                </div>
              )}

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

                {lineConfig?.liffId && (
                  <button
                    type="button"
                    onClick={() => {
                      import('@line/liff').then(({ default: liff }) => {
                        if (!liff.isLoggedIn()) {
                          liff.login();
                        } else {
                          liff.getProfile().then(profile => {
                            alert(`ล็อกอินด้วย LINE ในชื่อ ${profile.displayName} เรียบร้อยแล้ว`);
                          });
                        }
                      });
                    }}
                    className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black text-[10px] select-none shrink-0">L</span>
                    <span>ล็อกอินด้วย LINE (LINE Login)</span>
                  </button>
                )}
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

        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-400 relative z-10">
        © 2026 ห้างหุ้นส่วนจำกัด กาสะ พาร์ทเนอร์ชิพ (KASA Partnership Limited Partnership). All Rights Reserved.
      </footer>

    </div>
  );
};
