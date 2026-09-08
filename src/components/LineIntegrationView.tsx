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
  Radio,
  RefreshCw,
  Trash2,
  Users,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Check,
  Info,
  Clock,
  AlertTriangle,
  Link,
  QrCode,
  Globe,
  Database
} from 'lucide-react';

export const LineIntegrationView: React.FC = () => {
  const { lineConfig, updateLineConfig, triggerLineTestBroadcast, t } = useApp();

  // Active view tab inside Line Integration
  const [activeTab, setActiveTab] = useState<'config' | 'liff-links' | 'logs'>('config');

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
  const [sendingTest, setSendingTest] = useState(false);

  // Sync inputs when server-loaded lineConfig updates
  useEffect(() => {
    setChannelId(lineConfig.channelId);
    setChannelSecret(lineConfig.channelSecret);
    setAccessToken(lineConfig.channelAccessToken);
    setLiffId(lineConfig.liffId);
    setGroupId(lineConfig.lineBotGroupId);
    setCustomDeployedUrl(lineConfig.customDeployedUrl || '');
  }, [lineConfig]);

  // Webhook Logs state
  const [logs, setLogs] = useState<LineWebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [pingStatus, setPingStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string; latency?: number }>({ status: 'idle' });

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
      
      {/* Top Professional Header */}
      <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Radio className="w-3.5 h-3.5" />
              <span>LINE Gateway Integration</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              เชื่อมต่อและตั้งค่า LINE Official Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ผูกระบบคลังสินค้าเข้ากับ LINE OA เพื่อส่งการแจ้งเตือนยอดการรับเข้า-เบิกจ่ายสินค้าไปยังกลุ่มไลน์พนักงาน 
              และรองรับระบบสมาร์ทโฟน LIFF สแกนสต๊อกได้ทันทีในแอปพลิเคชัน LINE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleTestPing}
              disabled={pingStatus.status === 'testing'}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{pingStatus.status === 'testing' ? 'กำลังส่งคำขอทดสอบ...' : 'ทดสอบสัญญาณ Webhook'}</span>
            </button>

            <button
              onClick={async () => {
                setSendingTest(true);
                const res = await triggerLineTestBroadcast();
                setSendingTest(false);
                if (res.success) {
                  alert(`✅ สำเร็จ: ${res.message}`);
                } else {
                  alert(`❌ ล้มเหลว: ${res.message}\n\nกรุณาตรวจสอบว่า:\n1. บอทถูกเชิญเข้าร่วมกลุ่มไลน์เรียบร้อยแล้ว\n2. ตั้งค่า Channel Access Token และ Target Group ID ถูกต้อง`);
                }
              }}
              disabled={sendingTest}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sendingTest ? 'กำลังส่งข้อความ...' : 'ส่งข้อความทดสอบเข้ากลุ่ม'}</span>
            </button>
          </div>
        </div>

        {/* Global Auto-Log Notification to Sheet */}
        <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>💡 <strong>ฟีเจอร์พิเศษ:</strong> ทุกประวัติกิจกรรมของ LINE Webhook จะถูกบันทึกส่งไปเก็บที่แท็บชีต <strong>"AuditLogs"</strong> ใน Google Sheets ของคุณโดยอัตโนมัติ เพื่อให้สามารถดูประวัติย้อนหลังได้ถาวร!</span>
        </div>
      </div>

      {/* Modern High-Contrast Light Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'config'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. ตั้งค่าบัญชี LINE OA & การแจ้งเตือน</span>
          </button>

          <button
            onClick={() => setActiveTab('liff-links')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'liff-links'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/10'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>2. ลิงก์เชื่อมต่อ Webhook & QR Code มือถือ</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>3. ประวัติกิจกรรม Webhook Logs</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'logs' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {logs.length}
            </span>
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

      {/* ================= TAB 1: API CONFIGURATION & TRIGGERS ================= */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">กรอกข้อมูลเชื่อมต่อ Messaging API</h3>
            <p className="text-xs text-slate-500 mt-1">
              นำข้อมูลชุดเหล่านี้มาจากหน้า <strong>LINE Developers Console</strong> เพื่ออนุญาตให้เว็บสั่งงานบอทส่งแจ้งเตือนและเชื่อมต่อระบบ LIFF มือถือ
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LINE Channel ID (สิบหลัก)
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="เช่น 2001928374"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LINE Channel Secret
                </label>
                <input
                  type="password"
                  value={channelSecret}
                  onChange={(e) => setChannelSecret(e.target.value)}
                  placeholder="รหัสลับผู้พัฒนา (ลับเฉพาะ)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LINE Channel Access Token (แบบ Long-lived)
                </label>
                <textarea
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="คัดลอกโทเค็นแบบยาวที่สร้างขึ้นจากหน้า Messaging API มาวางที่นี่..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  LINE LIFF ID (สำหรับเปิดระบบบนสมาร์ทโฟนพนักงาน)
                </label>
                <input
                  type="text"
                  value={liffId}
                  onChange={(e) => setLiffId(e.target.value)}
                  placeholder="เช่น 2001928374-xY9zL4a1"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 ดูวิธีสร้าง LIFF ได้ที่แท็บลิงก์นำไปติดตั้ง
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Group ID (ไอดีกลุ่มคลังสินค้าสำหรับการส่งแจ้งเตือน)
                </label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="เช่น C12a34b56c78d90e1f23456789abcdef0"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 วิธีหาอย่างง่าย: เชิญบอทเข้ากลุ่มแล้วคัดลอก Group ID จากแท็บ Webhook Logs ด้านบนมาวางได้เลยครับ
                </p>
              </div>

            </div>

            {/* Event Notification Toggles */}
            <div className="pt-5 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    กำหนดหัวข้อเงื่อนไขการส่งแจ้งเตือนเข้ากลุ่ม (Alert Triggers)
                  </span>
                  <p className="text-xs text-slate-500">เลือกเปิด-ปิดชนิดการแจ้งเตือนพนักงานตามประเภทของสินค้าและคลัง</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={lineConfig.lineBotEnabled}
                    onChange={(e) => updateLineConfig({ lineBotEnabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-xs border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800">เปิดระบบส่งข้อความบอทอัตโนมัติ</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-200 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyInbound}
                    onChange={(e) => updateLineConfig({ notifyInbound: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-xs"
                  />
                  <div>
                    <span className="text-slate-800 font-bold block">1. แจ้งเตือนเมื่อรับสินค้าเข้าคลัง (Inbound Alert)</span>
                    <span className="text-[10px] text-slate-400">ส่งรายละเอียดรหัสรายการ, ยอดรับเข้า, ชื่อผู้รับ, โซนจัดเก็บ</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-200 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyOutbound}
                    onChange={(e) => updateLineConfig({ notifyOutbound: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded-xs"
                  />
                  <div>
                    <span className="text-slate-800 font-bold block">2. แจ้งเตือนเมื่อส่งออกสินค้าคลัง (Outbound Alert)</span>
                    <span className="text-[10px] text-slate-400">ส่งรายชื่อผู้เบิกสินค้า, ยอดเบิกจ่าย, ปลายทาง, คลังและชั้นวาง</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 bg-amber-50/50 hover:bg-amber-50 rounded-xl border border-amber-200/60 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyLowStock}
                    onChange={(e) => updateLineConfig({ notifyLowStock: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded-xs"
                  />
                  <div>
                    <span className="text-amber-950 font-bold block">3. แจ้งเตือนสินค้าใกล้หมดสต๊อก (Low Stock Alert)</span>
                    <span className="text-[10px] text-amber-700">ส่งเตือนทันทีถ้ายอดรวมสินค้าใดต่ำกว่าจุดเตือนภัยขั้นต่ำ</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 bg-rose-50/50 hover:bg-rose-50 rounded-xl border border-rose-200/60 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={lineConfig.notifyDamaged}
                    onChange={(e) => updateLineConfig({ notifyDamaged: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded-xs"
                  />
                  <div>
                    <span className="text-rose-950 font-bold block">4. แจ้งเตือนสินค้าเสียหายหรือชำรุด (Damaged Alert)</span>
                    <span className="text-[10px] text-rose-700">ส่งเตือนทันทีที่มีการอัปเดตยอดของชำรุดในระบบคลัง</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Save Buttons & Feedback */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ระบบจะบันทึกการเปลี่ยนแปลงลงเซิร์ฟเวอร์หลังบ้านแบบถาวร
              </span>

              <div className="flex items-center gap-3">
                {testSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 border border-emerald-200 rounded-xl animate-pulse">
                    ✓ บันทึกการเชื่อมต่อบัญชี LINE สำเร็จ!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  บันทึกการตั้งค่าทั้งหมด
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 2: LINK CONFIGURATOR & SCAN QR ================= */}
      {activeTab === 'liff-links' && (
        <div className="space-y-6">
          
          {/* Domain Resolver Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>ระบุชื่อโดเมนของเซิร์ฟเวอร์คุณ เพื่อคำนวณลิงก์ Webhook และ LIFF</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกโดเมนที่เหมาะสมเพื่อสร้างลิงก์สำเร็จรูป นำไปวางในหน้าจัดการ LINE developers ได้ทันที
              </p>
            </div>

            {/* Select Sources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedUrlSource === 'shared'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
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
                  ✓ เสถียรที่สุด พร้อมใช้งานทันที
                </span>
              </label>

              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedUrlSource === 'current'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
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
                  <span className="font-bold text-slate-900">โดเมนที่เปิดอยู่ ณ ตอนนี้</span>
                </div>
                <p className="font-mono text-[11px] text-slate-500 mt-1 truncate">
                  {currentOrigin || 'กำลังโหลด...'}
                </p>
                <span className="text-[10px] text-slate-500 mt-1 inline-block">
                  (Browser Direct Origin)
                </span>
              </label>

              <label 
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedUrlSource === 'custom'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
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
                  <span className="font-bold text-slate-900">ระบุชื่อโดเมนด้วยตนเอง</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  (เช่น โดเมนที่ได้จาก Render: kasa-wms.onrender.com)
                </p>
              </label>
            </div>

            {/* Custom inputs */}
            {selectedUrlSource === 'custom' && (
              <div className="p-3.5 bg-emerald-50/30 border border-emerald-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  ระบุ URL ของเว็บแอป (เช่น https://kasa-wms.onrender.com):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customDeployedUrl}
                    onChange={(e) => setCustomDeployedUrl(e.target.value)}
                    placeholder="https://your-app.onrender.com"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveCustomDomain(customDeployedUrl)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    ผูกโดเมน
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Links grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Link 1: Webhook URL */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold">
                    1. LINE Webhook Endpoint URL
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Messaging API</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">ลิงก์ใช้กรอกใน LINE Developers Console</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    ก๊อปปี้ลิงก์นี้ไปวางที่ช่อง <strong>Webhook URL</strong> แล้วเปิดสวิตช์ <strong>Use Webhook</strong> เพื่อรับ Event ความเคลื่อนไหวในกลุ่มและแชต
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl break-all border border-slate-800">
                  {generatedWebhookUrl}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => handleCopy(generatedWebhookUrl, 'setup-webhook')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedUrl === 'setup-webhook' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>คัดลอกสำเร็จ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์ Webhook</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Link 2: LIFF Endpoint URL */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-bold">
                    2. LINE LIFF Endpoint URL
                  </span>
                  <span className="text-[10px] text-blue-600 font-bold">LIFF App Creation</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">ลิงก์ปลายทางขณะกดสร้าง LIFF App</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    นำลิงก์นี้ไปใส่ที่หน้าช่อง <strong>Endpoint URL</strong> บนตั้งค่าหน้า LINE Developers ในหมวด LIFF (แนะนำขนาด Full-width)
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-blue-300 font-mono text-xs rounded-xl break-all border border-slate-800">
                  {generatedLiffEndpointUrl}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => handleCopy(generatedLiffEndpointUrl, 'setup-liff-endpoint')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedUrl === 'setup-liff-endpoint' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>คัดลอกสำเร็จ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกลิงก์ Endpoint</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* QR Code and Direct URL access */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                <QrCode className="w-3.5 h-3.5" />
                <span>สแกน QR Code เพื่อเปิดใช้งานผ่านมือถือ</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                สำหรับส่งให้พนักงานคลังสแกนทำงานทันที (LIFF App Link)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                ลิงก์นี้คือ LINE LIFF App ที่พนักงานเปิดใช้งานบนแอปพลิเคชัน LINE เพื่อเช็คสต๊อกสินค้า สแกนตรวจสอบบาร์โค้ด และบันทึกเบิกพัสดุรับเข้าส่งออกได้สะดวกรวดเร็ว
              </p>

              <div className="p-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-xl select-all break-all max-w-xl border border-slate-800">
                {generatedLiffUrl}
              </div>

              <div className="pt-1.5 flex items-center gap-3">
                <button
                  onClick={() => handleCopy(generatedLiffUrl, 'copy-final-liff')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  {copiedUrl === 'copy-final-liff' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอกลิงก์ส่งต่อ</span>
                    </>
                  )}
                </button>

                <a
                  href={generatedLiffUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <span>เปิดทดลองบนเว็บ</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-inner">
                <QRCodeSVG
                  value={generatedLiffUrl}
                  size={150}
                  level="Q"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs font-bold text-slate-900 mt-2.5">
                สแกนด้วย LINE บนสมาร์ทโฟน
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 3: PROLOGUED LOGS VIEW ================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">กิจกรรมทั้งหมด</span>
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 mt-1">{logs.length}</p>
              <p className="text-[10px] text-slate-400">รายการที่เซิร์ฟเวอร์จับได้</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
              <div className="flex items-center justify-between text-blue-500">
                <span className="text-xs font-bold">ข้อความที่ส่งเข้า (Chat)</span>
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-600 mt-1">{messageCount}</p>
              <p className="text-[10px] text-slate-400">จากทั้งแชตส่วนตัวและกลุ่ม</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
              <div className="flex items-center justify-between text-purple-500">
                <span className="text-xs font-bold">บอทเข้ากลุ่ม (Joins)</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-purple-600 mt-1">{joinCount}</p>
              <p className="text-[10px] text-slate-400">ตรวจจับเก็บ Group ID</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-3xs">
              <div className="flex items-center justify-between text-amber-500">
                <span className="text-xs font-bold">เพื่อนติดตามใหม่ (Follows)</span>
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-600 mt-1">{followCount}</p>
              <p className="text-[10px] text-slate-400">สถิติคนเพิ่มเพื่อนบอท</p>
            </div>
          </div>

          {/* Filtering & Operations bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'ทั้งหมด', count: logs.length },
                { id: 'message', label: 'ข้อความเข้า', count: messageCount },
                { id: 'join', label: 'การจัดการกลุ่ม', count: joinCount },
                { id: 'follow', label: 'ผู้ใช้ติดตาม', count: followCount },
                { id: 'verify', label: 'คำขอ Verify', count: logs.filter(l => l.eventType === 'verify').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-1 px-1 bg-slate-200 text-slate-800 rounded-full text-[9px] font-bold">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Clear database logs button */}
            <button
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างประวัติเครื่องรับชั่วคราว</span>
            </button>
          </div>

          {/* Webhook logs list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">รายการ Log กิจกรรมจาก Webhook</span>
              <span className="text-[10px] text-slate-400">คลิกที่แถวรายการเพื่อคลี่ขยายดูข้อมูล JSON Payload ที่ได้รับจาก LINE</span>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Radio className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-600">ยังไม่ได้รับสัญญาณกิจกรรมใดๆ จาก LINE ในช่วงนี้</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  เมื่อระบบของคุณได้รับความเคลื่อนไหว (เช่น มีคนพิมพ์ข้อหาบอท หรือดึงบอทเข้ากลุ่ม) กิจกรรมนั้นจะมาอัปเดตตรงนี้ให้ทันทีแบบเรียลไทม์!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  
                  // Render badge based on eventType / status
                  let statusColor = 'bg-slate-100 text-slate-800 border-slate-200';
                  if (log.status === 'SUCCESS') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (log.status === 'WARNING') statusColor = 'bg-amber-50 text-amber-700 border-amber-200 border';
                  if (log.eventType === 'message') statusColor = 'bg-blue-50 text-blue-700 border-blue-200';

                  return (
                    <div key={log.id} className="transition-all">
                      
                      {/* Accordion header line */}
                      <div 
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="px-5 py-3.5 hover:bg-slate-50/70 flex items-start gap-4 cursor-pointer select-none text-xs"
                      >
                        {/* Time columns */}
                        <div className="text-[11px] font-semibold text-slate-400 shrink-0 mt-0.5 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>

                        {/* Status / Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor} uppercase shrink-0`}>
                          {log.eventType}
                        </span>

                        {/* Main Message details */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="font-bold text-slate-800 break-words leading-relaxed">
                            {log.details}
                          </p>

                          {/* Secondary info row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                            {log.userName && (
                              <span className="font-semibold text-slate-600 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>โดย: {log.userName}</span>
                              </span>
                            )}
                            {log.groupName && (
                              <span className="font-semibold text-purple-600 flex items-center gap-1 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                                <Users className="w-3 h-3 text-purple-400" />
                                <span>ในกลุ่ม: {log.groupName}</span>
                              </span>
                            )}
                            {log.groupId && (
                              <span className="font-mono bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-md text-slate-500">
                                GID: {log.groupId}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Group ID apply button if it has groupId */}
                        {log.groupId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyGroupId(log.groupId!, log.groupName);
                            }}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold shadow-3xs shrink-0 transition-all hidden sm:flex items-center gap-1"
                          >
                            <Database className="w-3 h-3" />
                            <span>ใช้กลุ่มนี้แจ้งสต๊อก</span>
                          </button>
                        )}

                        <div className="text-slate-400 shrink-0 self-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Accordion body expand JSON */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-1.5 bg-slate-950 text-slate-300 font-mono text-[11px] space-y-3 border-t border-slate-800">
                          
                          {/* JSON Copy Button */}
                          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                            <span className="text-[10px] font-sans">📄 RAW JSON PAYLOAD (ได้รับจาก LINE API)</span>
                            <button
                              onClick={() => handleCopy(JSON.stringify(log.rawPayload, null, 2), `json-${log.id}`)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition-all flex items-center gap-1"
                            >
                              {copiedUrl === `json-${log.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">คัดลอก JSON แล้ว!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>คัดลอกข้อมูล JSON</span>
                                </>
                              )}
                            </button>
                          </div>

                          <pre className="overflow-x-auto max-h-80 leading-relaxed text-emerald-300/95 scrollbar-thin scrollbar-thumb-slate-800">
                            {JSON.stringify(log.rawPayload, null, 2)}
                          </pre>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
