import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleSheetsScriptCode';
import { testGoogleSheetsConnection } from '../services/googleSheetsService';
import { googleSignIn, getAccessToken, logoutGoogle, initAuth } from '../services/googleAuthService';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Database,
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  Code,
  Sparkles,
  Info,
  Clock,
  Layers,
  ShieldCheck,
  Zap,
  PlusCircle,
  LogIn,
  LogOut,
  TableProperties
} from 'lucide-react';

export const GoogleSheetsDatabaseView: React.FC = () => {
  const {
    products,
    inventory,
    inboundRecords,
    outboundRecords,
    googleSheetsConfig,
    updateGoogleSheetsConfig,
    syncToGoogleSheets,
    fetchFromGoogleSheets,
    createAndPopulateGoogleSheetDirect,
    fetchDirectFromGoogleSheet
  } = useApp();

  // Firebase Auth state for direct Workspace Google API
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [hasGoogleToken, setHasGoogleToken] = useState<boolean>(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);

  // Manual URL config state (Apps Script mode)
  const [inputUrl, setInputUrl] = useState(googleSheetsConfig.webAppUrl || '');
  const [sheetUrl, setSheetUrl] = useState(googleSheetsConfig.spreadsheetUrl || '');
  const [autoSync, setAutoSync] = useState(googleSheetsConfig.autoSync ?? true);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; title?: string } | null>(null);
  
  // Direct creation state
  const [isCreatingDirect, setIsCreatingDirect] = useState(false);
  const [isDirectSyncing, setIsDirectSyncing] = useState(false);

  const [isSyncingUp, setIsSyncingUp] = useState(false);
  const [isFetchingDown, setIsFetchingDown] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string; link?: string } | null>(null);
  
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasGoogleToken(!!token);
      },
      () => {
        setGoogleUser(null);
        setHasGoogleToken(false);
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningInGoogle(true);
    setActionMessage(null);
    try {
      const res = await googleSignIn();
      setGoogleUser(res.user);
      setHasGoogleToken(true);
      setActionMessage({
        type: 'success',
        text: `เชื่อมต่อบัญชี Google (${res.user.email}) สำเร็จ! ตอนนี้คุณสามารถกดปุ่ม "สร้าง Google Sheets อัตโนมัติ" ได้ทันที`
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `ไม่สามารถเข้าสู่ระบบ Google ได้: ${err.message || 'เกิดข้อผิดพลาด'}`
      });
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setHasGoogleToken(false);
  };

  /**
   * 1-Click: Create Google Sheet & populate all current data automatically
   */
  const handleAutoCreateGoogleSheet = async () => {
    setIsCreatingDirect(true);
    setActionMessage(null);

    const res = await createAndPopulateGoogleSheetDirect('KASA WMS - ระบบสต๊อกสินค้าเคมีภัณฑ์');
    setIsCreatingDirect(false);

    if (res.success) {
      setSheetUrl(res.sheetUrl || '');
      setActionMessage({
        type: 'success',
        text: `สร้างไฟล์ Google Sheets และใส่ข้อมูลสินค้า (${products.length} รายการ), สต๊อก (${inventory.length} จุด), รับเข้า (${inboundRecords.length}) และส่งออก (${outboundRecords.length}) ให้เรียบร้อยแล้ว!`,
        link: res.sheetUrl
      });
    } else {
      setActionMessage({
        type: 'error',
        text: res.message
      });
    }
  };

  /**
   * Direct fetch from Google Sheet API
   */
  const handleDirectFetch = async () => {
    setIsDirectSyncing(true);
    setActionMessage(null);
    const res = await fetchDirectFromGoogleSheet();
    setIsDirectSyncing(false);
    if (res.success) {
      setActionMessage({
        type: 'success',
        text: res.message
      });
    } else {
      setActionMessage({
        type: 'error',
        text: res.message
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2500);
  };

  const handleSaveAndTest = async () => {
    if (!inputUrl.trim()) {
      setTestResult({ success: false, message: 'กรุณาระบุ Web App URL ของ Google Apps Script' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setActionMessage(null);

    try {
      const res = await testGoogleSheetsConnection(inputUrl.trim());
      setTestResult(res);
      updateGoogleSheetsConfig({
        webAppUrl: inputUrl.trim(),
        spreadsheetUrl: sheetUrl.trim(),
        autoSync: autoSync,
        syncStatus: 'CONNECTED',
        lastSyncTime: new Date().toISOString()
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'ไม่สามารถติดต่อ Google Apps Script URL นี้ได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง (Who has access: Anyone)'
      });
      updateGoogleSheetsConfig({
        webAppUrl: inputUrl.trim(),
        spreadsheetUrl: sheetUrl.trim(),
        autoSync: autoSync,
        syncStatus: 'ERROR'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUploadAllToSheets = async () => {
    if (!googleSheetsConfig.webAppUrl && !inputUrl.trim()) {
      setActionMessage({ type: 'error', text: 'กรุณาระบุ Web App URL และทดสอบการเชื่อมต่อก่อน' });
      return;
    }

    if (inputUrl.trim() !== googleSheetsConfig.webAppUrl) {
      updateGoogleSheetsConfig({ webAppUrl: inputUrl.trim() });
    }

    setIsSyncingUp(true);
    setActionMessage(null);

    const res = await syncToGoogleSheets();
    setIsSyncingUp(false);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
  };

  const handleFetchAllFromSheets = async () => {
    if (!googleSheetsConfig.webAppUrl && !inputUrl.trim()) {
      setActionMessage({ type: 'error', text: 'กรุณาระบุ Web App URL ก่อน' });
      return;
    }

    if (inputUrl.trim() !== googleSheetsConfig.webAppUrl) {
      updateGoogleSheetsConfig({ webAppUrl: inputUrl.trim() });
    }

    setIsFetchingDown(true);
    setActionMessage(null);

    const res = await fetchFromGoogleSheets();
    setIsFetchingDown(false);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
  };

  const isConnected = (googleSheetsConfig.syncStatus === 'CONNECTED' && (!!googleSheetsConfig.spreadsheetId || !!googleSheetsConfig.webAppUrl));
  const effectiveSheetUrl = googleSheetsConfig.spreadsheetUrl || sheetUrl;

  return (
    <div id="google-sheets-database-view" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets as Cloud Database</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-400" />
              สร้างและเชื่อมต่อ Google Sheets Database
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              ระบบเชื่อมต่อ Google Drive & Google Sheets API โดยตรง สามารถกดคลิกเดียวสร้างไฟล์ชีตบนบัญชี Google ของคุณ พร้อมใส่ข้อมูลสินค้าและสต๊อกให้ครบถ้วนทันที
            </p>
          </div>

          {/* Connection Status Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:p-5 flex flex-col items-start min-w-[240px]">
            <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-1">
              สถานะการเชื่อมต่อ
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-bold text-base text-white">
                {isConnected ? 'เชื่อมต่อฐานข้อมูลแล้ว' : 'รอการสร้าง/เชื่อมต่อ'}
              </span>
            </div>
            {googleSheetsConfig.lastSyncTime && (
              <div className="flex items-center gap-1 text-xs text-emerald-200/90 mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>ซิงค์ล่าสุด: {new Date(googleSheetsConfig.lastSyncTime).toLocaleTimeString('th-TH')}</span>
              </div>
            )}
            {effectiveSheetUrl && (
              <a
                href={effectiveSheetUrl}
                target="_blank"
                rel="noreferrer"
                id="open-google-sheet-top-link"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white underline underline-offset-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                เปิดดูตารางบน Google Sheets
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Action Notifications */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <span>{actionMessage.text}</span>
              {actionMessage.link && (
                <div className="mt-1">
                  <a
                    href={actionMessage.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                  >
                    คลิกเพื่อเปิดดูไฟล์ Google Sheets ที่เพิ่งสร้างทันที &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold px-2 py-1 self-end sm:self-center"
          >
            ปิด
          </button>
        </div>
      )}

      {/* 🌟 FEATURE 1: 1-CLICK INSTANT GOOGLE SHEETS CREATION (Google Workspace API) */}
      <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 rounded-2xl border-2 border-emerald-300 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              แนะนำ (สร้างไฟล์และใส่ข้อมูลให้ทันที)
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TableProperties className="w-6 h-6 text-emerald-700" />
              สร้าง Google Sheet พร้อมใส่ข้อมูลสต๊อกทั้งหมดลงชีต (คลิกเดียว)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              เชื่อมต่อ Google Account ของคุณ แล้วระบบจะสร้าง Spreadsheet แยก 4 แท็บ (Products, Inventory, Inbound, Outbound) พร้อมคัดลอกข้อมูลทั้งหมดให้เสร็จสรรพ
            </p>
          </div>

          {/* Google Account Status Badge / Sign-in */}
          <div className="flex items-center gap-2">
            {googleUser ? (
              <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google User'}
                    className="w-7 h-7 rounded-full border border-emerald-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {googleUser.email?.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {googleUser.displayName || 'Google User'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                    {googleUser.email}
                  </p>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  title="ออกจากระบบ Google"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningInGoogle}
                id="sign-in-google-btn"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-sm transition-all hover:shadow"
              >
                {/* Official Google G SVG */}
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningInGoogle ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Panel for Direct Sheet Creation */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block font-medium">รายการสินค้า</span>
                <span className="text-lg font-extrabold text-emerald-800">{products.length}</span>
                <span className="text-[10px] text-slate-400 block">แท็บ Products</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block font-medium">ตำแหน่งสต๊อก</span>
                <span className="text-lg font-extrabold text-teal-800">{inventory.length}</span>
                <span className="text-[10px] text-slate-400 block">แท็บ Inventory</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block font-medium">ประวัติรับเข้า</span>
                <span className="text-lg font-extrabold text-blue-800">{inboundRecords.length}</span>
                <span className="text-[10px] text-slate-400 block">แท็บ Inbound</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs">
                <span className="text-[11px] text-slate-500 block font-medium">ประวัติส่งออก</span>
                <span className="text-lg font-extrabold text-indigo-800">{outboundRecords.length}</span>
                <span className="text-[10px] text-slate-400 block">แท็บ Outbound</span>
              </div>
            </div>

            {googleSheetsConfig.spreadsheetId && (
              <div className="p-3 bg-emerald-100/60 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    ไฟล์ปัจจุบัน: <strong>{googleSheetsConfig.spreadsheetTitle || 'KASA WMS Database'}</strong>
                  </span>
                </div>
                {effectiveSheetUrl && (
                  <a
                    href={effectiveSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 underline"
                  >
                    เปิดไฟล์ใน Google Sheets <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-4 flex flex-col gap-3">
            <button
              onClick={handleAutoCreateGoogleSheet}
              disabled={isCreatingDirect}
              id="auto-create-sheet-btn"
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isCreatingDirect ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>กำลังสร้างชีตและใส่ข้อมูล...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>สร้าง Google Sheet & ใส่ข้อมูลเดี๋ยวนี้</span>
                </>
              )}
            </button>

            {googleSheetsConfig.spreadsheetId && (
              <button
                onClick={handleDirectFetch}
                disabled={isDirectSyncing}
                id="fetch-direct-sheet-btn"
                className="w-full py-2 px-3 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {isDirectSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังดึงข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-3.5 h-3.5 text-blue-600" />
                    <span>ดึงข้อมูลล่าสุดจาก Google Sheets มาอัปเดต</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEATURE 2: APPS SCRIPT WEBHOOK / WEB APP INTEGRATION (FOR PRODUCTION DEPLOYMENT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Apps Script Code & Deployment Steps (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-5 h-5 text-emerald-600" />
                  ตัวเลือกเชื่อมต่อผ่าน Google Apps Script (Web App)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  เหมาะสำหรับนำโปรเจกต์ไป Deploy บน GitHub / Vercel โดยไม่ต้องล็อกอินซ้ำ
                </p>
              </div>
              <button
                onClick={handleCopyCode}
                id="copy-apps-script-code-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-bold transition-colors"
              >
                {isCopiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>คัดลอกสำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกโค้ด Apps Script</span>
                  </>
                )}
              </button>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900">เปิด Apps Script ใน Google Sheets ของคุณ</p>
                  <p className="text-slate-600">
                    ไปที่ไฟล์ชีตที่สร้างไว้ &gt; คลิกเมนูด้านบน <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900">วางโค้ด Code.gs</p>
                  <p className="text-slate-600">
                    ลบโค้ดเดิมออกทั้งหมด แล้ววางโค้ดที่คัดลอกจากปุ่มด้านบน
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-900">Deploy เป็น "เว็บแอป" (Web App)</p>
                  <p className="text-slate-600">
                    กดปุ่มสีน้ำเงิน <strong>"Deploy"</strong> มุมขวาบน &gt; <strong>New deployment</strong> &gt; เลือกประเภท ⚙️ <strong>Web app</strong> &gt; ตั้งค่าผู้เข้าถึง (Who has access) เป็น <strong className="text-rose-600">"Anyone" (ทุกคน)</strong> แล้วกด Deploy
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-bold text-slate-900">นำ URL มาวางในกล่องด้านขวา</p>
                  <p className="text-slate-600">
                    คัดลอก Web App URL (ลงท้ายด้วย <code>/exec</code>) แล้วกดปุ่ม <strong>"ทดสอบและบันทึก"</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Collapsible code preview */}
            <div className="pt-2">
              <button
                onClick={() => setShowCodePreview(!showCodePreview)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                {showCodePreview ? 'ซ่อนตัวอย่างโค้ด Code.gs' : 'ดูตัวอย่างโค้ด Code.gs สำเร็จรูป'}
              </button>

              {showCodePreview && (
                <div className="mt-3 bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono max-h-64 overflow-y-auto leading-relaxed border border-slate-800">
                  <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: URL Settings & Sync Operations (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Connection URL Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              การตั้งค่า Apps Script Web App URL
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ลิงก์ Google Sheets (Spreadsheet URL)
                </label>
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={e => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/50"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={e => {
                      setAutoSync(e.target.checked);
                      updateGoogleSheetsConfig({ autoSync: e.target.checked });
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      Auto-Sync สต๊อกรับเข้า/ส่งออกลงชีตทันที
                    </span>
                    <p className="text-[11px] text-slate-500">
                      เมื่อบันทึกรับเข้าหรือส่งออก ข้อมูลจะถูกบันทึกลงชีตอัตโนมัติ
                    </p>
                  </div>
                </label>
              </div>

              {/* Test Button */}
              <button
                onClick={handleSaveAndTest}
                disabled={isTesting || !inputUrl.trim()}
                id="test-google-sheets-btn"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>กำลังทดสอบการเชื่อมต่อ...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>ทดสอบและบันทึก URL (Test & Save)</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.title && (
                    <p className="text-[11px] mt-0.5 opacity-90">ชื่อไฟล์ชีต: {testResult.title}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sync Operations Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              การซิงค์ข้อมูลผ่าน Web App
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={handleUploadAllToSheets}
                disabled={isSyncingUp || isFetchingDown}
                id="upload-all-sheets-btn"
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isSyncingUp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังส่งข้อมูลขึ้น Sheets...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>ส่งข้อมูลทั้งหมดขึ้น Google Sheets (Upload)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleFetchAllFromSheets}
                disabled={isSyncingUp || isFetchingDown}
                id="fetch-all-sheets-btn"
                className="w-full py-2 px-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isFetchingDown ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังดึงข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>ดึงข้อมูลล่าสุดจาก Google Sheets (Fetch)</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
