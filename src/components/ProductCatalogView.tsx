import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { QRCodeModal } from './QRCodeModal';
import { Boxes, Plus, Search, Edit2, Trash2, FlaskConical, Tag, CheckCircle2, QrCode } from 'lucide-react';

interface ProductCatalogViewProps {
  onOpenModal: (product?: Product) => void;
  searchTerm: string;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  onOpenModal,
  searchTerm
}) => {
  const { products, deleteProduct, t } = useApp();
  const [localSearch, setLocalSearch] = useState('');
  const [qrProduct, setQrProduct] = useState<Product | null>(null);

  const query = (searchTerm || localSearch).toLowerCase();

  const filteredProducts = products.filter(p => {
    return (
      !query ||
      p.code.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query) ||
      p.chemicalFormula.toLowerCase().includes(query) ||
      p.characters.toLowerCase().includes(query) ||
      p.container.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" />
            <span>{t.catalog.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.catalog.desc}</p>
        </div>

        <button
          onClick={() => onOpenModal()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs shadow-2xs transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.catalog.btnNew}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า, สูตรเคมี, ยี่ห้อ..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium">
          รวม <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> รายการ
        </span>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">{t.catalog.code}</th>
                <th className="px-4 py-3">{t.catalog.name}</th>
                <th className="px-4 py-3">{t.catalog.chemical}</th>
                <th className="px-4 py-3">{t.catalog.character}</th>
                <th className="px-4 py-3">{t.catalog.container} / ขนาด</th>
                <th className="px-4 py-3">{t.catalog.unit}</th>
                <th className="px-4 py-3">{t.catalog.brand}</th>
                <th className="px-4 py-3 text-right">{t.common.edit}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบรายการสินค้าตรงตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    {/* Item Code (3.1) */}
                    <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{product.code}</span>
                        <button
                          onClick={() => setQrProduct(product)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="สร้าง/แสดง QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Item Name (3.2) */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                    </td>

                    {/* Chemical Formula (3.5) */}
                    <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                        <FlaskConical className="w-3 h-3 text-blue-600" />
                        {product.chemicalFormula || '-'}
                      </span>
                    </td>

                    {/* Material Characters (3.4) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-slate-600">{product.characters}</span>
                    </td>

                    {/* Containers & Sizes (3.3) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{product.container}</span>
                      <span className="text-slate-400 ml-1">({product.size})</span>
                    </td>

                    {/* Units (3.6) */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                      {product.unit}
                    </td>

                    {/* Brand Name (3.7) */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {product.brand}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setQrProduct(product)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title="สร้าง QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenModal(product)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title="แก้ไขสินค้า"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`ยืนยันลบสินค้า ${product.name}ออกจากแคตตาล็อก?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="ลบสินค้า"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrProduct && (
        <QRCodeModal
          product={qrProduct}
          onClose={() => setQrProduct(null)}
        />
      )}

    </div>
  );
};

