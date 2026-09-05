import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { X, Boxes } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit
}) => {
  const { saveProduct, t } = useApp();

  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [chemicalFormula, setChemicalFormula] = useState<string>('');
  const [characters, setCharacters] = useState<string>('Solid / ผง');
  const [container, setContainer] = useState<string>('ถุง');
  const [unit, setUnit] = useState<string>('กิโลกรัม');
  const [size, setSize] = useState<string>('25 กก.');
  const [brand, setBrand] = useState<string>('KASA Chemical');
  const [minThreshold, setMinThreshold] = useState<number>(300);

  useEffect(() => {
    if (productToEdit) {
      setCode(productToEdit.code);
      setName(productToEdit.name);
      setChemicalFormula(productToEdit.chemicalFormula);
      setCharacters(productToEdit.characters);
      setContainer(productToEdit.container);
      setUnit(productToEdit.unit);
      setSize(productToEdit.size);
      setBrand(productToEdit.brand);
      setMinThreshold(productToEdit.minThreshold);
    } else {
      setCode(`KASA-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setChemicalFormula('');
      setCharacters('Solid / ผง');
      setContainer('ถุง');
      setUnit('กิโลกรัม');
      setSize('25 กก.');
      setBrand('KASA Chemical');
      setMinThreshold(300);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveProduct({
      id: productToEdit?.id,
      code,
      name,
      chemicalFormula: chemicalFormula.trim() || '-',
      characters,
      container,
      unit,
      size,
      brand,
      minThreshold: Math.max(0, Number(minThreshold) || 0)
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Boxes className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">{productToEdit ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่ลงแคตตาล็อก'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3.1 รหัสสินค้า (Product Code) *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-blue-900 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3.7 ชื่อยี่ห้อสินค้า (Brand Name)
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3.2 ชื่อสินค้า (Product Name) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Aluminium Sulphate (สารส้มขุ่น)"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3.5 ชื่อทางเคมี / สูตรเคมี (Chemical Formula)
            </label>
            <input
              type="text"
              value={chemicalFormula}
              onChange={(e) => setChemicalFormula(e.target.value)}
              placeholder="เช่น (NH4)2SO4 หรือ NaCl"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3.4 ลักษณะวัสดุ (Material Characters)
              </label>
              <select
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
              >
                <option value="Solid / ผง / ก้อน">Solid / ผง / ก้อน</option>
                <option value="Solid / ผง">Solid / ผง</option>
                <option value="Solid / เกล็ด">Solid / เกล็ด</option>
                <option value="Solid / เม็ด">Solid / เม็ด</option>
                <option value="Liquid / เหลว">Liquid / เหลว</option>
                <option value="Liquid / เหลวเข้มข้น">Liquid / เหลวเข้มข้น</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3.3 ภาชนะบรรจุ (Container Type)
              </label>
              <input
                type="text"
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                placeholder="เช่น ถุง, ถัง, ชิ้น, อัน, แกลลอน"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3.6 หน่วยนับ (Unit)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
              >
                <option value="กิโลกรัม">กิโลกรัม (กก.)</option>
                <option value="ตัน">ตัน</option>
                <option value="กรัม">กรัม</option>
                <option value="ลิตร">ลิตร</option>
                <option value="มิลลิลิตร">มิลลิลิตร</option>
                <option value="ชิ้น">ชิ้น</option>
                <option value="อัน">อัน</option>
                <option value="ถุง">ถุง</option>
                <option value="ถัง">ถัง</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ขนาดบรรจุ (Size)
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="เช่น 25 กก., 50 กก., 22 ลิตร"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จุดเตือนสินค้าใกล้หมด (Min Threshold)
              </label>
              <input
                type="number"
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-bold"
              />
            </div>
          </div>

          {/* Footer */}
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
