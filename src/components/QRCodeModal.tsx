import React, { useRef } from 'react';
import { Product } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Download, QrCode, Tag, Sparkles, FlaskConical } from 'lucide-react';

interface QRCodeModalProps {
  product: Product | null;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ product, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const windowUrl = 'about:blank';
    const uniqueName = 'Product_QR_Print';
    const printWindow = window.open(windowUrl, uniqueName, 'left=50,top=50,width=600,height=600');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${product.code}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                background: #ffffff;
                color: #0f172a;
              }
              .card {
                border: 2px solid #0f172a;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                max-width: 320px;
                width: 100%;
                box-shadow: none;
              }
              .code {
                font-family: monospace;
                font-size: 22px;
                font-weight: bold;
                color: #1e3a8a;
                margin-top: 8px;
              }
              .name {
                font-size: 16px;
                font-weight: 700;
                margin: 8px 0 4px 0;
              }
              .detail {
                font-size: 12px;
                color: #475569;
                margin-bottom: 16px;
              }
              .qr-box {
                display: flex;
                justify-content: center;
                margin: 16px 0;
              }
              .brand {
                font-size: 11px;
                font-weight: 600;
                color: #64748b;
                letter-spacing: 1px;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="brand">KASA CHEMICAL WAREHOUSE</div>
              <div class="code">${product.code}</div>
              <div class="name">${product.name}</div>
              <div class="detail">${product.chemicalFormula} • ${product.container} (${product.size})</div>
              <div class="qr-box">
                ${printContent.querySelector('.qr-wrapper')?.innerHTML || ''}
              </div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 8px;">สแกนเพื่อค้นหา/บันทึกรับเข้า-ส่งออก</div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = () => {
    const svgElement = printRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngFile;
        downloadLink.download = `QR_${product.code}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">QR Code สินค้า</h3>
              <p className="text-[11px] text-slate-400">ป้ายสแกนสำหรับงานคลังสินค้า</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body & Printable Label Preview */}
        <div className="p-6 text-center" ref={printRef}>
          
          <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs font-mono font-bold text-blue-800 mb-2">
            {product.code}
          </div>

          <h4 className="font-bold text-slate-900 text-sm leading-snug">{product.name}</h4>
          
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
            <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
            <span>{product.chemicalFormula}</span>
            <span>•</span>
            <span>{product.container} ({product.size})</span>
          </p>

          {/* QR Code Container */}
          <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block shadow-2xs qr-wrapper">
            <QRCodeSVG
              value={product.code}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-100 py-1.5 px-3 rounded-md font-medium">
            ยี่ห้อ: <strong className="text-slate-800">{product.brand}</strong> • บรรจุ: <strong className="text-slate-800">{product.container}</strong>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>ดาวน์โหลด PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์ป้าย QR</span>
          </button>
        </div>

      </div>
    </div>
  );
};
