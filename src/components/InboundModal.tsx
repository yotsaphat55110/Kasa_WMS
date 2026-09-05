import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCondition, Product } from '../types';
import { X, ArrowDownLeft, AlertCircle, CheckCircle2, Plus, Trash2, Search, QrCode, Building2, MapPin, Camera, Printer, Send } from 'lucide-react';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { PrintDocumentModal, PrintDocumentData } from './PrintDocumentModal';

interface InboundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InboundRow {
  id: string;
  productId: string;
  quantity: number;
  condition: ProductCondition;
  warehouseId: string;
  zoneId: string;
  damageNote?: string;
}

export const InboundModal: React.FC<InboundModalProps> = ({ isOpen, onClose }) => {
  const { products, warehouses, currentUser, addInbound, lineConfig, t } = useApp();

  const [receiverName, setReceiverName] = useState<string>(`${currentUser.firstName} ${currentUser.lastName}`);
  const [recorderName, setRecorderName] = useState<string>(`${currentUser.firstName} ${currentUser.lastName}`);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [details, setDetails] = useState<string>('');
  const [supplierOrSource, setSupplierOrSource] = useState<string>('หจก. เคเอเอสเอ (KASA Limited Partnership)');

  // Default warehouse & zone
  const defaultWh = warehouses[0]?.id || '';
  const defaultZone = warehouses[0]?.zones[0]?.id || '';

  // Multi-item rows
  const [items, setItems] = useState<InboundRow[]>([
    {
      id: `row-1`,
      productId: products[0]?.id || '',
      quantity: 100,
      condition: 'GOOD',
      warehouseId: defaultWh,
      zoneId: defaultZone
    }
  ]);

  // Camera & Print states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [completedDocData, setCompletedDocData] = useState<PrintDocumentData | null>(null);

  // QR Code / Quick Product Search State
  const [qrInput, setQrInput] = useState('');
  const [qrFeedback, setQrFeedback] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  // Handle Scan from Camera
  const handleCameraScanned = (decodedText: string) => {
    setQrFeedback('');
    const queryStr = decodedText.trim().toLowerCase();
    const matchedProduct = products.find(
      p => p.code.toLowerCase() === queryStr || p.id === decodedText.trim() || p.name.toLowerCase().includes(queryStr)
    );

    if (matchedProduct) {
      const existingIdx = items.findIndex(i => i.productId === matchedProduct.id);
      if (existingIdx >= 0) {
        setItems(prev => prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + 100 } : item));
        setQrFeedback(`📷 สแกนติดสำเร็จ: เพิ่มจำนวนให้ [${matchedProduct.code}] ${matchedProduct.name} (+100)`);
      } else {
        setItems(prev => [
          ...prev,
          {
            id: `row-${Date.now()}`,
            productId: matchedProduct.id,
            quantity: 100,
            condition: 'GOOD',
            warehouseId: defaultWh,
            zoneId: defaultZone
          }
        ]);
        setQrFeedback(`📷 สแกนติดสำเร็จ: เพิ่มสินค้า [${matchedProduct.code}] ${matchedProduct.name} เข้าในรายการแล้ว`);
      }
    } else {
      setQrFeedback(`📷 สแกนพบบาร์โค้ด "${decodedText}" แต่ยังไม่มีในระบบแคตตาล็อก`);
    }
  };

  // Handle Scan or QR Code input manually
  const handleQRScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQrFeedback('');
    if (!qrInput.trim()) return;

    const queryStr = qrInput.trim().toLowerCase();
    const matchedProduct = products.find(
      p => p.code.toLowerCase() === queryStr || p.id === qrInput.trim() || p.name.toLowerCase().includes(queryStr)
    );

    if (matchedProduct) {
      // Check if product already in items
      const existingIdx = items.findIndex(i => i.productId === matchedProduct.id);
      if (existingIdx >= 0) {
        setItems(prev => prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + 100 } : item));
        setQrFeedback(`เพิ่มจำนวนให้สินค้า [${matchedProduct.code}] ${matchedProduct.name} เรียบร้อย (+100)`);
      } else {
        setItems(prev => [
          ...prev,
          {
            id: `row-${Date.now()}`,
            productId: matchedProduct.id,
            quantity: 100,
            condition: 'GOOD',
            warehouseId: defaultWh,
            zoneId: defaultZone
          }
        ]);
        setQrFeedback(`เพิ่มสินค้า [${matchedProduct.code}] ${matchedProduct.name} เข้าในรายการแล้ว`);
      }
      setQrInput('');
    } else {
      setQrFeedback(`ไม่พบรหัสสินค้า/QR Code "${qrInput}" ในระบบแคตตาล็อก`);
    }
  };

  const handleAddItemRow = (productIdToUse?: string) => {
    const prodId = productIdToUse || (products[0]?.id || '');
    setItems(prev => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: prodId,
        quantity: 100,
        condition: 'GOOD',
        warehouseId: defaultWh,
        zoneId: defaultZone
      }
    ]);
  };

  const handleRemoveItemRow = (rowId: string) => {
    if (items.length <= 1) {
      setErrorMsg('ต้องมีอย่างน้อย 1 รายการสินค้า');
      return;
    }
    setItems(prev => prev.filter(i => i.id !== rowId));
  };

  const handleUpdateItem = (rowId: string, field: keyof InboundRow, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== rowId) return item;
      const updated = { ...item, [field]: value };
      
      // If warehouse changed, reset zoneId to first zone of new warehouse
      if (field === 'warehouseId') {
        const wh = warehouses.find(w => w.id === value);
        if (wh && wh.zones.length > 0) {
          updated.zoneId = wh.zones[0].id;
        }
      }
      return updated;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (items.length === 0) {
      setErrorMsg('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    if (!receiverName.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้รับสินค้า');
      return;
    }

    // Validate each row
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.productId) {
        setErrorMsg(`รายการที่ ${i + 1}: กรุณาเลือกสินค้า`);
        return;
      }
      if (row.quantity <= 0) {
        setErrorMsg(`รายการที่ ${i + 1}: จำนวนรับเข้าต้องมากกว่า 0`);
        return;
      }
      if (!row.warehouseId || !row.zoneId) {
        setErrorMsg(`รายการที่ ${i + 1}: กรุณาเลือกคลังและโซนจัดเก็บ`);
        return;
      }
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each item in transaction
    items.forEach(row => {
      const activeProduct = products.find(p => p.id === row.productId);
      const activeWh = warehouses.find(w => w.id === row.warehouseId);
      const activeZone = activeWh?.zones.find(z => z.id === row.zoneId);

      if (activeProduct && activeWh) {
        const res = addInbound({
          productId: activeProduct.id,
          productCode: activeProduct.code,
          productName: activeProduct.name,
          details: details.trim() || 'รับสินค้าเข้าคลังปกติ',
          condition: row.condition,
          receiverName: receiverName.trim(),
          recorderName: recorderName.trim(),
          recorderId: currentUser.id,
          date,
          time,
          quantity: row.quantity,
          unit: activeProduct.unit,
          warehouseId: activeWh.id,
          warehouseName: activeWh.name,
          zoneId: activeZone?.id || '',
          zoneName: activeZone?.name || '',
          damageNote: row.condition === 'DAMAGED' ? row.damageNote : undefined,
          supplierOrSource
        });

        if (res.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }
    });

    if (successCount > 0 && failedCount === 0) {
      const docNo = `INB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const printData: PrintDocumentData = {
        type: 'inbound',
        documentNo: docNo,
        date,
        time,
        operatorName: receiverName.trim(),
        recorderName: recorderName.trim(),
        partnerName: supplierOrSource,
        referenceNo: details.slice(0, 30),
        note: details,
        items: items.map(row => {
          const p = products.find(x => x.id === row.productId);
          const w = warehouses.find(x => x.id === row.warehouseId);
          const z = w?.zones.find(x => x.id === row.zoneId);
          return {
            productCode: p?.code || '',
            productName: p?.name || '',
            chemicalFormula: p?.chemicalFormula,
            container: p?.container,
            size: p?.size,
            quantity: row.quantity,
            unit: p?.unit || 'หน่วย',
            warehouseName: w?.name || '',
            zoneName: z?.name || '',
            condition: row.condition,
            damageNote: row.damageNote
          };
        })
      };

      setCompletedDocData(printData);
      setSuccessMsg(`🎉 บันทึกรับเข้าสินค้าสำเร็จจำนวน ${successCount} รายการ!`);

      // Automatic LINE Notification
      if (lineConfig.notifyInbound !== false) {
        fetch('/api/line/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelAccessToken: lineConfig.channelAccessToken,
            targetId: lineConfig.lineBotGroupId,
            type: 'inbound',
            title: '📦 บันทึกรับเข้าสินค้าสำเร็จ (INBOUND)',
            data: {
              transactionCode: docNo,
              operatorName: receiverName.trim(),
              partnerName: supplierOrSource,
              note: details,
              items: printData.items
            }
          })
        }).catch(err => console.warn('LINE notification dispatch failed:', err));
      }
    } else {
      setErrorMsg(`บันทึกสำเร็จ ${successCount} รายการ, เกิดข้อผิดพลาด ${failedCount} รายการ`);
    }
  };

  // Filtered products for row select / search
  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    const q = productSearch.toLowerCase();
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.chemicalFormula.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-6">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-md">
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t.inbound.modalTitle} (หลายรายการได้)</h3>
              <p className="text-[11px] text-slate-400">สแกน QR Code หรือเลือกสินค้าเพื่อเพิ่มเข้าคลังย่อยและอัปเดตสต๊อก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Scan QR Code / Product Search Bar */}
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>สแกน QR Code หรือพิมพ์รหัสสินค้าเพื่อเพิ่มด่วน (Quick Scan & Add)</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="สแกนหรือพิมพ์รหัสสินค้า (เช่น KASA-001) แล้วกด Enter..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500/30 text-slate-900 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQRScanSubmit(e);
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleQRScanSubmit}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มสินค้า</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                title="เปิดกล้องมือถือหรือเว็บแคมเพื่อสแกนบาร์โค้ดสด"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>เปิดกล้องสแกน</span>
              </button>
            </div>
            {qrFeedback && (
              <p className={`text-[11px] font-medium ${qrFeedback.includes('ไม่พบ') ? 'text-rose-600' : 'text-emerald-700'}`}>
                {qrFeedback}
              </p>
            )}
          </div>

          {/* Success Banner with Direct Print Button if Saved */}
          {completedDocData && (
            <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">บันทึกรับเข้าคลังเรียบร้อยแล้ว!</h4>
                  <p className="text-xs text-emerald-800">
                    เลขที่เอกสาร: <span className="font-mono font-bold">{completedDocData.documentNo}</span> &bull; {lineConfig.notifyInbound !== false ? '📱 ส่งการแจ้งเตือนเข้า LINE เรียบร้อย' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPrintOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  สั่งพิมพ์ใบรับเข้า A4
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  เสร็จสิ้น (ปิด)
                </button>
              </div>
            </div>
          )}

          {/* General Inbound Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ผู้รับสินค้าจริง (Receiver) *
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                วันที่รับเข้า (Date)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                เวลารับเข้า (Time)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ผู้จัดส่ง / แหล่งที่มา (Supplier)
              </label>
              <input
                type="text"
                value={supplierOrSource}
                onChange={(e) => setSupplierOrSource(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ผู้ลงข้อมูล (Recorded By)
              </label>
              <input
                type="text"
                value={recorderName}
                onChange={(e) => setRecorderName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                หมายเหตุ / อ้างอิง
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="ระบุหมายเลขล็อต/ใบส่งสินค้า"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                รายการสินค้าในใบรับเข้านี้ ({items.length} รายการ)
              </span>
              <button
                type="button"
                onClick={() => handleAddItemRow()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มรายการสินค้า</span>
              </button>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              {items.map((row, index) => {
                const prod = products.find(p => p.id === row.productId);
                const activeWh = warehouses.find(w => w.id === row.warehouseId);

                return (
                  <div 
                    key={row.id} 
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        <span>รายการสินค้าที่ {index + 1}</span>
                      </span>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Product Select (Span 5) */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          สินค้า *
                        </label>
                        <select
                          value={row.productId}
                          onChange={(e) => handleUpdateItem(row.id, 'productId', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800"
                          required
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.code}] {p.name} ({p.chemicalFormula})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity (Span 2) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          จำนวน ({prod?.unit || 'กก.'}) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleUpdateItem(row.id, 'quantity', Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500/20"
                          required
                        />
                      </div>

                      {/* Condition (Span 2) */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          สภาพ *
                        </label>
                        <select
                          value={row.condition}
                          onChange={(e) => handleUpdateItem(row.id, 'condition', e.target.value as ProductCondition)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                        >
                          <option value="GOOD">ของปกติ</option>
                          <option value="DAMAGED">สินค้าชำรุด</option>
                        </select>
                      </div>

                      {/* Warehouse (Span 3) */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          คลัง & โซนจัดเก็บ *
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={row.warehouseId}
                            onChange={(e) => handleUpdateItem(row.id, 'warehouseId', e.target.value)}
                            className="w-full px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                          >
                            {warehouses.map(w => (
                              <option key={w.id} value={w.id}>{w.name.split(' ')[0]}</option>
                            ))}
                          </select>
                          <select
                            value={row.zoneId}
                            onChange={(e) => handleUpdateItem(row.id, 'zoneId', e.target.value)}
                            className="w-full px-2 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                          >
                            {activeWh?.zones.map(z => (
                              <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {row.condition === 'DAMAGED' && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={row.damageNote || ''}
                          onChange={(e) => handleUpdateItem(row.id, 'damageNote', e.target.value)}
                          placeholder="ระบุสาเหตุการชำรุดเสียหาย..."
                          className="w-full px-2.5 py-1 text-xs bg-rose-50 border border-rose-200 text-rose-900 rounded-md"
                        />
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              รวม <strong className="text-slate-900 font-bold">{items.length}</strong> รายการสินค้า
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const docNo = `INB-PREVIEW-${Date.now().toString().slice(-4)}`;
                  const previewData: PrintDocumentData = {
                    type: 'inbound',
                    documentNo: docNo,
                    date,
                    time,
                    operatorName: receiverName.trim() || 'ผู้รับสินค้า',
                    recorderName: recorderName.trim() || 'ผู้บันทึก',
                    partnerName: supplierOrSource,
                    referenceNo: details.slice(0, 30),
                    note: details,
                    items: items.map(row => {
                      const p = products.find(x => x.id === row.productId);
                      const w = warehouses.find(x => x.id === row.warehouseId);
                      const z = w?.zones.find(x => x.id === row.zoneId);
                      return {
                        productCode: p?.code || '',
                        productName: p?.name || '',
                        chemicalFormula: p?.chemicalFormula,
                        container: p?.container,
                        size: p?.size,
                        quantity: row.quantity,
                        unit: p?.unit || 'หน่วย',
                        warehouseName: w?.name || '',
                        zoneName: z?.name || '',
                        condition: row.condition,
                        damageNote: row.damageNote
                      };
                    })
                  };
                  setCompletedDocData(previewData);
                  setIsPrintOpen(true);
                }}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="เปิดดูตัวอย่างใบรับสินค้าเข้าคลัง A4 และสั่งพิมพ์"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>พิมพ์ใบรับเข้า A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-medium text-slate-700 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                บันทึกรับเข้า ({items.length} รายการ)
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* Live Camera Barcode Scanner Modal */}
      <CameraBarcodeScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={handleCameraScanned}
        title="สแกนบาร์โค้ดรับเข้าสินค้า"
        subtitle="หันกล้องไปที่บาร์โค้ดสินค้าเคมีภัณฑ์เพื่อเพิ่มเข้าใบรับเข้า"
      />

      {/* Printable A4 Document Modal */}
      <PrintDocumentModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        docData={completedDocData}
      />
    </div>
  );
};

