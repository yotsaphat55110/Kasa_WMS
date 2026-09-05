import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Warehouse,
  ChevronRight,
  PlusCircle,
  X,
  Smartphone
} from 'lucide-react';
import { InboundModal } from './InboundModal';
import { OutboundModal } from './OutboundModal';

export const LineLiffMobileView: React.FC<{ onExitLiffMode?: () => void }> = ({ onExitLiffMode }) => {
  const {
    products,
    inventory,
    inboundRecords,
    outboundRecords,
    warehouses,
    lineConfig
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low' | 'inbound' | 'outbound'>('all');
  const [isInboundOpen, setIsInboundOpen] = useState(false);
  const [isOutboundOpen, setIsOutboundOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<any | null>(null);

  // Compute stock per product
  const productStockList = products.map(product => {
    const itemInv = inventory.filter(i => i.productId === product.id);
    const goodQty = itemInv.reduce((sum, i) => sum + (i.quantityGood || 0), 0);
    const damagedQty = itemInv.reduce((sum, i) => sum + (i.quantityDamaged || 0), 0);
    const totalQty = goodQty + damagedQty;
    const isLow = totalQty <= product.minThreshold;

    return {
      ...product,
      goodQty,
      damagedQty,
      totalQty,
      isLow
    };
  });

  const lowStockCount = productStockList.filter(p => p.isLow).length;

  const filteredProducts = productStockList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.thaiName && p.thaiName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedFilter === 'low') return matchesSearch && p.isLow;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-16 flex flex-col items-center">
      {/* Container simulating a mobile phone if viewed on wide screen */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col">
        
        {/* Top Header - LINE LIFF Bar */}
        <header className="bg-emerald-700 text-white p-4 sticky top-0 z-30 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-extrabold text-sm border border-white/30">
                K
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span>KASA WMS</span>
                  <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded-full font-mono text-emerald-200">
                    LIFF Mobile
                  </span>
                </h1>
                <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>ระบบจัดการคลังเคมีภัณฑ์</span>
                </p>
              </div>
            </div>

            {onExitLiffMode && (
              <button
                onClick={onExitLiffMode}
                className="text-[11px] bg-emerald-800 hover:bg-emerald-900 text-emerald-100 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                title="สลับไปยังหน้าจอ Desktop"
              >
                ดูแบบ PC
              </button>
            )}
          </div>
        </header>

        {/* Quick Notification Pill */}
        {lowStockCount > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>มีสินค้าสต๊อกต่ำกว่าเกณฑ์ <strong>{lowStockCount}</strong> รายการ</span>
            </div>
            <button
              onClick={() => setSelectedFilter('low')}
              className="text-[11px] font-bold text-amber-800 underline ml-2"
            >
              ดูรายการ
            </button>
          </div>
        )}

        {/* Action Buttons for Mobile Warehouse Workers */}
        <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setIsInboundOpen(true)}
            className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-sm hover:shadow active:scale-98 transition-all flex flex-col items-center justify-center gap-1"
          >
            <ArrowDownLeft className="w-6 h-6" />
            <span className="text-xs font-bold">บันทึกรับเข้า</span>
            <span className="text-[10px] text-emerald-100 font-normal">Inbound Stock</span>
          </button>

          <button
            onClick={() => setIsOutboundOpen(true)}
            className="p-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl shadow-sm hover:shadow active:scale-98 transition-all flex flex-col items-center justify-center gap-1"
          >
            <ArrowUpRight className="w-6 h-6" />
            <span className="text-xs font-bold">บันทึกส่งออก</span>
            <span className="text-[10px] text-sky-100 font-normal">Outbound Dispatch</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส หรือชื่อสารเคมี..."
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              สินค้าทั้งหมด ({products.length})
            </button>
            <button
              onClick={() => setSelectedFilter('low')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1 ${
                selectedFilter === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100/60 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>ใกล้หมด ({lowStockCount})</span>
            </button>
            <button
              onClick={() => setSelectedFilter('inbound')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                selectedFilter === 'inbound'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ประวัติรับเข้า ({inboundRecords.length})
            </button>
            <button
              onClick={() => setSelectedFilter('outbound')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                selectedFilter === 'outbound'
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ประวัติส่งออก ({outboundRecords.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-4 space-y-2.5 overflow-y-auto pb-6">
          
          {/* Products & Inventory Tab */}
          {(selectedFilter === 'all' || selectedFilter === 'low') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                <span>รายการสินค้าเคมีภัณฑ์ ({filteredProducts.length})</span>
                <span>สต๊อกสภาพดี / ทั้งหมด</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  ไม่พบสินค้าตรงกับคำค้นหา
                </div>
              ) : (
                filteredProducts.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProductDetails(prod)}
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between gap-3 active:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {prod.code}
                        </span>
                        {prod.isLow && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            เตือนสต๊อกต่ำ
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 mt-1 truncate">
                        {prod.name}
                      </h3>
                      {prod.thaiName && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {prod.thaiName}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        บรรจุ: {prod.container || 'ถุง'} | ขนาด: {prod.size || '-'} {prod.unit}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-sm font-extrabold text-emerald-800">
                          {prod.goodQty.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500">{prod.unit}</span>
                      </div>
                      {prod.damagedQty > 0 && (
                        <p className="text-[10px] text-rose-600 font-semibold">
                          ชำรุด {prod.damagedQty.toLocaleString()} {prod.unit}
                        </p>
                      )}
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        เกณฑ์เตือน: {prod.minThreshold} {prod.unit}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Inbound History Tab */}
          {selectedFilter === 'inbound' && (
            <div className="space-y-2">
              <span className="text-[11px] text-slate-500 font-semibold px-1 block">
                ประวัติรับเข้าสินค้าล่าสุด ({inboundRecords.length})
              </span>
              {inboundRecords.slice(0, 15).map(inb => (
                <div key={inb.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {inb.transactionCode}
                    </span>
                    <span className="text-[10px] text-slate-400">{inb.date} {inb.time}</span>
                  </div>
                  <p className="font-bold text-slate-900">{inb.productName} ({inb.productCode})</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>จำนวน: <strong className="text-emerald-700">+{inb.quantity.toLocaleString()} {inb.unit}</strong></span>
                    <span>{inb.warehouseName} / {inb.zoneName}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">ผู้รับ: {inb.receiverName}</p>
                </div>
              ))}
            </div>
          )}

          {/* Outbound History Tab */}
          {selectedFilter === 'outbound' && (
            <div className="space-y-2">
              <span className="text-[11px] text-slate-500 font-semibold px-1 block">
                ประวัติส่งออกสินค้าล่าสุด ({outboundRecords.length})
              </span>
              {outboundRecords.slice(0, 15).map(outb => (
                <div key={outb.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                      {outb.transactionCode}
                    </span>
                    <span className="text-[10px] text-slate-400">{outb.date} {outb.time}</span>
                  </div>
                  <p className="font-bold text-slate-900">{outb.productName} ({outb.productCode})</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>จำนวน: <strong className="text-sky-700">-{outb.quantity.toLocaleString()} {outb.unit}</strong></span>
                    <span>{outb.warehouseName} / {outb.zoneName}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">ปลายทาง: {outb.destination || '-'}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Mobile Product Detail Bottom Sheet / Modal */}
        {selectedProductDetails && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
            <div className="w-full max-w-md bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {selectedProductDetails.code}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedProductDetails.name}
                  </h2>
                  {selectedProductDetails.thaiName && (
                    <p className="text-xs text-slate-500">{selectedProductDetails.thaiName}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedProductDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block">คงเหลือสภาพดี</span>
                  <span className="text-lg font-bold text-emerald-800">
                    {selectedProductDetails.goodQty.toLocaleString()} {selectedProductDetails.unit}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">เกณฑ์เตือนสต๊อกต่ำ</span>
                  <span className="text-lg font-bold text-slate-800">
                    {selectedProductDetails.minThreshold} {selectedProductDetails.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p><strong>สูตรเคมี:</strong> {selectedProductDetails.chemicalFormula || '-'}</p>
                <p><strong>ลักษณะ:</strong> {selectedProductDetails.characters || '-'}</p>
                <p><strong>ภาชนะบรรจุ:</strong> {selectedProductDetails.container || '-'}</p>
                <p><strong>ขนาดบรรจุ:</strong> {selectedProductDetails.size || '-'} {selectedProductDetails.unit}</p>
                <p><strong>ผู้ผลิต/ยี่ห้อ:</strong> {selectedProductDetails.brand || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedProductDetails(null);
                    setIsInboundOpen(true);
                  }}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>รับเข้าสินค้านี้</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedProductDetails(null);
                    setIsOutboundOpen(true);
                  }}
                  className="py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>เบิกจ่ายสินค้านี้</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Action Modals */}
      <InboundModal
        isOpen={isInboundOpen}
        onClose={() => setIsInboundOpen(false)}
      />
      <OutboundModal
        isOpen={isOutboundOpen}
        onClose={() => setIsOutboundOpen(false)}
      />
    </div>
  );
};
