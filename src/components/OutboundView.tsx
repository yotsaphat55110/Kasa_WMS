import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowUpRight, Minus, Search, Building2, UserCheck } from 'lucide-react';

interface OutboundViewProps {
  onOpenModal: () => void;
  searchTerm: string;
}

export const OutboundView: React.FC<OutboundViewProps> = ({ onOpenModal, searchTerm }) => {
  const { outboundRecords, t } = useApp();
  const [localSearch, setLocalSearch] = useState('');

  const query = (searchTerm || localSearch).toLowerCase();

  const filtered = outboundRecords.filter(rec => {
    return (
      !query ||
      rec.productCode.toLowerCase().includes(query) ||
      rec.productName.toLowerCase().includes(query) ||
      rec.dispatcherName.toLowerCase().includes(query) ||
      rec.recorderName.toLowerCase().includes(query) ||
      rec.warehouseName.toLowerCase().includes(query) ||
      rec.transactionCode.toLowerCase().includes(query) ||
      (rec.destination && rec.destination.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
            <span>{t.outbound.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.outbound.desc}</p>
        </div>

        <button
          onClick={onOpenModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs shadow-2xs transition-all self-start sm:self-auto"
        >
          <Minus className="w-4 h-4" />
          <span>{t.outbound.btnNew}</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหารหัสส่งออก, สินค้า, ผู้ส่งออก..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          รวม <strong className="text-slate-900 font-bold">{filtered.length}</strong> รายการ
        </span>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">{t.outbound.code}</th>
                <th className="px-4 py-3">{t.outbound.product}</th>
                <th className="px-4 py-3 text-right">{t.outbound.qty}</th>
                <th className="px-4 py-3">{t.outbound.location}</th>
                <th className="px-4 py-3">{t.outbound.destination}</th>
                <th className="px-4 py-3">{t.outbound.dispatcher} / ผู้ลงระบบ</th>
                <th className="px-4 py-3">{t.outbound.dateTime}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบรายการส่งออกสินค้า
                  </td>
                </tr>
              ) : (
                filtered.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    {/* Transaction Code */}
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {rec.transactionCode}
                    </td>

                    {/* Product Name */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-900">{rec.productName}</div>
                      <div className="text-[11px] font-mono text-blue-700">{rec.productCode}</div>
                      {rec.details && <div className="text-[11px] text-slate-400 italic line-clamp-1">{rec.details}</div>}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3 text-right font-bold text-blue-700 whitespace-nowrap text-xs">
                      -{rec.quantity.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">{rec.unit}</span>
                    </td>

                    {/* Warehouse & Zone */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{rec.warehouseName.split(' ')[0]}</span>
                      <span className="text-[11px] text-slate-500">{rec.zoneName}</span>
                    </td>

                    {/* Destination */}
                    <td className="px-4 py-3 max-w-xs text-slate-800 font-medium">
                      {rec.destination || '-'}
                    </td>

                    {/* Dispatcher vs Recorder */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">ผู้ส่ง: {rec.dispatcherName}</span>
                      <span className="text-[11px] text-slate-500">ผู้ลงระบบ: {rec.recorderName}</span>
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">
                      <div>{rec.date}</div>
                      <div className="text-[10px] text-slate-400">{rec.time} น.</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
