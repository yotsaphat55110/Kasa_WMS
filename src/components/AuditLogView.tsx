import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuditLog } from '../types';
import { FileText, Search, Filter, ShieldAlert, ArrowDownLeft, ArrowUpRight, SlidersHorizontal, UserCheck, MessageSquare } from 'lucide-react';

interface AuditLogViewProps {
  searchTerm: string;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ searchTerm }) => {
  const { auditLogs, t } = useApp();
  const [localSearch, setLocalSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const query = (searchTerm || localSearch).toLowerCase();

  const filteredLogs = auditLogs.filter(log => {
    const matchSearch =
      !query ||
      log.employeeCode.toLowerCase().includes(query) ||
      log.userName.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query);

    const matchAction = selectedAction === 'all' || log.actionType === selectedAction;

    return matchSearch && matchAction;
  });

  const renderActionBadge = (type: AuditLog['actionType']) => {
    switch (type) {
      case 'INBOUND':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]"><ArrowDownLeft className="w-3 h-3" /> รับเข้าสินค้า (INBOUND)</span>;
      case 'OUTBOUND':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-md font-bold text-[10px]"><ArrowUpRight className="w-3 h-3" /> ส่งออกสินค้า (OUTBOUND)</span>;
      case 'STOCK_ADJUST':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-md font-bold text-[10px]"><SlidersHorizontal className="w-3 h-3" /> ปรับปรุงสต๊อก</span>;
      case 'DAMAGE_REPORT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[10px]"><ShieldAlert className="w-3 h-3" /> แจ้งสินค้าชำรุด</span>;
      case 'LINE_CONFIG_UPDATE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]"><MessageSquare className="w-3 h-3" /> LINE Settings</span>;
      case 'USER_LOGIN':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md font-bold text-[10px]"><UserCheck className="w-3 h-3" /> เข้าสู่ระบบ (LOGIN)</span>;
      case 'USER_LOGOUT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">LOGOUT</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>{t.auditLog.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.auditLog.desc}</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="ค้นหารายละเอียดกิจกรรม, รหัสพนักงาน, ชื่อผู้ทำรายการ..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
          >
            <option value="all">{t.auditLog.allActions}</option>
            <option value="INBOUND">รับเข้าสินค้า (INBOUND)</option>
            <option value="OUTBOUND">ส่งออกสินค้า (OUTBOUND)</option>
            <option value="STOCK_ADJUST">ปรับปรุงสต๊อก (STOCK_ADJUST)</option>
            <option value="DAMAGE_REPORT">แจ้งสินค้าชำรุด (DAMAGE_REPORT)</option>
            <option value="LINE_CONFIG_UPDATE">การตั้งค่า LINE OA</option>
            <option value="USER_LOGIN">เข้าสู่ระบบ (USER_LOGIN)</option>
            <option value="USER_LOGOUT">ออกจากระบบ (USER_LOGOUT)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          รวม <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong> รายการ
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">{t.auditLog.timestamp}</th>
                <th className="px-4 py-3">{t.auditLog.action}</th>
                <th className="px-4 py-3">{t.auditLog.user}</th>
                <th className="px-4 py-3">{t.auditLog.details}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบประวัติการทำงานตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    {/* Action Type Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {renderActionBadge(log.actionType)}
                    </td>

                    {/* User Operator */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{log.userName}</span>
                      <span className="text-[10px] text-blue-700 font-mono">{log.employeeCode}</span>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 text-slate-800 leading-relaxed max-w-md">
                      {log.details}
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
