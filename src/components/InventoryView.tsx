import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, Product } from '../types';
import { QRCodeModal } from './QRCodeModal';
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  QrCode
} from 'lucide-react';

interface InventoryViewProps {
  searchTerm: string;
  onAdjustStock: (item: InventoryItem) => void;
}

type SortField = 'code' | 'name' | 'location' | 'goodQty' | 'damagedQty' | 'status';
type SortDirection = 'asc' | 'desc';

export const InventoryView: React.FC<InventoryViewProps> = ({
  searchTerm,
  onAdjustStock
}) => {
  const { products, warehouses, inventory, t } = useApp();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'damaged'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // QR Code Modal State
  const [selectedProductForQR, setSelectedProductForQR] = useState<Product | null>(null);

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return false;

    // Search term matching
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      product.code.toLowerCase().includes(searchLower) ||
      product.name.toLowerCase().includes(searchLower) ||
      product.chemicalFormula.toLowerCase().includes(searchLower) ||
      product.brand.toLowerCase().includes(searchLower);

    // Warehouse & Zone matching
    const matchWH = selectedWarehouseId === 'all' || item.warehouseId === selectedWarehouseId;
    const matchZone = selectedZoneId === 'all' || item.zoneId === selectedZoneId;

    // Status filter
    let matchStatus = true;
    if (statusFilter === 'low') {
      matchStatus = item.quantityGood <= product.minThreshold;
    } else if (statusFilter === 'damaged') {
      matchStatus = item.quantityDamaged > 0;
    }

    return matchSearch && matchWH && matchZone && matchStatus;
  });

  // Sort inventory based on sortField & sortDirection
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const prodA = products.find(p => p.id === a.productId);
    const prodB = products.find(p => p.id === b.productId);
    const whA = warehouses.find(w => w.id === a.warehouseId);
    const whB = warehouses.find(w => w.id === b.warehouseId);
    const zoneA = whA?.zones.find(z => z.id === a.zoneId);
    const zoneB = whB?.zones.find(z => z.id === b.zoneId);

    let valA: string | number = '';
    let valB: string | number = '';

    switch (sortField) {
      case 'code':
        valA = prodA?.code || '';
        valB = prodB?.code || '';
        break;
      case 'name':
        valA = prodA?.name || '';
        valB = prodB?.name || '';
        break;
      case 'location':
        valA = `${whA?.name || ''} ${zoneA?.name || ''}`;
        valB = `${whB?.name || ''} ${zoneB?.name || ''}`;
        break;
      case 'goodQty':
        valA = a.quantityGood;
        valB = b.quantityGood;
        break;
      case 'damagedQty':
        valA = a.quantityDamaged;
        valB = b.quantityDamaged;
        break;
      case 'status': {
        const getStatusScore = (item: InventoryItem, prod?: Product) => {
          if (!prod) return 0;
          if (item.quantityGood === 0) return 3;
          if (item.quantityGood <= prod.minThreshold) return 2;
          return 1;
        };
        valA = getStatusScore(a, prodA);
        valB = getStatusScore(b, prodB);
        break;
      }
      default:
        valA = prodA?.code || '';
        valB = prodB?.code || '';
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
    if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 font-bold" />
    );
  };

  // Calculate high level stats
  const totalInStock = inventory.reduce((sum, item) => sum + item.quantityGood, 0);
  const totalDamaged = inventory.reduce((sum, item) => sum + item.quantityDamaged, 0);
  const lowStockCount = products.filter(p => {
    const totalGood = inventory
      .filter(i => i.productId === p.id)
      .reduce((sum, i) => sum + i.quantityGood, 0);
    return totalGood <= p.minThreshold;
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>{t.inventory.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.inventory.desc}</p>
        </div>

        {/* Quick Stats Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
          <div className="px-3.5 py-2.5 bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-xl shadow-2xs flex items-center gap-3 min-w-[170px]">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">สต๊อกปกติรวม</span>
              <span className="text-base font-bold text-slate-900">{totalInStock.toLocaleString()} <span className="text-xs font-medium text-slate-500">กก.</span></span>
            </div>
          </div>

          <div className="px-3.5 py-2.5 bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-xl shadow-2xs flex items-center gap-3 min-w-[170px]">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ใกล้หมดคลัง</span>
              <span className="text-base font-bold text-amber-600">{lowStockCount} <span className="text-xs font-medium text-slate-500">รายการ</span></span>
            </div>
          </div>

          <div className="px-3.5 py-2.5 bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded-xl shadow-2xs flex items-center gap-3 min-w-[170px]">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">สินค้าชำรุด</span>
              <span className="text-base font-bold text-rose-600">{totalDamaged.toLocaleString()} <span className="text-xs font-medium text-slate-500">กก.</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Warehouse Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setSelectedZoneId('all');
              }}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="all">{t.inventory.allWH}</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Zone Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="all">{t.inventory.allZones}</option>
              {selectedWarehouse?.zones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Quick Condition Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แสดงทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('low')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === 'low' ? 'bg-amber-500 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.inventory.lowStock}
            </button>
            <button
              onClick={() => setStatusFilter('damaged')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                statusFilter === 'damaged' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.inventory.damagedOnly}
            </button>
          </div>

        </div>

        <span className="text-xs text-slate-500 font-medium">
          พบ <strong className="text-slate-900 font-bold">{sortedInventory.length}</strong> รายการ (คลิกหัวคอลัมน์เพื่อเรียงลำดับ)
        </span>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider select-none">
              <tr>
                {/* Code */}
                <th 
                  onClick={() => handleSort('code')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 group transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.inventory.code}</span>
                    {renderSortIcon('code')}
                  </div>
                </th>

                {/* Name */}
                <th 
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 group transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.inventory.name}</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                {/* Warehouse & Zone */}
                <th 
                  onClick={() => handleSort('location')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-100 group transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.inventory.warehouseZone}</span>
                    {renderSortIcon('location')}
                  </div>
                </th>

                {/* Good Qty */}
                <th 
                  onClick={() => handleSort('goodQty')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 group transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t.inventory.goodQty}</span>
                    {renderSortIcon('goodQty')}
                  </div>
                </th>

                {/* Damaged Qty */}
                <th 
                  onClick={() => handleSort('damagedQty')}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 group transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t.inventory.damagedQty}</span>
                    {renderSortIcon('damagedQty')}
                  </div>
                </th>

                {/* Status */}
                <th 
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 group transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{t.inventory.status}</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                {/* Action */}
                <th className="px-4 py-3 text-right">{t.inventory.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบรายการสต๊อกตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                sortedInventory.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  const warehouse = warehouses.find(w => w.id === item.warehouseId);
                  const zone = warehouse?.zones.find(z => z.id === item.zoneId);

                  if (!product) return null;

                  const isLow = item.quantityGood <= product.minThreshold;
                  const isOutOfStock = item.quantityGood === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* Product Code */}
                      <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{product.code}</span>
                          <button
                            onClick={() => setSelectedProductForQR(product)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="ดู/พิมพ์ QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Product Name & Chemical Formula */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-snug">{product.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {product.chemicalFormula} • {product.container} ({product.size})
                        </div>
                      </td>

                      {/* Warehouse & Zone */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-slate-900 block">{warehouse?.name.split(' ')[0]}</span>
                        <span className="text-[11px] text-slate-500">{zone?.name}</span>
                      </td>

                      {/* Good Qty */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap text-xs">
                        {item.quantityGood.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">{product.unit}</span>
                      </td>

                      {/* Damaged Qty */}
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        {item.quantityDamaged > 0 ? (
                          <span className="text-rose-600 px-2 py-0.5 bg-rose-50 rounded-md border border-rose-100">
                            {item.quantityDamaged.toLocaleString()} {product.unit}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                            {t.inventory.outOfStock}
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            {t.inventory.lowStock}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            {t.inventory.inStock}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProductForQR(product)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-md font-medium text-xs transition-all"
                            title="พิมพ์ป้าย QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onAdjustStock(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md font-medium text-xs transition-all"
                            title={t.inventory.editStock}
                          >
                            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                            <span>{t.inventory.editStock}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedProductForQR && (
        <QRCodeModal
          product={selectedProductForQR}
          onClose={() => setSelectedProductForQR(null)}
        />
      )}

    </div>
  );
};

