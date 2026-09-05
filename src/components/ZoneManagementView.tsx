import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Warehouse, Zone } from '../types';
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Building2, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Boxes,
  Info
} from 'lucide-react';

interface ZoneManagementViewProps {
  searchTerm?: string;
}

export const ZoneManagementView: React.FC<ZoneManagementViewProps> = ({ searchTerm = '' }) => {
  const { warehouses, inventory, products, saveWarehouse, deleteWarehouse, saveZone, deleteZone } = useApp();

  const [localSearch, setLocalSearch] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');

  // Modal States
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [targetWhId, setTargetWhId] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');

  // Toast / Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const query = (searchTerm || localSearch).trim().toLowerCase();

  // Filter Warehouses & Zones
  const filteredWarehouses = warehouses.filter(wh => {
    if (selectedWarehouseFilter !== 'ALL' && wh.id !== selectedWarehouseFilter) {
      return false;
    }

    if (!query) return true;

    const matchWh = wh.name.toLowerCase().includes(query) || 
                    wh.code.toLowerCase().includes(query) || 
                    wh.location.toLowerCase().includes(query);
    const matchZone = wh.zones.some(z => 
      z.name.toLowerCase().includes(query) || 
      z.code.toLowerCase().includes(query) || 
      (z.description && z.description.toLowerCase().includes(query))
    );

    return matchWh || matchZone;
  });

  // Count items stored in a specific zone
  const getZoneStockCount = (whId: string, zId: string) => {
    return inventory.filter(inv => inv.warehouseId === whId && inv.zoneId === zId && (inv.quantityGood > 0 || inv.quantityDamaged > 0)).length;
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  // Open Warehouse Modal
  const handleOpenWhModal = (wh?: Warehouse) => {
    if (wh) {
      setEditingWh(wh);
      setWhCode(wh.code);
      setWhName(wh.name);
      setWhLocation(wh.location);
    } else {
      setEditingWh(null);
      setWhCode(`WH-0${warehouses.length + 1}`);
      setWhName('');
      setWhLocation('');
    }
    setIsWhModalOpen(true);
  };

  const handleSaveWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim() || !whCode.trim()) {
      showNotification('error', 'กรุณาระบุรหัสและชื่อคลังสินค้า');
      return;
    }

    saveWarehouse({
      id: editingWh ? editingWh.id : undefined,
      code: whCode.trim(),
      name: whName.trim(),
      location: whLocation.trim() || 'อาคารปฏิบัติการเคมี'
    });

    setIsWhModalOpen(false);
    showNotification('success', editingWh ? `อัปเดตข้อมูลคลัง "${whName}" เรียบร้อย` : `เพิ่มคลังสินค้าใหม่ "${whName}" เรียบร้อยแล้ว`);
  };

  const handleDeleteWhClick = (wh: Warehouse) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบคลังสินค้า "${wh.name}"?`)) {
      const res = deleteWarehouse(wh.id);
      if (res.success) {
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    }
  };

  // Open Zone Modal
  const handleOpenZoneModal = (whId: string, zone?: Zone) => {
    setTargetWhId(whId);
    if (zone) {
      setEditingZone(zone);
      setZoneCode(zone.code);
      setZoneName(zone.name);
      setZoneDesc(zone.description || '');
    } else {
      setEditingZone(null);
      const parentWh = warehouses.find(w => w.id === whId);
      const defaultCode = parentWh ? `Z-${(parentWh.zones.length + 1)}` : 'Z-1';
      setZoneCode(defaultCode);
      setZoneName('');
      setZoneDesc('');
    }
    setIsZoneModalOpen(true);
  };

  const handleSaveZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWhId) {
      showNotification('error', 'กรุณาเลือกคลังสินค้า');
      return;
    }
    if (!zoneName.trim() || !zoneCode.trim()) {
      showNotification('error', 'กรุณาระบุรหัสและชื่อโซนจัดเก็บ');
      return;
    }

    saveZone(targetWhId, {
      id: editingZone ? editingZone.id : undefined,
      code: zoneCode.trim(),
      name: zoneName.trim(),
      description: zoneDesc.trim()
    });

    setIsZoneModalOpen(false);
    showNotification('success', editingZone ? `อัปเดตข้อมูลโซน "${zoneName}" เรียบร้อย` : `เพิ่มโซนจัดเก็บ "${zoneName}" เรียบร้อยแล้ว`);
  };

  const handleDeleteZoneClick = (whId: string, zone: Zone) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบโซน "${zone.name}"?`)) {
      const res = deleteZone(whId, zone.id);
      if (res.success) {
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    }
  };

  // Total Zones across all WHs
  const totalZonesCount = warehouses.reduce((sum, w) => sum + w.zones.length, 0);

  return (
    <div className="space-y-6">
      
      {/* Feedback Toast Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-md transition-all ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">จัดการคลังสินค้า & โซนจัดเก็บ</h1>
              <p className="text-xs text-slate-500">
                เพิ่ม ลบ และแก้ไขข้อมูลคลังสินค้าและโซนแยกตามประเภทสารเคมี
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenWhModal()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>+ เพิ่มคลังสินค้า</span>
          </button>

          <button
            onClick={() => handleOpenZoneModal(warehouses[0]?.id || '')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มโซนจัดเก็บ</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">จำนวนคลังสินค้าทั้งหมด</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{warehouses.length} <span className="text-xs font-medium text-slate-500">คลัง</span></p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">จำนวนโซนจัดเก็บเคมีรวม</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{totalZonesCount} <span className="text-xs font-medium text-slate-500">โซน</span></p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">แคตตาล็อกสินค้าเคมีรวม</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{products.length} <span className="text-xs font-medium text-slate-500">รายการ</span></p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหาชื่อคลัง, รหัสโซน (เช่น B1, C2)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 shrink-0">กรองตามคลัง:</label>
          <select
            value={selectedWarehouseFilter}
            onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
          >
            <option value="ALL">ทุกคลังสินค้า ({warehouses.length})</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Warehouses & Zones List */}
      <div className="space-y-6">
        {filteredWarehouses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-sm">ไม่พบข้อมูลคลังสินค้าหรือโซนตรงตามเงื่อนไขค้นหา</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดเพิ่มโซนจัดเก็บใหม่</p>
          </div>
        ) : (
          filteredWarehouses.map(wh => (
            <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              
              {/* Warehouse Card Header */}
              <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-extrabold rounded-md uppercase tracking-wider shrink-0">
                    {wh.code}
                  </span>
                  <div>
                    <h2 className="font-bold text-sm sm:text-base text-white">{wh.name}</h2>
                    <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{wh.location}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenWhModal(wh)}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 px-2"
                    title="แก้ไขคลังนี้"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>แก้ไขคลัง</span>
                  </button>

                  <button
                    onClick={() => handleDeleteWhClick(wh)}
                    className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-900/40 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 px-2"
                    title="ลบคลังนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenZoneModal(wh.id)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-2xs ml-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ เพิ่มโซน</span>
                  </button>
                </div>
              </div>

              {/* Zones Grid */}
              <div className="p-4 sm:p-5">
                {wh.zones.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">คลังนี้ยังไม่มีโซนจัดเก็บ</p>
                    <button
                      onClick={() => handleOpenZoneModal(wh.id)}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                    >
                      + เพิ่มโซนแรกสำหรับคลังนี้
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wh.zones.map(zone => {
                      const itemCount = getZoneStockCount(wh.id, zone.id);
                      return (
                        <div 
                          key={zone.id} 
                          className="bg-slate-50/70 hover:bg-amber-50/20 border border-slate-200/80 rounded-xl p-4 transition-all hover:border-amber-300 flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-black rounded-md uppercase font-mono">
                                โซน {zone.code}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenZoneModal(wh.id, zone)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                                  title="แก้ไขโซน"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteZoneClick(wh.id, zone)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                                  title="ลบโซน"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h3 className="font-bold text-xs text-slate-900">{zone.name}</h3>
                            {zone.description && (
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                {zone.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">รายการเคมีในโซน:</span>
                            <span className={`font-bold px-2 py-0.5 rounded-full ${
                              itemCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {itemCount} รายการ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Warehouse Modal (Add / Edit Warehouse) */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingWh ? 'แก้ไขข้อมูลคลังสินค้า' : 'เพิ่มคลังสินค้าใหม่'}</h3>
              <button onClick={() => setIsWhModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouseSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสคลังสินค้า (Code) *</label>
                <input
                  type="text"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  placeholder="เช่น WH-04"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อคลังสินค้า (Warehouse Name) *</label>
                <input
                  type="text"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="เช่น คลังสำรองสารเคมีบำบัดน้ำ"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">สถานที่ตั้ง / อาคาร (Location)</label>
                <input
                  type="text"
                  value={whLocation}
                  onChange={(e) => setWhLocation(e.target.value)}
                  placeholder="เช่น อาคาร D - นิคมอุตสาหกรรมบางปู"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-2xs"
                >
                  บันทึกคลังสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zone Modal (Add / Edit Zone) */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">{editingZone ? 'แก้ไขข้อมูลโซนจัดเก็บ' : 'เพิ่มโซนจัดเก็บใหม่'}</h3>
              <button onClick={() => setIsZoneModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveZoneSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เลือกคลังสินค้า (Warehouse) *</label>
                <select
                  value={targetWhId}
                  onChange={(e) => setTargetWhId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  required
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสโซน (Code) *</label>
                  <input
                    type="text"
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    placeholder="เช่น B1, A3, C1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อโซน (Zone Name) *</label>
                  <input
                    type="text"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    placeholder="เช่น โซน B1 - ถังกรดเข้มข้น"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดประเภทสารเคมีในโซน</label>
                <textarea
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  placeholder="เช่น จัดเก็บถังกรดเกลือ กรดซัลฟิวริก และกรดฟอสฟอริก"
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>การเพิ่มหรือปรับปรุงโซน จะช่วยให้เจ้าหน้าที่สามารถเลือกจุดจัดเก็บสารเคมีตอนรับเข้าและส่งออกได้แม่นยำยิ่งขึ้น</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-2xs"
                >
                  บันทึกโซนจัดเก็บ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
