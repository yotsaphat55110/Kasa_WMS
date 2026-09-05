import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Building2, 
  Filter, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { products, warehouses, inventory, inboundRecords, outboundRecords, auditLogs, t } = useApp();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');

  // Stats calculation
  const totalProductsCount = products.length;
  const totalStockQty = inventory.reduce((sum, inv) => sum + inv.quantityGood, 0);
  const totalDamagedQty = inventory.reduce((sum, inv) => sum + inv.quantityDamaged, 0);
  
  const lowStockCount = products.filter(p => {
    const totalGood = inventory
      .filter(i => i.productId === p.id)
      .reduce((sum, i) => sum + i.quantityGood, 0);
    return totalGood <= p.minThreshold;
  }).length;

  const totalInboundQty = inboundRecords.reduce((sum, r) => sum + r.quantity, 0);
  const totalOutboundQty = outboundRecords.reduce((sum, r) => sum + r.quantity, 0);

  // Recharts Chart Data 1: Inbound vs Outbound Monthly Trend
  const movementChartData = [
    { name: 'ม.ค.', รับเข้า: 12000, ส่งออก: 8500 },
    { name: 'ก.พ.', รับเข้า: 15400, ส่งออก: 11200 },
    { name: 'มี.ค.', รับเข้า: 18000, ส่งออก: 14500 },
    { name: 'เม.ย.', รับเข้า: 14200, ส่งออก: 13000 },
    { name: 'พ.ค.', รับเข้า: 22000, ส่งออก: 18900 },
    { name: 'มิ.ย.', รับเข้า: 19500, ส่งออก: 16200 },
    { name: 'ก.ค.', รับเข้า: 24000, ส่งออก: 21000 },
    { name: 'ส.ค.', รับเข้า: totalInboundQty, ส่งออก: totalOutboundQty }
  ];

  // Recharts Chart Data 2: Stock distribution by warehouse
  const whChartData = warehouses.map(wh => {
    const whGoodQty = inventory
      .filter(inv => inv.warehouseId === wh.id)
      .reduce((sum, inv) => sum + inv.quantityGood, 0);
    const whDamagedQty = inventory
      .filter(inv => inv.warehouseId === wh.id)
      .reduce((sum, inv) => sum + inv.quantityDamaged, 0);

    return {
      name: wh.code,
      fullName: wh.name,
      ของปกติ: whGoodQty,
      ของชำรุด: whDamagedQty
    };
  });

  // Recharts Chart Data 3: Condition Pie Ratio
  const conditionPieData = [
    { name: 'ปกติ (Good Stock)', value: totalStockQty, color: '#059669' },
    { name: 'ชำรุดเสียหาย (Damaged)', value: totalDamagedQty, color: '#e11d48' }
  ];

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "ลำดับ,รหัสสินค้า,ชื่อสินค้า,ชื่อทางเคมี,ลักษณะวัสดุ,ภาชนะบรรจุ,คลังสินค้า,ของปกติ,ของชำรุด,หน่วย\n";

    inventory.forEach((inv, idx) => {
      const prod = products.find(p => p.id === inv.productId);
      const wh = warehouses.find(w => w.id === inv.warehouseId);
      if (prod && wh) {
        csvContent += `${idx + 1},"${prod.code}","${prod.name}","${prod.chemicalFormula}","${prod.characters}","${prod.container}","${wh.name}",${inv.quantityGood},${inv.quantityDamaged},"${prod.unit}"\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KASA_WMS_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>{t.reports.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.reports.desc}</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs shadow-2xs transition-all self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t.reports.exportCsv}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Time Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRange === 'today' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {t.reports.today}
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRange === 'week' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {t.reports.thisWeek}
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRange === 'month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {t.reports.thisMonth}
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                dateRange === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              {t.reports.allTime}
            </button>
          </div>

          {/* Warehouse Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="all">{t.inventory.allWH}</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

        </div>

        <span className="text-xs text-slate-500 font-medium">
          อัปเดตล่าสุด: <strong className="text-slate-900 font-mono">03/08/2026 09:18 น.</strong>
        </span>
      </div>

      {/* Summary KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">{t.reports.totalProducts}</span>
          <span className="text-xl font-bold text-slate-900">{totalProductsCount}</span>
          <span className="text-[10px] text-slate-400 block mt-1">แคตตาล็อก</span>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">{t.reports.totalStockQty}</span>
          <span className="text-xl font-bold text-emerald-700">{totalStockQty.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">กก. / ลิตร</span>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 block mb-1">{t.reports.lowStockAlerts}</span>
          <span className="text-xl font-bold text-amber-600">{lowStockCount}</span>
          <span className="text-[10px] text-amber-500 block mt-1">สั่งซื้อเพิ่ม</span>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 block mb-1">{t.reports.damagedItems}</span>
          <span className="text-xl font-bold text-rose-600">{totalDamagedQty.toLocaleString()}</span>
          <span className="text-[10px] text-rose-400 block mt-1">ชำรุดรอเคลม</span>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block mb-1">{t.reports.inboundThisMonth}</span>
          <span className="text-xl font-bold text-emerald-800">+{totalInboundQty.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">รับเข้า</span>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 block mb-1">{t.reports.outboundThisMonth}</span>
          <span className="text-xl font-bold text-blue-800">-{totalOutboundQty.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 block mt-1">ส่งออก</span>
        </div>

      </div>

      {/* Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Inbound vs Outbound Trend */}
        <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>{t.reports.chartMovements} (Inbound vs Outbound)</span>
            <span className="text-xs text-slate-400 font-normal">หน่วย: กิโลกรัม</span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementChartData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="รับเข้า" stroke="#059669" fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="ส่งออก" stroke="#2563eb" fillOpacity={1} fill="url(#colorOut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Good vs Damaged Condition Donut */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-900 mb-2">
            {t.reports.chartConditionRatio}
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conditionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            อัตราส่วนสินค้าสมบูรณ์ต่อสินค้าชำรุดเสียหายในคลัง
          </p>
        </div>

        {/* Chart 3: Stock distribution across warehouses */}
        <div className="lg:col-span-12 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-900 mb-4">
            {t.reports.chartWhRatio}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={whChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fullName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ของปกติ" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ของชำรุด" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
