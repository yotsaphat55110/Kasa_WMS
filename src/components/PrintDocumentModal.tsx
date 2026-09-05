import React from 'react';
import { X, Printer, FileText, CheckCircle2, AlertTriangle, Building2, Calendar, User, Package } from 'lucide-react';
import { InboundRecord, OutboundRecord } from '../types';

export interface PrintItem {
  productCode: string;
  productName: string;
  chemicalFormula?: string;
  size?: string;
  container?: string;
  quantity: number;
  unit: string;
  warehouseName: string;
  zoneName: string;
  condition: 'GOOD' | 'DAMAGED';
  damageNote?: string;
}

export interface PrintDocumentData {
  type: 'inbound' | 'outbound';
  documentNo: string;
  date: string;
  time: string;
  operatorName: string; // receiverName or dispatcherName
  recorderName: string;
  partnerName?: string; // supplierOrSource or destination
  referenceNo?: string;
  note?: string;
  items: PrintItem[];
}

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  docData: PrintDocumentData | null;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  isOpen,
  onClose,
  docData
}) => {
  if (!isOpen || !docData) return null;

  const isInbound = docData.type === 'inbound';
  const docTitleThai = isInbound ? 'ใบรับสินค้าเข้าคลัง (GOODS RECEIPT NOTE)' : 'ใบสั่งจ่าย / ใบส่งสินค้า (DELIVERY ORDER)';
  const docBadgeColor = isInbound ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-sky-700 bg-sky-50 border-sky-200';

  const totalQuantity = docData.items.reduce((sum, it) => sum + it.quantity, 0);
  const totalDamaged = docData.items.filter(it => it.condition === 'DAMAGED').reduce((sum, it) => sum + it.quantity, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Action Bar (Hidden when printing) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isInbound ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{docTitleThai}</h3>
              <p className="text-xs text-slate-400">เลขที่: <span className="font-mono text-white font-semibold">{docData.documentNo}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              สั่งพิมพ์เอกสาร A4 / บันทึก PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Area) */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-10 bg-slate-100 print:p-0 print:bg-white">
          <div
            id="kasa-printable-slip"
            className="w-full max-w-[210mm] mx-auto bg-white p-8 sm:p-12 shadow-sm rounded-lg border border-slate-200 print:border-none print:shadow-none print:p-0 text-slate-800 font-sans"
          >
            {/* Slip Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-black text-2xl tracking-wider text-slate-900">KASA</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-white tracking-widest uppercase">
                    Chemical Logistics
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 mt-1">{docTitleThai}</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  ระบบบริหารจัดการคลังสินค้าเคมีภัณฑ์ KASA WMS &bull; เอกสารทางการ
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block border border-slate-300 rounded-lg p-3 bg-slate-50 text-left min-w-[200px]">
                  <div className="text-[11px] text-slate-500 font-medium">เลขที่เอกสาร (Doc No.):</div>
                  <div className="text-sm font-bold font-mono text-slate-900">{docData.documentNo}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">วันที่ (Date):</div>
                  <div className="text-xs font-semibold text-slate-800">{docData.date} ({docData.time} น.)</div>
                </div>
              </div>
            </div>

            {/* Meta Details 2-Columns */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28 font-medium">ประเภทรายการ:</span>
                  <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${docBadgeColor}`}>
                    {isInbound ? '📥 รับเข้าสินค้า (Inbound)' : '📤 เบิกจ่าย / ส่งมอบ (Outbound)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28 font-medium">
                    {isInbound ? 'แหล่งที่มา / ผู้ส่งมอบ:' : 'ปลายทาง / ผู้รับสินค้า:'}
                  </span>
                  <span className="font-bold text-slate-900">{docData.partnerName || '-'}</span>
                </div>
                {docData.referenceNo && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 w-28 font-medium">เลขอ้างอิง / PO:</span>
                    <span className="font-mono font-bold text-slate-900">{docData.referenceNo}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28 font-medium">
                    {isInbound ? 'ผู้รับมอบสินค้า:' : 'ผู้จ่ายสินค้า:'}
                  </span>
                  <span className="font-bold text-slate-900">{docData.operatorName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-28 font-medium">ผู้บันทึกข้อมูล:</span>
                  <span className="font-semibold text-slate-800">{docData.recorderName}</span>
                </div>
                {docData.note && (
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 w-28 font-medium">หมายเหตุ:</span>
                    <span className="text-slate-700 italic">{docData.note}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">รหัสสินค้า / SKU</th>
                    <th className="py-2.5 px-3">ชื่อสินค้า & ข้อมูลเคมี</th>
                    <th className="py-2.5 px-3">สถานที่จัดเก็บ</th>
                    <th className="py-2.5 px-3 text-center">สภาพ</th>
                    <th className="py-2.5 px-3 text-right">จำนวน</th>
                    <th className="py-2.5 px-3 text-center">หน่วย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {docData.items.map((item, idx) => (
                    <tr key={idx} className={item.condition === 'DAMAGED' ? 'bg-rose-50/50' : ''}>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.productCode}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        {item.chemicalFormula && (
                          <div className="text-[11px] text-slate-500 font-mono">สูตรเคมี: {item.chemicalFormula}</div>
                        )}
                        {(item.container || item.size) && (
                          <div className="text-[10px] text-slate-400">บรรจุ: {item.container} {item.size}</div>
                        )}
                        {item.damageNote && (
                          <div className="text-[10px] text-rose-600 font-medium mt-0.5">⚠️ เหตุผลชำรุด: {item.damageNote}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="font-semibold">{item.warehouseName}</div>
                        <div className="text-[11px] text-slate-500">{item.zoneName}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.condition === 'DAMAGED' ? (
                          <span className="font-bold text-rose-600 px-1.5 py-0.5 bg-rose-100 rounded text-[10px]">
                            ชำรุด
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700 px-1.5 py-0.5 bg-emerald-100 rounded text-[10px]">
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-4 text-right text-slate-700">
                      รวมทั้งสิ้น ({docData.items.length} รายการ):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-sm">
                      {totalQuantity.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">หน่วย</td>
                  </tr>
                  {totalDamaged > 0 && (
                    <tr className="text-rose-700 bg-rose-50/60 text-[11px]">
                      <td colSpan={5} className="py-1 px-4 text-right">พบสินค้าชำรุดรวม:</td>
                      <td className="py-1 px-3 text-right font-mono font-bold">{totalDamaged.toLocaleString()}</td>
                      <td className="py-1 px-3 text-center">หน่วย</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Signature Columns */}
            <div className="mt-10 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-4 gap-4 text-center">
                {/* 1 */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
                  <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="text-[11px] text-slate-400">................................................</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 mt-2">ผู้จัดทำเอกสาร</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">({docData.recorderName})</div>
                  <div className="text-[9px] text-slate-400 mt-1">วันที่ ...../...../..........</div>
                </div>

                {/* 2 */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
                  <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="text-[11px] text-slate-400">................................................</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 mt-2">
                    {isInbound ? 'ผู้จัดส่ง / พนักงานขับรถ' : 'ผู้จ่ายสินค้า'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">({isInbound ? (docData.partnerName || 'ผู้จัดส่ง') : docData.operatorName})</div>
                  <div className="text-[9px] text-slate-400 mt-1">วันที่ ...../...../..........</div>
                </div>

                {/* 3 */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
                  <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="text-[11px] text-slate-400">................................................</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 mt-2">
                    {isInbound ? 'ผู้รับมอบสินค้า' : 'ผู้รับสินค้า / ลูกค้า'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">({isInbound ? docData.operatorName : (docData.partnerName || 'ผู้รับ')})</div>
                  <div className="text-[9px] text-slate-400 mt-1">วันที่ ...../...../..........</div>
                </div>

                {/* 4 */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/40">
                  <div className="h-14 border-b border-dashed border-slate-300 flex items-end justify-center pb-1">
                    <span className="text-[11px] text-slate-400">................................................</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 mt-2">ผู้ตรวจสอบ / หน.คลัง</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">(........................................)</div>
                  <div className="text-[9px] text-slate-400 mt-1">วันที่ ...../...../..........</div>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400">
                <span>พิมพ์จากระบบ KASA WMS &bull; วันที่ {new Date().toLocaleDateString('th-TH')} เวลา {new Date().toLocaleTimeString('th-TH')} น.</span>
                <span>หน้า 1 / 1</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
