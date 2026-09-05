/**
 * Google Sheets API v4 Direct Client Service
 * Allows creating a new Google Sheet directly on the user's Google Drive,
 * setting up tabs with headers, formatting, and performing full data sync.
 */

import { Product, InventoryItem, InboundRecord, OutboundRecord } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface CreateWmsSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Creates a brand new Google Spreadsheet on the user's Google Drive
 * with 4 structured tabs: Products, Inventory, Inbound, Outbound
 */
export async function createWmsSpreadsheetDirect(
  accessToken: string,
  title: string = 'KASA WMS - ระบบจัดการคลังสินค้าเคมีภัณฑ์'
): Promise<CreateWmsSpreadsheetResult> {
  const requestBody = {
    properties: {
      title
    },
    sheets: [
      {
        properties: {
          title: 'Products',
          gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Inventory',
          gridProperties: { rowCount: 100, columnCount: 10, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Inbound',
          gridProperties: { rowCount: 200, columnCount: 15, frozenRowCount: 1 }
        }
      },
      {
        properties: {
          title: 'Outbound',
          gridProperties: { rowCount: 200, columnCount: 15, frozenRowCount: 1 }
        }
      }
    ]
  };

  const response = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `ไม่สามารถสร้าง Google Sheet ได้ (HTTP ${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: data.properties?.title || title
  };
}

/**
 * Fills headers and full dataset into the created Google Spreadsheet
 */
export async function populateWmsSpreadsheetData(
  accessToken: string,
  spreadsheetId: string,
  data: {
    products: Product[];
    inventory: InventoryItem[];
    inboundRecords: InboundRecord[];
    outboundRecords: OutboundRecord[];
  }
): Promise<void> {
  // 1. Prepare Products Rows
  const productRows: any[][] = [
    [
      'ID สินค้า', 'รหัสสินค้า', 'ชื่อสินค้า', 'ชื่อภาษาไทย/คำอธิบาย', 'สูตรเคมี/ชื่อทางเคมี',
      'ลักษณะทางกายภาพ', 'ภาชนะบรรจุ', 'หน่วยนับ', 'ขนาดบรรจุ', 'ยี่ห้อ/ผู้ผลิต', 'เกณฑ์เตือนสต๊อกต่ำ', 'วันที่บันทึก'
    ],
    ...data.products.map(p => [
      p.id,
      p.code,
      p.name,
      p.thaiName || '',
      p.chemicalFormula || '',
      p.characters || '',
      p.container || '',
      p.unit,
      p.size || '',
      p.brand || '',
      p.minThreshold || 0,
      p.createdAt || ''
    ])
  ];

  // 2. Prepare Inventory Rows
  const inventoryRows: any[][] = [
    [
      'ID สต๊อก', 'ID สินค้า', 'รหัสสินค้า', 'ชื่อสินค้า', 'คลังสินค้า',
      'โซนจัดเก็บ', 'จำนวนสภาพดี (Good)', 'จำนวนชำรุด (Damaged)', 'ยอดรวมทั้งหมด', 'อัปเดตล่าสุด'
    ],
    ...data.inventory.map(inv => {
      const prod = data.products.find(p => p.id === inv.productId);
      const total = (inv.quantityGood || 0) + (inv.quantityDamaged || 0);
      return [
        inv.id,
        inv.productId,
        prod?.code || '',
        prod?.name || '',
        inv.warehouseId,
        inv.zoneId,
        inv.quantityGood || 0,
        inv.quantityDamaged || 0,
        total,
        inv.lastUpdated || ''
      ];
    })
  ];

  // 3. Prepare Inbound Rows
  const inboundRows: any[][] = [
    [
      'ID รายการ', 'รหัสเอกสารรับเข้า', 'รหัสสินค้า', 'ชื่อสินค้า', 'สภาพสินค้า',
      'ผู้รับสินค้า', 'ผู้บันทึกลงระบบ', 'วันที่รับ', 'เวลารับ', 'จำนวน', 'หน่วยนับ',
      'คลังปลายทาง', 'โซนจัดเก็บ', 'ผู้จัดส่ง/ที่มา', 'รายละเอียดเพิ่มเติม'
    ],
    ...data.inboundRecords.map(inb => [
      inb.id,
      inb.transactionCode,
      inb.productCode,
      inb.productName,
      inb.condition === 'GOOD' ? 'ปกติ (Good)' : 'ชำรุด (Damaged)',
      inb.receiverName,
      inb.recorderName,
      inb.date,
      inb.time,
      inb.quantity,
      inb.unit,
      inb.warehouseName,
      inb.zoneName,
      inb.supplierOrSource || '',
      inb.details || ''
    ])
  ];

  // 4. Prepare Outbound Rows
  const outboundRows: any[][] = [
    [
      'ID รายการ', 'รหัสเอกสารส่งออก', 'รหัสสินค้า', 'ชื่อสินค้า', 'สภาพสินค้า',
      'ผู้ส่งมอบ', 'ผู้บันทึกลงระบบ', 'วันที่ส่งออก', 'เวลาส่งออก', 'จำนวน', 'หน่วยนับ',
      'คลังต้นทาง', 'โซนจัดเก็บ', 'ผู้รับ/ปลายทาง', 'รายละเอียดเพิ่มเติม'
    ],
    ...data.outboundRecords.map(outb => [
      outb.id,
      outb.transactionCode,
      outb.productCode,
      outb.productName,
      outb.condition === 'GOOD' ? 'ปกติ (Good)' : 'ชำรุด (Damaged)',
      outb.dispatcherName,
      outb.recorderName,
      outb.date,
      outb.time,
      outb.quantity,
      outb.unit,
      outb.warehouseName,
      outb.zoneName,
      outb.destination || '',
      outb.details || ''
    ])
  ];

  const batchUpdateUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Products!A1', values: productRows },
      { range: 'Inventory!A1', values: inventoryRows },
      { range: 'Inbound!A1', values: inboundRows },
      { range: 'Outbound!A1', values: outboundRows }
    ]
  };

  const response = await fetch(batchUpdateUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `ไม่สามารถใส่ข้อมูลลง Google Sheets ได้ (HTTP ${response.status})`);
  }
}

/**
 * Appends a single Inbound or Outbound transaction to Google Sheets in real-time
 */
export async function appendTransactionToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: 'Inbound' | 'Outbound',
  row: any[]
): Promise<boolean> {
  try {
    const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    });
    return res.ok;
  } catch (err) {
    console.warn(`Direct Google Sheet append failed:`, err);
    return false;
  }
}

/**
 * Read all data back from the Google Spreadsheet
 */
export async function readWmsSpreadsheetData(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  products: Product[];
  inventory: InventoryItem[];
  inbound: InboundRecord[];
  outbound: OutboundRecord[];
}> {
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchGet?ranges=Products!A2:L&ranges=Inventory!A2:J&ranges=Inbound!A2:O&ranges=Outbound!A2:O`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`ไม่สามารถดึงข้อมูลจากชีตได้ (HTTP ${response.status})`);
  }

  const data = await response.json();
  const valueRanges = data.valueRanges || [];

  // Parse Products
  const pRows = valueRanges[0]?.values || [];
  const products: Product[] = pRows.map((r: any[], i: number) => ({
    id: String(r[0] || `p-${i + 1}`),
    code: String(r[1] || ''),
    name: String(r[2] || ''),
    thaiName: String(r[3] || ''),
    chemicalFormula: String(r[4] || ''),
    characters: String(r[5] || ''),
    container: String(r[6] || 'ถุง'),
    unit: String(r[7] || 'กก.'),
    size: String(r[8] || ''),
    brand: String(r[9] || ''),
    minThreshold: Number(r[10]) || 0,
    createdAt: String(r[11] || new Date().toISOString()),
    updatedAt: String(r[11] || new Date().toISOString())
  }));

  // Parse Inventory
  const iRows = valueRanges[1]?.values || [];
  const inventory: InventoryItem[] = iRows.map((r: any[], i: number) => ({
    id: String(r[0] || `inv-${i + 1}`),
    productId: String(r[1] || ''),
    warehouseId: String(r[4] || 'wh-1'),
    zoneId: String(r[5] || 'zone-1'),
    quantityGood: Number(r[6]) || 0,
    quantityDamaged: Number(r[7]) || 0,
    lastUpdated: String(r[9] || new Date().toISOString())
  }));

  // Parse Inbound
  const inbRows = valueRanges[2]?.values || [];
  const inbound: InboundRecord[] = inbRows.map((r: any[], i: number) => ({
    id: String(r[0] || `inb-${i + 1}`),
    transactionCode: String(r[1] || ''),
    productCode: String(r[2] || ''),
    productName: String(r[3] || ''),
    condition: String(r[4]).includes('ชำรุด') ? 'DAMAGED' : 'GOOD',
    receiverName: String(r[5] || ''),
    recorderName: String(r[6] || ''),
    date: String(r[7] || ''),
    time: String(r[8] || ''),
    quantity: Number(r[9]) || 0,
    unit: String(r[10] || 'กก.'),
    warehouseName: String(r[11] || ''),
    zoneName: String(r[12] || ''),
    supplierOrSource: String(r[13] || ''),
    details: String(r[14] || '')
  }));

  // Parse Outbound
  const outbRows = valueRanges[3]?.values || [];
  const outbound: OutboundRecord[] = outbRows.map((r: any[], i: number) => ({
    id: String(r[0] || `out-${i + 1}`),
    transactionCode: String(r[1] || ''),
    productCode: String(r[2] || ''),
    productName: String(r[3] || ''),
    condition: String(r[4]).includes('ชำรุด') ? 'DAMAGED' : 'GOOD',
    dispatcherName: String(r[5] || ''),
    recorderName: String(r[6] || ''),
    date: String(r[7] || ''),
    time: String(r[8] || ''),
    quantity: Number(r[9]) || 0,
    unit: String(r[10] || 'กก.'),
    warehouseName: String(r[11] || ''),
    zoneName: String(r[12] || ''),
    destination: String(r[13] || ''),
    details: String(r[14] || '')
  }));

  return { products, inventory, inbound, outbound };
}
