import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCondition, Product } from '../types';
import { X, ArrowUpRight, AlertCircle, CheckCircle2, Plus, Trash2, Search, QrCode } from 'lucide-react';

interface OutboundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OutboundRow {
  id: string;
  productId: string;
  quantity: number;
  condition: ProductCondition;
  warehouseId: string;
  zoneId: string;
}

export const OutboundModal: React.FC<OutboundModalProps> = ({ isOpen, onClose }) => {
  const { products, warehouses, inventory, currentUser, addOutbound, t } = useApp();

  const [dispatcherName, setDispatcherName] = useState<string>(`${currentUser.firstName} ${currentUser.lastName}`);
  const [recorderName, setRecorderName] = useState<string>(`${currentUser.firstName} ${currentUser.lastName}`);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [destination, setDestination] = useState<string>('บมจ.เคมีอุตสาหกรรมไทย (นิคมบางปู)');
  const [details, setDetails] = useState<string>('');

  // Default warehouse & zone
  const defaultWh = warehouses[0]?.id || '';
  const defaultZone = warehouses[0]?.zones[0]?.id || '';

  // Multi-item rows
  const [items, setItems] = useState<OutboundRow[]>([
    {
      id: `row-1`,
      productId: products[0]?.id || '',
      quantity: 50,
      condition: 'GOOD',
      warehouseId: defaultWh,
      zoneId: defaultZone
    }
  ]);

  // QR Code / Quick Product Search State
  const [qrInput, setQrInput] = useState('');
  const [qrFeedback, setQrFeedback] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  // Helper to calculate available stock in chosen WH & Zone
  const getAvailableStock = (prodId: string, whId: string, zId: string, cond: ProductCondition) => {
    const currentInv = inventory.find(
      inv => inv.productId === prodId && inv.warehouseId === whId && inv.zoneId === zId
    );
    if (!currentInv) return 0;
    return cond === 'DAMAGED' ? currentInv.quantityDamaged : currentInv.quantityGood;
  };

  // Handle Scan or QR Code input
  const handleQRScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQrFeedback('');
    if (!qrInput.trim()) return;

    const queryStr = qrInput.trim().toLowerCase();
    const matchedProduct = products.find(
      p => p.code.toLowerCase() === queryStr || p.id === qrInput.trim() || p.name.toLowerCase().includes(queryStr)
    );

    if (matchedProduct) {
      const existingIdx = items.findIndex(i => i.productId === matchedProduct.id);
      if (existingIdx >= 0) {
        setItems(prev => prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + 50 } : item));
        setQrFeedback(`เพิ่มจำนวนให้สินค้า [${matchedProduct.code}] ${matchedProduct.name} (+50)`);
      } else {
        setItems(prev => [
          ...prev,
          {
            id: `row-${Date.now()}`,
            productId: matchedProduct.id,
            quantity: 50,
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
        quantity: 50,
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

  const handleUpdateItem = (rowId: string, field: keyof OutboundRow, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== rowId) return item;
      const updated = { ...item, [field]: value };
      
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

    if (!dispatcherName.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้ส่งออกสินค้า');
      return;
    }

    // Validate each row for stock availability
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const prod = products.find(p => p.id === row.productId);
      if (!row.productId) {
        setErrorMsg(`รายการที่ ${i + 1}: กรุณาเลือกสินค้า`);
        return;
      }
      if (row.quantity <= 0) {
        setErrorMsg(`รายการที่ ${i + 1}: จำนวนส่งออกต้องมากกว่า 0`);
        return;
      }

      // Note: Zone stock constraints relaxed as requested; warnings displayed instead of blocking
      if (row.quantity <= 0) {
        setErrorMsg(`รายการที่ ${i + 1}: จำนวนส่งออกต้องมากกว่า 0`);
        return;
      }
    }

    let successCount = 0;
    let failedCount = 0;

    items.forEach(row => {
      const activeProduct = products.find(p => p.id === row.productId);
      const activeWh = warehouses.find(w => w.id === row.warehouseId);
      const activeZone = activeWh?.zones.find(z => z.id === row.zoneId);

      if (activeProduct && activeWh) {
        const res = addOutbound({
          productId: activeProduct.id,
          productCode: activeProduct.code,
          productName: activeProduct.name,
          details: details.trim() || 'ส่งออกสินค้าตามคำสั่งซื้อ',
          condition: row.condition,
          dispatcherName: dispatcherName.trim(),
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
          destination
        });

        if (res.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }
    });

    if (successCount > 0 && failedCount === 0) {
      setSuccessMsg(`บันทึกส่งออกสินค้าสำเร็จจำนวน ${successCount} รายการ!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1300);
    } else {
      setErrorMsg(`บันทึกสำเร็จ ${successCount} รายการ, เกิดข้อผิดพลาด ${failedCount} รายการ`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 my-6">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-md">
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t.outbound.modalTitle} (หลายรายการได้)</h3>
              <p className="text-[11px] text-slate-400">สแกน QR Code หรือเลือกสินค้าเพื่อตัดยอดสต๊อกคลังและโซนอัตโนมัติ</p>
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
          <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-sky-600" />
                <span>สแกน QR Code หรือพิมพ์รหัสสินค้าเพื่อส่งออกด่วน (Quick Scan & Dispatch)</span>
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-sky-300 rounded-lg focus:ring-2 focus:ring-sky-500/30 text-slate-900 font-mono"
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
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มสินค้า</span>
              </button>
            </div>
            {qrFeedback && (
              <p className={`text-[11px] font-medium ${qrFeedback.includes('ไม่พบ') ? 'text-rose-600' : 'text-blue-700'}`}>
                {qrFeedback}
              </p>
            )}
          </div>

          {/* General Outbound Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ผู้ส่งออกสินค้าจริง (Dispatcher) *
              </label>
              <input
                type="text"
                value={dispatcherName}
                onChange={(e) => setDispatcherName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-sky-500/20 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                วันที่ส่งออก (Date)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-sky-500/20 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                เวลาส่งออก (Time)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-sky-500/20 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ปลายทาง / ลูกค้า (Destination)
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
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
                หมายเหตุ / คำสั่งซื้อ
              </label>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="ระบุวัตถุประสงค์หรือใบสั่งซื้อ"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800"
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                รายการสินค้าในใบส่งออกนี้ ({items.length} รายการ)
              </span>
              <button
                type="button"
                onClick={() => handleAddItemRow()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
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
                const availStock = getAvailableStock(row.productId, row.warehouseId, row.zoneId, row.condition);
                const isOverStock = row.quantity > availStock;

                return (
                  <div 
                    key={row.id} 
                    className={`p-3.5 bg-white border rounded-xl shadow-2xs space-y-3 relative group ${
                      isOverStock ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900">รายการที่ {index + 1}</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          (คงเหลือในคลัง/โซน: <strong className={availStock > 0 ? 'text-sky-700' : 'text-rose-600'}>{availStock.toLocaleString()} {prod?.unit}</strong>)
                        </span>
                      </div>

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
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-sky-500/20 font-medium text-slate-800"
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
                          className={`w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border rounded-md focus:ring-2 focus:ring-sky-500/20 ${
                            isOverStock ? 'text-amber-700 border-amber-300' : 'text-sky-800 border-slate-200'
                          }`}
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
                          ตัดจากคลัง & โซน *
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

                    {isOverStock && (
                      <div className="p-2 bg-amber-50 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                        <span>⚠️ แจ้งเตือน: ในโซนนี้ไม่มีของ/สินค้าคงเหลือไม่พอ (คงเหลือ {availStock.toLocaleString()} {prod?.unit || 'หน่วย'}) - ระบบบันทึกส่งออกให้ตามปกติ</span>
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

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-medium text-slate-700 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-2xs transition-colors"
              >
                บันทึกส่งออก ({items.length} รายการ)
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

