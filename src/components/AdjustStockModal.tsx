import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: InventoryItem | null;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  onClose,
  inventoryItem
}) => {
  const { getProductById, getWarehouseById, adjustInventory, t } = useApp();

  const [goodQty, setGoodQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [reason, setReason] = useState<string>('ตรวจนับสต๊อกประจำเดือน');

  useEffect(() => {
    if (inventoryItem) {
      setGoodQty(inventoryItem.quantityGood);
      setDamagedQty(inventoryItem.quantityDamaged);
    }
  }, [inventoryItem]);

  if (!isOpen || !inventoryItem) return null;

  const product = getProductById(inventoryItem.productId);
  const warehouse = getWarehouseById(inventoryItem.warehouseId);
  const zone = warehouse?.zones.find(z => z.id === inventoryItem.zoneId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustInventory(inventoryItem.id, Math.max(0, goodQty), Math.max(0, damagedQty), reason.trim() || 'ปรับปรุงสต๊อก');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">{t.inventory.adjustModalTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-700">
            <p><span className="font-semibold text-slate-900">สินค้า:</span> [{product?.code}] {product?.name}</p>
            <p><span className="font-semibold text-slate-900">คลังสินค้า / โซน:</span> {warehouse?.name} ({zone?.name})</p>
            <p><span className="font-semibold text-slate-900">หน่วยนับ:</span> {product?.unit}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวนสินค้าปกติ (Good Qty)
              </label>
              <input
                type="number"
                min="0"
                value={goodQty}
                onChange={(e) => setGoodQty(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-bold text-blue-800 bg-slate-50 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">
                จำนวนสินค้าชำรุด (Damaged Qty)
              </label>
              <input
                type="number"
                min="0"
                value={damagedQty}
                onChange={(e) => setDamagedQty(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-md focus:ring-2 focus:ring-amber-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.inventory.reason} *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
            >
              <option value="ตรวจนับสต๊อกประจำเดือน (Stock Count)">ตรวจนับสต๊อกประจำเดือน (Stock Count)</option>
              <option value="พบสินค้าชำรุดเสียหายระหว่างจัดเก็บ (Damaged in WH)">พบสินค้าชำรุดเสียหายระหว่างจัดเก็บ (Damaged in WH)</option>
              <option value="ปรับปรุงยอดต่างจากการตรวจนับ (Inventory Adjustment)">ปรับปรุงยอดต่างจากการตรวจนับ (Inventory Adjustment)</option>
              <option value="คืนสินค้าจากการจัดส่ง (Returned Item)">คืนสินค้าจากการจัดส่ง (Returned Item)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-md text-xs font-medium text-slate-700"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-2xs"
            >
              {t.common.save}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
