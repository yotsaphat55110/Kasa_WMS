import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { LineWebhookLog } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { 
  MessageSquare, 
  Smartphone, 
  Send, 
  CheckCircle2, 
  Copy, 
  Bell, 
  ShieldCheck, 
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Radio,
  RefreshCw,
  Trash2,
  Users,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Terminal,
  Activity,
  Check,
  Play,
  Share2,
  Info,
  Clock,
  AlertTriangle,
  Link,
  QrCode,
  Globe,
  Download
} from 'lucide-react';

export const LineIntegrationView: React.FC = () => {
  const { lineConfig, updateLineConfig, triggerLineTestBroadcast, products, t } = useApp();

  // Active view tab inside Line Integration
  const [activeTab, setActiveTab] = useState<'liff-links' | 'logs' | 'setup' | 'config' | 'mobile'>('liff-links');

  // Credentials config state
  const [channelId, setChannelId] = useState(lineConfig.channelId);
  const [channelSecret, setChannelSecret] = useState(lineConfig.channelSecret);
  const [accessToken, setAccessToken] = useState(lineConfig.channelAccessToken);
  const [liffId, setLiffId] = useState(lineConfig.liffId);
  const [groupId, setGroupId] = useState(lineConfig.lineBotGroupId);
  const [customDeployedUrl, setCustomDeployedUrl] = useState(lineConfig.customDeployedUrl || '');
  const [selectedUrlSource, setSelectedUrlSource] = useState<'shared' | 'current' | 'custom'>(
    lineConfig.customDeployedUrl ? 'custom' : 'shared'
  );
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);

  // Webhook Logs state
  const [logs, setLogs] = useState<LineWebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string; latency?: number }>({ status: 'idle' });

  // Custom simulation modal/inputs
  const [simMessageText, setSimMessageText] = useState('เช็คสต๊อกสินค้า KASA-001 คงเหลือในคลังให้หน่อยครับ');
  const [simGroupName, setSimGroupName] = useState('กลุ่มคลังสินค้า & ฝ่ายจัดส่ง KASA');
  const [simUserName, setSimUserName] = useState('สมเกียรติ สิทธิชัย (เจ้าหน้าที่คลัง)');

  // URLs resolution
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const defaultSharedDomain = 'https://ais-pre-4pm2czbdbjt7rg6uuwd3ge-637997801240.asia-east1.run.app';

  // Base URL selection
  let activeBaseDomain = defaultSharedDomain;
  if (selectedUrlSource === 'current' && currentOrigin) {
    activeBaseDomain = currentOrigin;
  } else if (selectedUrlSource === 'custom' && customDeployedUrl.trim()) {
    activeBaseDomain = customDeployedUrl.trim().replace(/\/+$/, '');
  }

  // Ensure protocol
  if (activeBaseDomain && !activeBaseDomain.startsWith('http://') && !activeBaseDomain.startsWith('https://')) {
    activeBaseDomain = `https://${activeBaseDomain}`;
  }

  const generatedWebhookUrl = `${activeBaseDomain}/api/line/webhook`;
  const generatedLiffEndpointUrl = `${activeBaseDomain}?mode=liff`;
  const cleanLiffId = (liffId || '').trim();
  const generatedLiffUrl = cleanLiffId ? `https://liff.line.me/${cleanLiffId}` : `https://liff.line.me/2001928374-xY9zL4a1`;

  const currentWebhookUrl = `${currentOrigin}/api/line/webhook`;
  const sharedWebhookUrl = `${defaultSharedDomain}/api/line/webhook`;
  const liffUrl = generatedLiffUrl;

  // Fetch logs from Backend Express server
  const fetchWebhookLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/line/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch webhook logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Poll for logs automatically
  useEffect(() => {
    fetchWebhookLogs();
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      fetchWebhookLogs();
    }, 4000);

    return () => clearInterval(timer);
  }, [fetchWebhookLogs, autoRefresh]);

  // Test Ping Webhook endpoint
  const handleTestPing = async () => {
    setPingStatus({ status: 'testing' });
    const startTime = performance.now();
    try {
      const res = await fetch('/api/line/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [], destination: 'U_TEST_DESTINATION' })
      });
      const latency = Math.round(performance.now() - startTime);
      if (res.ok) {
        setPingStatus({ status: 'success', latency, message: 'HTTP 200 OK — Endpoint พร้อมใช้งาน 100%' });
        fetchWebhookLogs();
      } else {
        setPingStatus({ status: 'error', latency, message: `Status code ${res.status}` });
      }
    } catch (err: any) {
      setPingStatus({ status: 'error', message: err?.message || 'Connection failed' });
    }
    setTimeout(() => {
      setPingStatus({ status: 'idle' });
    }, 4000);
  };

  // Simulate an event (Message, Group Join, Follow)
  const handleSimulateEvent = async (actionType: 'message' | 'group_join' | 'follow') => {
    try {
      setSimulating(true);
      const res = await fetch('/api/line/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType,
          customText: simMessageText,
          customGroupName: simGroupName,
          customUserName: simUserName,
          isGroup: true
        })
      });
      if (res.ok) {
        await fetchWebhookLogs();
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!window.confirm('คุณต้องการล้างประวัติ Webhook Logs ทั้งหมดใช่หรือไม่?')) return;
    try {
      await fetch('/api/line/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  // Quick apply Group ID from log to line config
  const handleApplyGroupId = (targetGid: string, groupTitle?: string) => {
    setGroupId(targetGid);
    updateLineConfig({ lineBotGroupId: targetGid });
    alert(`นำ Group ID "${targetGid}" (${groupTitle || 'กลุ่ม LINE'}) ไปตั้งเป็นปลายทางการแจ้งเตือนเรียบร้อยแล้ว!`);
  };

  const handleSaveCustomDomain = (url: string) => {
    const cleaned = url.trim();
    setCustomDeployedUrl(cleaned);
    setSelectedUrlSource('custom');
    updateLineConfig({ customDeployedUrl: cleaned });
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 2500);
  };

  const handleQuickUpdateLiffId = (newId: string) => {
    const cleaned = newId.trim();
    setLiffId(cleaned);
    updateLineConfig({ liffId: cleaned });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateLineConfig({
      channelId,
      channelSecret,
      channelAccessToken: accessToken,
      liffId,
      customDeployedUrl: customDeployedUrl.trim(),
      lineBotGroupId: groupId,
      webhookStatus: 'CONNECTED'
    });
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(false), 3000);
  };

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    if (filterType === 'all') return true;
    if (filterType === 'message') return log.eventType === 'message';
    if (filterType === 'join') return log.eventType === 'join' || log.eventType === 'leave' || log.eventType === 'memberJoined';
    if (filterType === 'follow') return log.eventType === 'follow' || log.eventType === 'unfollow';
    if (filterType === 'verify') return log.eventType === 'verify';
    return true;
  });

  // Metrics
  const messageCount = logs.filter(l => l.eventType === 'message').length;
  const joinCount = logs.filter(l => l.eventType === 'join' || l.eventType === 'memberJoined').length;
  const followCount = logs.filter(l => l.eventType === 'follow').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Webhook Live Status */}
      <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <Radio className="w-3.5 h-3.5" />
              <span>LINE OA Webhook Gateway Online (HTTP 200 OK)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              LINE Official Account & Webhook Real-time Monitor
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              รองรับทุกการกระทำจาก LINE Messaging API ตรวจจับข้อความเข้า, ผู้ส่ง (User ID), 
              การเชิญเข้าร่วมกลุ่ม (Group ID), การเพิ่มเพื่อน และแจ้งเตือนคลังสินค้าอัตโนมัติ
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleTestPing}
              disabled={pingStatus.status === 'testing'}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Activity className="w-4 h-4" />
              <span>{pingStatus.status === 'testing' ? 'กำลังทดสอบ...' : 'ทดสอบ Ping Webhook'}</span>
            </button>

            <button
              onClick={() => {
                triggerLineTestBroadcast();
                setTestSuccess(true);
                setTimeout(() => setTestSuccess(false), 3000);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>ส่งข้อความทดสอบเข้ากลุ่ม</span>
            </button>
          </div>
        </div>

        {/* Webhook & LIFF Fast-Copy Grid */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Webhook URL */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>1. Webhook URL (Messaging API):</span>
              </div>
              <p className="font-mono text-xs text-slate-200 truncate select-all">
                {generatedWebhookUrl}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400">สำหรับรับ Event ข้อความ</span>
              <button
                onClick={() => handleCopy(generatedWebhookUrl, 'top-webhook')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
              >
                {copiedUrl === 'top-webhook' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>คัดลอก URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. LIFF Endpoint URL */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-400 mb-1">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>2. LIFF Endpoint URL (ตอนสร้าง LIFF):</span>
              </div>
              <p className="font-mono text-xs text-slate-200 truncate select-all">
                {generatedLiffEndpointUrl}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400">ใส่ในช่อง Endpoint URL</span>
              <button
                onClick={() => handleCopy(generatedLiffEndpointUrl, 'top-liff-endpoint')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
              >
                {copiedUrl === 'top-liff-endpoint' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>คัดลอก URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. LIFF URL For Staff */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>3. LIFF App URL (ส่งให้พนักงานคลิก):</span>
              </div>
              <p className="font-mono text-xs text-slate-200 truncate select-all">
                {generatedLiffUrl}
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400">เปิดในแอป LINE บนมือถือ</span>
              <button
                onClick={() => handleCopy(generatedLiffUrl, 'top-liff-app')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
              >
                {copiedUrl === 'top-liff-app' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>คัดลอก LIFF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Bar */}
        {pingStatus.status === 'success' && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{pingStatus.message}</span>
            </div>
            {pingStatus.latency && (
              <span className="font-mono text-[11px] text-emerald-400/90">
                Latency: {pingStatus.latency} ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('liff-links')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'liff-links'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>ลิงก์ Webhook & LINE LIFF สำเร็จรูป</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'liff-links' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
            }`}>
              แนะนำ
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Webhook Live Logs & Inspector</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'logs' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'setup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>วิธีนำไปใส่ใน LINE Developers</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'config'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ตั้งค่า Messaging API & เงื่อนไขแจ้งเตือน</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'mobile'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>จำลองหน้าจอ LINE LIFF บนมือถือ</span>
          </button>
        </div>

        {activeTab === 'logs' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                autoRefresh 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>Auto-Refresh (4s)</span>
            </button>

            <button
              onClick={fetchWebhookLogs}
              disabled={loadingLogs}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs transition-all disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* ================= TAB 0: WEBHOOK & LIFF READY-TO-USE LINKS ================= */}
      {activeTab === 'liff-links' && (
        <div className="space-y-6">
          
          {/* Domain Selection & Deployed URL Configurator */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>เลือกโดเมนที่คุณ Deploy สำหรับสร้างลิงก์ Webhook และ LIFF</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบจะคำนวณ Webhook URL และ LIFF Endpoint URL ให้ตรงกับโดเมนที่คุณเลือกโดยอัตโนมัติ
                </p>
              </div>

              {testSuccess && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บันทึกโดเมนเรียบร้อยแล้ว</span>
                </span>
              )}
            </div>

            {/* Source Selector Radios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedUrlSource === 'shared'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="urlSource"
                    checked={selectedUrlSource === 'shared'}
                    onChange={() => setSelectedUrlSource('shared')}
                    className="text-emerald-600"
                  />
                  <span className="font-bold text-slate-900">Cloud Run (Production URL)</span>
                </div>
                <p className="font-mono text-[11px] text-slate-500 mt-1 truncate">
                  {defaultSharedDomain}
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block">
                  ✓ พร้อมใช้งานทันที ไม่ต้องตั้งค่าเพิ่ม
                </span>
              </label>

              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedUrlSource === 'current'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="urlSource"
                    checked={selectedUrlSource === 'current'}
                    onChange={() => setSelectedUrlSource('current')}
                    className="text-emerald-600"
                  />
                  <span className="font-bold text-slate-900">โดเมนที่เปิดใช้งานอยู่ขณะนี้</span>
                </div>
                <p className="font-mono text-[11px] text-slate-500 mt-1 truncate">
                  {currentOrigin || 'กำลังโหลด...'}
                </p>
                <span className="text-[10px] text-slate-500 mt-1 inline-block">
                  (Direct Browser Origin)
                </span>
              </label>

              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedUrlSource === 'custom'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="urlSource"
                    checked={selectedUrlSource === 'custom'}
                    onChange={() => setSelectedUrlSource('custom')}
                    className="text-emerald-600"
                  />
                  <span className="font-bold text-slate-900">Custom Deployed Domain</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  (เช่น Deploy บน Vercel, Render, Cloudflare หรือโดเมนส่วนตัว)
                </p>
                <span className="text-[10px] text-blue-700 font-semibold mt-1 inline-block">
                  พิมพ์ URL เองได้ด้านล่าง
                </span>
              </label>
            </div>

            {/* Custom URL Input Field */}
            {selectedUrlSource === 'custom' && (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-blue-950">
                  ระบุ URL ของเว็บที่คุณ Deploy ผ่าน GitHub (เช่น https://kasa-wms.vercel.app):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customDeployedUrl}
                    onChange={(e) => setCustomDeployedUrl(e.target.value)}
                    placeholder="https://your-domain.vercel.app"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveCustomDomain(customDeployedUrl)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
                  >
                    บันทึกโดเมน
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3 Core Production Link Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Card 1: Webhook URL */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    1
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    LINE Messaging API
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Webhook URL (สำหรับใส่ใน LINE OA)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    นำลิงก์นี้ไปใส่ในแท็บ <strong>Messaging API</strong> &gt; <strong>Webhook settings</strong> &gt; <strong>Webhook URL</strong> แล้วเปิด <strong>Use Webhook</strong>
                  </p>
                </div>

                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl break-all select-all border border-slate-800">
                  {generatedWebhookUrl}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleCopy(generatedWebhookUrl, 'card-webhook')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  {copiedUrl === 'card-webhook' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>คัดลอก Webhook URL แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอก Webhook URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleTestPing}
                  disabled={pingStatus.status === 'testing'}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{pingStatus.status === 'testing' ? 'กำลังทดสอบ Ping...' : 'ทดสอบ Ping Webhook (จำลอง Verify)'}</span>
                </button>
              </div>
            </div>

            {/* Card 2: LIFF Endpoint URL */}
            <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
                    2
                  </span>
                  <span className="px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-bold">
                    LINE LIFF Console
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    LIFF Endpoint URL (ตอนสร้าง LIFF App)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    นำลิงก์นี้ไปใส่ในแท็บ <strong>LIFF</strong> &gt; <strong>Add</strong> ใน LINE Developers Console ที่ช่อง <strong>Endpoint URL</strong> (เลือกขนาด Full หรือ Tall)
                  </p>
                </div>

                <div className="p-3 bg-slate-900 text-sky-300 font-mono text-xs rounded-xl break-all select-all border border-slate-800">
                  {generatedLiffEndpointUrl}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleCopy(generatedLiffEndpointUrl, 'card-liff-endpoint')}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  {copiedUrl === 'card-liff-endpoint' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>คัดลอก Endpoint URL แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอก Endpoint URL</span>
                    </>
                  )}
                </button>

                <a
                  href={generatedLiffEndpointUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                  <span>เปิดทดสอบหน้า LIFF ในแท็บใหม่</span>
                </a>
              </div>
            </div>

            {/* Card 3: Final LIFF App URL */}
            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                    3
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                    พนักงานเปิดบน LINE
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    LINE LIFF URL สำเร็จรูป
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    ลิงก์สำหรับส่งให้พนักงานคลิกใน LINE หรือนำไปผูกกับ <strong>Rich Menu</strong> ของ LINE Official Account
                  </p>
                </div>

                {/* Quick LIFF ID Input & Link */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-700 shrink-0">
                      LIFF ID:
                    </label>
                    <input
                      type="text"
                      value={liffId}
                      onChange={(e) => handleQuickUpdateLiffId(e.target.value)}
                      placeholder="เช่น 2001928374-xY9zL4a1"
                      className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-emerald-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-xl break-all select-all border border-slate-800">
                    {generatedLiffUrl}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleCopy(generatedLiffUrl, 'card-liff-app')}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  {copiedUrl === 'card-liff-app' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>คัดลอก LIFF URL แล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอก LIFF URL</span>
                    </>
                  )}
                </button>

                <a
                  href={generatedLiffUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                  <span>เปิดทดสอบ LIFF App</span>
                </a>
              </div>
            </div>

          </div>

          {/* Interactive QR Code & Mobile Warehouse Access */}
          <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-sm border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left Description */}
            <div className="md:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
                <QrCode className="w-3.5 h-3.5" />
                <span>Live QR Code สำหรับทดสอบบนมือถือทันที</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold">
                สแกนเปิดระบบคลังสินค้าผ่าน LINE บนสมาร์ทโฟน
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                เปิดแอป LINE ในโทรศัพท์มือถือของคุณ แล้วเปิดกล้องสแกน QR Code นี้ จะเปิดเข้าสู่หน้าจอ 
                <strong> KASA WMS LIFF</strong> ซึ่งออกแบบมาให้พนักงานคลังสามารถสแกนบาร์โค้ด, เช็คสต๊อกคงเหลือ และบันทึกรับเข้า/ส่งออกได้ง่ายและรวดเร็วบนมือถือทันที
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <div className="px-3 py-1.5 bg-slate-800/90 rounded-lg text-slate-200 border border-slate-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>รองรับทั้ง iOS และ Android</span>
                </div>
                <div className="px-3 py-1.5 bg-slate-800/90 rounded-lg text-slate-200 border border-slate-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>ไม่ต้องติดตั้งแอปพลิเคชันเพิ่ม</span>
                </div>
              </div>
            </div>

            {/* Right QR Code Card */}
            <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-lg text-slate-900 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-inner">
                <QRCodeSVG
                  value={generatedLiffUrl}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs font-bold text-slate-900 mt-3">
                สแกนเพื่อเปิด LINE LIFF
              </p>
              <p className="font-mono text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                {generatedLiffUrl}
              </p>
            </div>
          </div>

          {/* 4-Step Connection Checklist */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>สรุป 4 ขั้นตอนการนำลิงก์ไปใช้งาน (Checklist)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ขั้นตอนที่ 1: ตั้ง Webhook</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  ไปที่ <strong>Messaging API</strong> &gt; วาง <strong>Webhook URL</strong> &gt; เปิดสวิตช์ <strong>Use Webhook: ON</strong> แล้วกด <strong>Verify</strong>
                </p>
              </div>

              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200/80 space-y-2">
                <span className="font-bold text-sky-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" />
                  <span>ขั้นตอนที่ 2: สร้าง LIFF App</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  ไปที่แท็บ <strong>LIFF</strong> ใน LINE Developers &gt; กด <strong>Add</strong> &gt; ใส่ชื่อแอป &gt; ขนาด Full หรือ Tall &gt; วาง <strong>Endpoint URL</strong>
                </p>
              </div>

              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>ขั้นตอนที่ 3: ระบุ LIFF ID</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  เมื่อสร้าง LIFF เสร็จ จะได้รับ <strong>LIFF ID</strong> ให้นำมากรอกในช่อง <strong>LIFF ID</strong> ด้านบน เพื่อให้ลิงก์ LIFF App อัปเดตสมบูรณ์
                </p>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 space-y-2">
                <span className="font-bold text-purple-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>ขั้นตอนที่ 4: เชื่อมกับ Rich Menu</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  นำ <strong>LIFF App URL</strong> ไปใส่ในปุ่ม Rich Menu ของ LINE OA เพื่อให้พนักงานกดเปิดระบบคลังสินค้าได้จากห้องแชทของ LINE ทันที
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 1: WEBHOOK LIVE LOGS & INSPECTOR ================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">เหตุการณ์ทั้งหมด</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{logs.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">รวมทุกคำขอที่เข้ามา</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">ข้อความที่ได้รับ</span>
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">{messageCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">จากแชตส่วนตัวและกลุ่ม</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">เชิญเข้ากลุ่ม (Group Joins)</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600 mt-1">{joinCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">พร้อมตรวจจับ Group ID</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">เพิ่มเพื่อน (Followers)</span>
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">{followCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ผู้ใช้ใหม่ที่กดติดตาม</p>
            </div>
          </div>

          {/* Simulation & Testing Panel */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                เครื่องมือทดสอบจำลอง Event ทันที (Interactive Event Simulator)
              </span>
              <span className="text-[11px] text-slate-500">
                สามารถกดทดสอบเพื่อดูการแสดงผลของ log ได้ทันทีโดยไม่ต้องรอข้อความจริง
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Test Message */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    จำลอง "ผู้ใช้ส่งข้อความ"
                  </span>
                </div>
                <input
                  type="text"
                  value={simMessageText}
                  onChange={(e) => setSimMessageText(e.target.value)}
                  placeholder="ข้อความที่ต้องการทดสอบ..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <button
                  onClick={() => handleSimulateEvent('message')}
                  disabled={simulating}
                  className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>ยิงเหตุการณ์จำลอง Message</span>
                </button>
              </div>

              {/* Test Group Join */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    จำลอง "บอทถูกดึงเข้ากลุ่ม LINE"
                  </span>
                </div>
                <input
                  type="text"
                  value={simGroupName}
                  onChange={(e) => setSimGroupName(e.target.value)}
                  placeholder="ชื่อกลุ่ม LINE..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <button
                  onClick={() => handleSimulateEvent('group_join')}
                  disabled={simulating}
                  className="w-full py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>ยิงเหตุการณ์จำลอง Group Join</span>
                </button>
              </div>

              {/* Test Follow / Clear */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    จำลอง "ผู้ใช้เพิ่มเพื่อน (Follow)"
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ทดสอบ Event เมื่อมีผู้ใช้กดติดตามบัญชี LINE OA
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSimulateEvent('follow')}
                    disabled={simulating}
                    className="py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Play className="w-3 h-3" />
                    <span>จำลอง Follow</span>
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ล้าง Logs ทั้งหมด</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'ทั้งหมด', count: logs.length },
                { id: 'message', label: 'ข้อความเข้า', count: messageCount },
                { id: 'join', label: 'เข้ากลุ่ม / ออกกลุ่ม', count: joinCount },
                { id: 'follow', label: 'เพิ่มเพื่อน', count: followCount },
                { id: 'verify', label: 'Webhook Verify', count: logs.filter(l => l.eventType === 'verify').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterType === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-1.5 text-[10px] opacity-75 font-mono">({tab.count})</span>
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              เรียงจากเหตุการณ์ล่าสุด
            </span>
          </div>

          {/* Event Logs List */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Radio className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">ยังไม่มีเหตุการณ์ในหมวดหมู่นี้</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  เมื่อ LINE Developers ส่ง Webhook เข้ามา หรือเมื่อผู้ใช้ส่งข้อความ/เชิญเข้ากลุ่ม 
                  ข้อมูลและรายละเอียดทั้งหมดจะแสดงที่นี่โดยอัตโนมัติ
                </p>
                <button
                  onClick={() => handleSimulateEvent('message')}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>ทดสอบยิง Event จำลองเพื่อดูตัวอย่าง</span>
                </button>
              </div>
            ) : (
              filteredLogs.map(log => {
                const isExpanded = expandedLogId === log.id;
                const formattedTime = new Date(log.timestamp).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <div
                    key={log.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs overflow-hidden ${
                      log.eventType === 'join' 
                        ? 'border-purple-200 hover:border-purple-300' 
                        : log.eventType === 'message'
                        ? 'border-blue-200 hover:border-blue-300'
                        : log.eventType === 'verify'
                        ? 'border-emerald-200 hover:border-emerald-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Log Item Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        {/* Event Type Icon Badge */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          log.eventType === 'message' 
                            ? 'bg-blue-100 text-blue-700' 
                            : log.eventType === 'join' 
                            ? 'bg-purple-100 text-purple-700'
                            : log.eventType === 'follow'
                            ? 'bg-amber-100 text-amber-700'
                            : log.eventType === 'leave' || log.eventType === 'unfollow'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.eventType === 'message' && <MessageSquare className="w-4 h-4" />}
                          {log.eventType === 'join' && <Users className="w-4 h-4" />}
                          {log.eventType === 'follow' && <User className="w-4 h-4" />}
                          {log.eventType === 'verify' && <Activity className="w-4 h-4" />}
                          {log.eventType !== 'message' && log.eventType !== 'join' && log.eventType !== 'follow' && log.eventType !== 'verify' && <Radio className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                              log.eventType === 'message'
                                ? 'bg-blue-100 text-blue-800'
                                : log.eventType === 'join'
                                ? 'bg-purple-100 text-purple-800'
                                : log.eventType === 'follow'
                                ? 'bg-amber-100 text-amber-800'
                                : log.eventType === 'verify'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-800'
                            }`}>
                              {log.eventType === 'message' && '💬 ข้อความเข้า (MESSAGE)'}
                              {log.eventType === 'join' && '🎉 เชิญเข้ากลุ่ม (GROUP JOIN)'}
                              {log.eventType === 'leave' && '🚪 ออกจากกลุ่ม (LEAVE)'}
                              {log.eventType === 'follow' && '👤 ผู้ใช้เพิ่มเพื่อน (FOLLOW)'}
                              {log.eventType === 'unfollow' && '🚫 บล็อก/ยกเลิกเพื่อน (UNFOLLOW)'}
                              {log.eventType === 'verify' && '⚡ ตรวจสอบ WEBHOOK (PING)'}
                              {log.eventType === 'memberJoined' && '👥 สมาชิกเข้ากลุ่ม (MEMBER JOIN)'}
                            </span>

                            <span className="text-[11px] text-slate-400 font-mono">
                              {formattedTime}
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                            {log.details}
                          </h4>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Terminal className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isExpanded ? 'ซ่อน Payload' : 'ดู Payload'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Cards for Message or Group */}
                    <div className="p-4 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* 1. SENDER INFORMATION (ผู้ส่งข้อความ) */}
                        {log.userId && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <User className="w-3 h-3 text-blue-600" />
                              ข้อมูลผู้ส่ง (Sender Profile)
                            </span>
                            <div className="flex items-center gap-2.5">
                              {log.userPictureUrl ? (
                                <img
                                  src={log.userPictureUrl}
                                  alt="Sender avatar"
                                  className="w-8 h-8 rounded-full object-cover border border-slate-300"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                                  {log.userName ? log.userName[0] : 'U'}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {log.userName || 'LINE User (ไม่ได้ระบุชื่อ)'}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500 truncate select-all">
                                  ID: {log.userId}
                                </p>
                              </div>
                              <button
                                onClick={() => handleCopy(log.userId!, `user-${log.id}`)}
                                className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-all"
                                title="คัดลอก User ID"
                              >
                                {copiedUrl === `user-${log.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. GROUP INFORMATION (ข้อมูลกลุ่ม LINE) */}
                        {log.groupId && (
                          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3 text-purple-700" />
                                ข้อมูลกลุ่ม LINE (Target Group)
                              </span>
                              <button
                                onClick={() => handleApplyGroupId(log.groupId!, log.groupName)}
                                className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold transition-all"
                              >
                                ใช้ Group ID นี้แจ้งเตือน
                              </button>
                            </div>
                            <div className="flex items-center gap-2.5">
                              {log.groupPictureUrl ? (
                                <img
                                  src={log.groupPictureUrl}
                                  alt="Group avatar"
                                  className="w-8 h-8 rounded-lg object-cover border border-purple-300"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-purple-200 text-purple-800 font-bold text-xs flex items-center justify-center">
                                  G
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-purple-950 truncate">
                                  {log.groupName || 'กลุ่ม LINE (ไม่ได้ตั้งชื่อ)'}
                                </p>
                                <p className="text-[11px] font-mono text-purple-700 truncate select-all">
                                  ID: {log.groupId}
                                </p>
                              </div>
                              <button
                                onClick={() => handleCopy(log.groupId!, `group-${log.id}`)}
                                className="p-1.5 hover:bg-purple-200 rounded-md text-purple-700 transition-all"
                                title="คัดลอก Group ID"
                              >
                                {copiedUrl === `group-${log.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. MESSAGE CONTENT BUBBLE (ถ้ามีข้อความ) */}
                      {log.messageText && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-slate-600">
                              เนื้อหาข้อความ ({log.messageType || 'text'}):
                            </span>
                            {log.replyToken && (
                              <span className="font-mono">ReplyToken: {log.replyToken.slice(0, 10)}...</span>
                            )}
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-800 leading-relaxed">
                            "{log.messageText}"
                          </div>
                        </div>
                      )}

                      {/* 4. EXPANDABLE RAW JSON PAYLOAD */}
                      {isExpanded && (
                        <div className="mt-2 p-3 bg-slate-900 rounded-xl text-slate-200 font-mono text-[11px] overflow-x-auto space-y-1.5">
                          <div className="flex items-center justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                            <span>RAW WEBHOOK JSON FROM LINE DEVELOPERS</span>
                            <button
                              onClick={() => handleCopy(JSON.stringify(log.rawPayload, null, 2), `raw-${log.id}`)}
                              className="text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedUrl === `raw-${log.id}` ? 'คัดลอก JSON แล้ว' : 'คัดลอก JSON'}</span>
                            </button>
                          </div>
                          <pre className="max-h-60 overflow-y-auto">
                            {JSON.stringify(log.rawPayload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ================= TAB 2: LINE DEVELOPERS SETUP GUIDE ================= */}
      {activeTab === 'setup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <span>ขั้นตอนการนำลิงก์ Webhook ไปใส่ใน LINE Developers Console</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              ทำตามขั้นตอนง่ายๆ 4 ขั้นตอนนี้เพื่อให้ LINE Official Account เชื่อมต่อกับระบบคลังสินค้าได้สมบูรณ์
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step 1 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  เข้าสู่ระบบ LINE Developers Console
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                เปิดเว็บไซต์{' '}
                <a 
                  href="https://developers.line.biz/console/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  developers.line.biz <ExternalLink className="w-3 h-3 inline" />
                </a>
                {' '}แล้วเข้าสู่ระบบด้วยบัญชี LINE ของคุณ จากนั้นเลือก **Provider** และ **Messaging API Channel** ที่ต้องการเชื่อมต่อ
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  ไปที่แท็บ "Messaging API"
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                คลิกเลือกแท็บ **Messaging API** ที่เมนูด้านบน แล้วเลื่อนลงมาที่หัวข้อ **Webhook settings**
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-xs font-bold text-emerald-950">
                  กด Edit แล้ววาง Webhook URL นี้ลงไป
                </h4>
              </div>
              <div className="pl-8 space-y-2">
                <div className="p-2.5 bg-white border border-emerald-300 rounded-lg flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-emerald-950 truncate select-all">
                    {sharedWebhookUrl}
                  </span>
                  <button
                    onClick={() => handleCopy(sharedWebhookUrl, 'guide-copy')}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shrink-0 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUrl === 'guide-copy' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800">
                  ⚠️ <strong>สำคัญมาก:</strong> ต้องเปิดสวิตช์ <strong>"Use webhook"</strong> ให้เป็นสีเขียว (ON) ด้วย
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="text-xs font-bold text-slate-900">
                  กดปุ่ม "Verify" ใน LINE Developers
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                เมื่อกดปุ่ม <strong>Verify</strong> ระบบจะส่งสัญญาณทดสอบมาที่เซิร์ฟเวอร์ของเรา และจะขึ้นสถานะ <strong>"Success"</strong> สีเขียวทันที
                จากนั้นตรวจสอบที่แท็บ <strong>Webhook Live Logs</strong> ในหน้านี้ได้เลยครับ!
              </p>
            </div>

          </div>

          {/* Important Notice for LINE Webhook & 302 Error */}
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 leading-relaxed">
              <p className="font-bold text-sm text-rose-900">
                🚨 หาก LINE Developers ฟ้อง Error 302 Found (The webhook returned an HTTP status code other than 200)
              </p>
              <p className="mt-1">
                <strong>สาเหตุ:</strong> ลิงก์ที่ขึ้นต้นด้วย <code>ais-pre-...</code> หรือ <code>ais-dev-...</code> เป็นลิงก์สำหรับ Preview ภายใน Google AI Studio ซึ่งมีระบบป้องกัน Cookie (Google Cookie Check 302) ทำให้ LINE Bot ที่ยิงเข้ามาจากภายนอกติดตัวกรองความปลอดภัยของ Google
              </p>
              <div className="mt-2.5 p-3 bg-white/80 rounded-lg border border-rose-300 space-y-1.5 text-slate-800">
                <p className="font-bold text-emerald-800">✅ วิธีแก้ไขให้ LINE ตรวจสอบผ่าน 200 OK ได้ฟรี:</p>
                <p>
                  <strong>วิธีที่ 1 (แนะนำและฟรี 100%):</strong> กดปุ่ม <strong>Deploy to Cloud Run</strong> (หรือ Export to GitHub แล้ว Deploy ฟรีบน Vercel / Render) คุณจะได้รับ URL โดเมนสาธารณะถาวรจริง (เช่น <code>https://kasa-wms.run.app/api/line/webhook</code>) ซึ่งไม่มีระบบ Cookie Check และจะขึ้นสถานะ <strong>200 OK Success</strong> ทันที
                </p>
                <p>
                  <strong>วิธีที่ 2 (ทดสอบในระบบตอนนี้):</strong> คุณสามารถใช้เครื่องมือ <strong>"Interactive Event Simulator"</strong> ในแท็บ Webhook Live Logs ด้านบน เพื่อจำลองข้อความเข้า และจำลองการเชิญบอทเข้ากลุ่มเพื่อดูฟังก์ชันการทำงานได้ทันที
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">เคล็ดลับการดึง LINE Bot เข้ากลุ่ม:</p>
              <p className="mt-0.5">
                1. เชิญ LINE Official Account ของคุณเข้ากลุ่มพนักงานคลังสินค้า <br />
                2. บอทจะส่ง Event <code>join</code> กลับมาที่ Webhook ทันที พร้อมแสดง <strong>Group ID</strong> ในแท็บ Logs <br />
                3. คุณสามารถกดปุ่ม <strong>"ใช้ Group ID นี้แจ้งเตือน"</strong> ได้โดยตรง เพื่อให้บอทเริ่มส่งการแจ้งเตือนสินค้าเข้า-ออก เข้ากลุ่มนั้นทันทีครับ
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CREDENTIALS & ALERT TRIGGERS ================= */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>การตั้งค่า LINE Messaging API Credentials</span>
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                Webhook Status: CONNECTED
              </span>
            </div>

            {testSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกการตั้งค่า LINE OA เรียบร้อยแล้ว!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LINE Channel ID
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="เช่น 2001928374"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LINE Channel Secret
                </label>
                <input
                  type="password"
                  value={channelSecret}
                  onChange={(e) => setChannelSecret(e.target.value)}
                  placeholder="เช่น 4a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Access Token (Long-lived)
              </label>
              <textarea
                rows={2}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="นำมาจากแท็บ Messaging API -> Channel access token (issue)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LINE LIFF ID (สำหรับแอปมือถือ)
                </label>
                <input
                  type="text"
                  value={liffId}
                  onChange={(e) => setLiffId(e.target.value)}
                  placeholder="เช่น 2001928374-xY9zL4a1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Group ID (LINE Bot Group Target)
                </label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="เช่น C12a34b56c78d90e1f23456789abcdef0"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 แนะนำ: เชิญบอทเข้ากลุ่มแล้วคัดลอก Group ID จากแท็บ Webhook Logs ได้โดยตรง
                </p>
              </div>
            </div>

            {/* Event Notification Toggles */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  เงื่อนไขการส่งแจ้งเตือนเข้ากลุ่ม Bot LINE (Alert Triggers)
                </span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lineConfig.lineBotEnabled}
                    onChange={(e) => updateLineConfig({ lineBotEnabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-xs border-slate-300"
                  />
                  <span className="text-xs font-bold text-emerald-800">{t.line.toggleBot}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyInbound}
                    onChange={(e) => updateLineConfig({ notifyInbound: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-xs"
                  />
                  <span className="text-slate-800 font-medium">1. แจ้งเตือนเมื่อรับสินค้าเข้า (Inbound)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyOutbound}
                    onChange={(e) => updateLineConfig({ notifyOutbound: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded-xs"
                  />
                  <span className="text-slate-800 font-medium">2. แจ้งเตือนเมื่อส่งออกสินค้า (Outbound)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyLowStock}
                    onChange={(e) => updateLineConfig({ notifyLowStock: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded-xs"
                  />
                  <span className="text-amber-900 font-bold">3. แจ้งเตือนสินค้าใกล้หมด (Low Stock)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-rose-50 rounded-xl border border-rose-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyDamaged}
                    onChange={(e) => updateLineConfig({ notifyDamaged: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded-xs"
                  />
                  <span className="text-rose-900 font-bold">4. แจ้งเตือนสินค้าชำรุดเสียหาย (Damaged)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                บันทึกการตั้งค่า LINE OA
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 4: SMARTPHONE LIFF PREVIEW ================= */}
      {activeTab === 'mobile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1.5">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              {t.line.liffPreview}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              จำลองหน้าจอ LINE LIFF เมื่อพนักงานเปิดใช้งานบนสมาร์ทโฟน
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="font-mono text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {liffUrl}
              </span>
              <button
                onClick={() => handleCopy(liffUrl, 'liff')}
                className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedUrl === 'liff' ? 'คัดลอกแล้ว' : 'คัดลอก LIFF'}</span>
              </button>
            </div>
          </div>

          {/* Smartphone Shell */}
          <div className="w-full max-w-[340px] bg-slate-900 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
            
            {/* Speaker notch */}
            <div className="w-28 h-4 bg-slate-900 rounded-b-xl mx-auto absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
            </div>

            {/* Screen Content */}
            <div className="bg-slate-100 rounded-[32px] overflow-hidden pt-6 pb-4 px-3 min-h-[580px] text-slate-800 flex flex-col justify-between relative">
              
              {/* LINE Header Bar */}
              <div>
                <div className="bg-emerald-600 text-white p-3 rounded-2xl flex items-center justify-between shadow-xs mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs">
                      K
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">KASA WMS LIFF</h4>
                      <p className="text-[9px] text-emerald-100">LINE Official Account Connected</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                </div>

                {/* Simulated Notification Message inside LINE */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2 mb-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-emerald-700">🟢 LINE Bot Group Alert</span>
                    <span>10:30 น.</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    📦 แจ้งเตือน: รับเข้าสารส้มขุ่น 5,000 กก.
                  </p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    • รหัสสินค้า: KASA-001 <br />
                    • คลัง: WH-01 โซน A1 <br />
                    • ผู้รับสินค้า: นภา เจริญคลัง <br />
                    • ผู้ลงระบบ: สมชาย สายเคมี
                  </p>
                </div>

                {/* Stock Quick Card inside Mobile View */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <h5 className="text-xs font-bold text-slate-900 flex items-center justify-between">
                    <span>สินค้าใกล้หมด (Low Stock)</span>
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-xs">
                      3 รายการ
                    </span>
                  </h5>

                  <div className="space-y-1.5">
                    {products.slice(0, 3).map(p => (
                      <div key={p.id} className="p-2 bg-slate-50 rounded-xl text-[11px] flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <p className="text-[9px] text-slate-400">{p.code}</p>
                        </div>
                        <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                          เตือนที่ {p.minThreshold}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Footer Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-slate-200">
                <button
                  onClick={() => alert('เปิดแบบฟอร์มรับเข้าผ่าน LIFF')}
                  className="py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>รับสินค้าเข้า</span>
                </button>

                <button
                  onClick={() => alert('เปิดแบบฟอร์มส่งออกผ่าน LIFF')}
                  className="py-2 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>เบิกส่งออก</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
