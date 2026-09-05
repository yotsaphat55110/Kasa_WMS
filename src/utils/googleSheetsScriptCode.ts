/**
 * Raw Google Apps Script (Code.gs) template
 * ผู้ใช้สามารถนำโค้ดชุดนี้ไปวางใน Google Sheets -> Extensions -> Apps Script ได้ทันที
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * KASA WMS - Google Sheets Database Backend API (Google Apps Script)
 * ระบบคลังสินค้า เคเอเอสเอ จำกัด
 * =========================================================================
 * ฟังก์ชันหลัก:
 * 1. สร้างแท็บชีตให้อัตโนมัติ (Products, Inventory, Inbound, Outbound, AuditLogs)
 * 2. รับคำขอ GET/POST จากเว็บ KASA WMS
 * 3. ซิงค์ข้อมูลสต๊อก รับเข้า ส่งออก แบบ Real-time ถาวรบน Google Drive
 */

const SHEET_NAMES = {
  PRODUCTS: 'Products',
  INVENTORY: 'Inventory',
  INBOUND: 'Inbound',
  OUTBOUND: 'Outbound',
  LOGS: 'AuditLogs'
};

// 1. ตรวจสอบและสร้างหัวตารางชีตอัตโนมัติ
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet 1: Products
  let pSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  if (!pSheet) {
    pSheet = ss.insertSheet(SHEET_NAMES.PRODUCTS);
    pSheet.appendRow([
      'ID', 'รหัสสินค้า', 'ชื่อสินค้า', 'ชื่อไทย/เพิ่มเติม', 'สูตร/ชื่อเคมี', 
      'ลักษณะ', 'ภาชนะบรรจุ', 'หน่วยนับ', 'ขนาด', 'ยี่ห้อ', 'เกณฑ์เตือนหมด', 'วันที่สร้าง'
    ]);
    pSheet.getRange(1, 1, 1, 12).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
  }

  // Sheet 2: Inventory
  let iSheet = ss.getSheetByName(SHEET_NAMES.INVENTORY);
  if (!iSheet) {
    iSheet = ss.insertSheet(SHEET_NAMES.INVENTORY);
    iSheet.appendRow([
      'ID', 'ProductID', 'รหัสสินค้า', 'ชื่อสินค้า', 'คลังสินค้า', 
      'โซนจัดเก็บ', 'ของปกติ (Good)', 'ชำรุด (Damaged)', 'รวมทั้งหมด', 'อัปเดตล่าสุด'
    ]);
    iSheet.getRange(1, 1, 1, 10).setBackground('#047857').setFontColor('#ffffff').setFontWeight('bold');
  }

  // Sheet 3: Inbound
  let inSheet = ss.getSheetByName(SHEET_NAMES.INBOUND);
  if (!inSheet) {
    inSheet = ss.insertSheet(SHEET_NAMES.INBOUND);
    inSheet.appendRow([
      'ID', 'รหัสรับเข้า', 'รหัสสินค้า', 'ชื่อสินค้า', 'สภาพสินค้า', 
      'ผู้รับสินค้า', 'ผู้ลงระบบ', 'วันที่', 'เวลา', 'จำนวน', 'หน่วย', 'คลังสินค้า', 'โซน', 'ผู้จัดส่ง', 'รายละเอียด'
    ]);
    inSheet.getRange(1, 1, 1, 15).setBackground('#0284c7').setFontColor('#ffffff').setFontWeight('bold');
  }

  // Sheet 4: Outbound
  let outSheet = ss.getSheetByName(SHEET_NAMES.OUTBOUND);
  if (!outSheet) {
    outSheet = ss.insertSheet(SHEET_NAMES.OUTBOUND);
    outSheet.appendRow([
      'ID', 'รหัสส่งออก', 'รหัสสินค้า', 'ชื่อสินค้า', 'สภาพสินค้า', 
      'ผู้ส่งออก', 'ผู้ลงระบบ', 'วันที่', 'เวลา', 'จำนวน', 'หน่วย', 'คลังสินค้า', 'โซน', 'ปลายทาง', 'รายละเอียด'
    ]);
    outSheet.getRange(1, 1, 1, 15).setBackground('#b45309').setFontColor('#ffffff').setFontWeight('bold');
  }

  // Sheet 5: AuditLogs
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOGS);
    logSheet.appendRow(['ID', 'วันเวลา', 'รหัสพนักงาน', 'ชื่อผู้ทำรายการ', 'ประเภทรายการ', 'รายละเอียด']);
    logSheet.getRange(1, 1, 1, 6).setBackground('#475569').setFontColor('#ffffff').setFontWeight('bold');
  }
}

// 2. GET API: ดึงข้อมูลทั้งหมดจากชีตส่งกลับไปยัง Web App
function doGet(e) {
  setupDatabaseSheets();
  const action = (e && e.parameter && e.parameter.action) || 'getAll';
  
  if (action === 'ping') {
    return jsonResponse({
      status: 'success',
      message: 'เชื่อมต่อ Google Sheets Database ของ KASA WMS สำเร็จ 100%!',
      spreadsheetTitle: SpreadsheetApp.getActiveSpreadsheet().getName(),
      timestamp: new Date().toISOString()
    });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ดึงข้อมูล Products
  const pSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
  const pRows = pSheet.getDataRange().getValues();
  const products = [];
  for (let i = 1; i < pRows.length; i++) {
    const r = pRows[i];
    if (r[0] || r[1]) {
      products.push({
        id: String(r[0] || 'p-' + i),
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
      });
    }
  }

  // ดึงข้อมูล Inventory
  const iSheet = ss.getSheetByName(SHEET_NAMES.INVENTORY);
  const iRows = iSheet.getDataRange().getValues();
  const inventory = [];
  for (let i = 1; i < iRows.length; i++) {
    const r = iRows[i];
    if (r[0] || r[1]) {
      inventory.push({
        id: String(r[0] || 'inv-' + i),
        productId: String(r[1] || ''),
        warehouseId: String(r[4] || 'wh-1'),
        zoneId: String(r[5] || 'zone-1'),
        quantityGood: Number(r[6]) || 0,
        quantityDamaged: Number(r[7]) || 0,
        lastUpdated: String(r[9] || new Date().toISOString())
      });
    }
  }

  // ดึงข้อมูล Inbound
  const inSheet = ss.getSheetByName(SHEET_NAMES.INBOUND);
  const inRows = inSheet.getDataRange().getValues();
  const inbound = [];
  for (let i = 1; i < inRows.length; i++) {
    const r = inRows[i];
    if (r[0] || r[1]) {
      inbound.push({
        id: String(r[0] || 'inb-' + i),
        transactionCode: String(r[1] || ''),
        productCode: String(r[2] || ''),
        productName: String(r[3] || ''),
        condition: String(r[4] || 'GOOD'),
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
      });
    }
  }

  // ดึงข้อมูล Outbound
  const outSheet = ss.getSheetByName(SHEET_NAMES.OUTBOUND);
  const outRows = outSheet.getDataRange().getValues();
  const outbound = [];
  for (let i = 1; i < outRows.length; i++) {
    const r = outRows[i];
    if (r[0] || r[1]) {
      outbound.push({
        id: String(r[0] || 'out-' + i),
        transactionCode: String(r[1] || ''),
        productCode: String(r[2] || ''),
        productName: String(r[3] || ''),
        condition: String(r[4] || 'GOOD'),
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
      });
    }
  }

  return jsonResponse({
    status: 'success',
    timestamp: new Date().toISOString(),
    counts: {
      products: products.length,
      inventory: inventory.length,
      inbound: inbound.length,
      outbound: outbound.length
    },
    data: {
      products: products,
      inventory: inventory,
      inbound: inbound,
      outbound: outbound
    }
  });
}

// 3. POST API: บันทึกข้อมูล รับเข้า ส่งออก ปรับสต๊อก หรือซิงค์ทั้งระบบ
function doPost(e) {
  setupDatabaseSheets();
  try {
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // กรณี A: บันทึกรับเข้าสินค้า (Inbound)
    if (action === 'inbound') {
      const inSheet = ss.getSheetByName(SHEET_NAMES.INBOUND);
      const item = postData.data;
      inSheet.appendRow([
        item.id || ('inb-' + Date.now()),
        item.transactionCode,
        item.productCode,
        item.productName,
        item.condition,
        item.receiverName,
        item.recorderName,
        item.date,
        item.time,
        item.quantity,
        item.unit,
        item.warehouseName,
        item.zoneName,
        item.supplierOrSource || '',
        item.details || ''
      ]);

      // อัปเดตสต๊อกในชีต Inventory
      updateInventoryStock(ss, item.productId, item.productCode, item.productName, item.warehouseName, item.zoneName, item.quantity, item.condition, 'ADD');
      return jsonResponse({ status: 'success', message: 'บันทึกรับเข้าสินค้าลงชีตสำเร็จ' });
    }

    // กรณี B: บันทึกส่งออกสินค้า (Outbound)
    if (action === 'outbound') {
      const outSheet = ss.getSheetByName(SHEET_NAMES.OUTBOUND);
      const item = postData.data;
      outSheet.appendRow([
        item.id || ('out-' + Date.now()),
        item.transactionCode,
        item.productCode,
        item.productName,
        item.condition,
        item.dispatcherName,
        item.recorderName,
        item.date,
        item.time,
        item.quantity,
        item.unit,
        item.warehouseName,
        item.zoneName,
        item.destination || '',
        item.details || ''
      ]);

      // ตัดสต๊อกในชีต Inventory
      updateInventoryStock(ss, item.productId, item.productCode, item.productName, item.warehouseName, item.zoneName, item.quantity, item.condition, 'DEDUCT');
      return jsonResponse({ status: 'success', message: 'บันทึกส่งออกสินค้าลงชีตสำเร็จ' });
    }

    // กรณี C: ซิงค์ข้อมูลทั้งหมดจากเว็บขึ้น Google Sheets (Bulk Seed/Sync)
    if (action === 'syncAll') {
      const all = postData.data;
      
      // อัปเดต Products
      if (all.products && Array.isArray(all.products)) {
        const pSheet = ss.getSheetByName(SHEET_NAMES.PRODUCTS);
        pSheet.clear();
        pSheet.appendRow(['ID', 'รหัสสินค้า', 'ชื่อสินค้า', 'ชื่อไทย/เพิ่มเติม', 'สูตร/ชื่อเคมี', 'ลักษณะ', 'ภาชนะบรรจุ', 'หน่วยนับ', 'ขนาด', 'ยี่ห้อ', 'เกณฑ์เตือนหมด', 'วันที่สร้าง']);
        pSheet.getRange(1, 1, 1, 12).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
        all.products.forEach(p => {
          pSheet.appendRow([p.id, p.code, p.name, p.thaiName || '', p.chemicalFormula || '', p.characters || '', p.container || '', p.unit || '', p.size || '', p.brand || '', p.minThreshold || 0, p.createdAt || '']);
        });
      }

      // อัปเดต Inventory
      if (all.inventory && Array.isArray(all.inventory)) {
        const iSheet = ss.getSheetByName(SHEET_NAMES.INVENTORY);
        iSheet.clear();
        iSheet.appendRow(['ID', 'ProductID', 'รหัสสินค้า', 'ชื่อสินค้า', 'คลังสินค้า', 'โซนจัดเก็บ', 'ของปกติ (Good)', 'ชำรุด (Damaged)', 'รวมทั้งหมด', 'อัปเดตล่าสุด']);
        iSheet.getRange(1, 1, 1, 10).setBackground('#047857').setFontColor('#ffffff').setFontWeight('bold');
        all.inventory.forEach(inv => {
          const product = (all.products || []).find(p => p.id === inv.productId) || {};
          const total = (inv.quantityGood || 0) + (inv.quantityDamaged || 0);
          iSheet.appendRow([
            inv.id, inv.productId, product.code || '', product.name || '', 
            inv.warehouseId || '', inv.zoneId || '', inv.quantityGood || 0, inv.quantityDamaged || 0, total, inv.lastUpdated || ''
          ]);
        });
      }

      // อัปเดต Inbound
      if (all.inbound && Array.isArray(all.inbound)) {
        const inSheet = ss.getSheetByName(SHEET_NAMES.INBOUND);
        inSheet.clear();
        inSheet.appendRow(['ID', 'รหัสรับเข้า', 'รหัสสินค้า', 'ชื่อสินค้า', 'สภาพสินค้า', 'ผู้รับสินค้า', 'ผู้ลงระบบ', 'วันที่', 'เวลา', 'จำนวน', 'หน่วย', 'คลังสินค้า', 'โซน', 'ผู้จัดส่ง', 'รายละเอียด']);
        inSheet.getRange(1, 1, 1, 15).setBackground('#0284c7').setFontColor('#ffffff').setFontWeight('bold');
        all.inbound.forEach(item => {
          inSheet.appendRow([
            item.id, item.transactionCode, item.productCode, item.productName, item.condition,
            item.receiverName, item.recorderName, item.date, item.time, item.quantity, item.unit,
            item.warehouseName, item.zoneName, item.supplierOrSource || '', item.details || ''
          ]);
        });
      }

      // อัปเดต Outbound
      if (all.outbound && Array.isArray(all.outbound)) {
        const outSheet = ss.getSheetByName(SHEET_NAMES.OUTBOUND);
        outSheet.clear();
        outSheet.appendRow(['ID', 'รหัสส่งออก', 'รหัสสินค้า', 'ชื่อสินค้า', 'สภาพสินค้า', 'ผู้ส่งออก', 'ผู้ลงระบบ', 'วันที่', 'เวลา', 'จำนวน', 'หน่วย', 'คลังสินค้า', 'โซน', 'ปลายทาง', 'รายละเอียด']);
        outSheet.getRange(1, 1, 1, 15).setBackground('#b45309').setFontColor('#ffffff').setFontWeight('bold');
        all.outbound.forEach(item => {
          outSheet.appendRow([
            item.id, item.transactionCode, item.productCode, item.productName, item.condition,
            item.dispatcherName, item.recorderName, item.date, item.time, item.quantity, item.unit,
            item.warehouseName, item.zoneName, item.destination || '', item.details || ''
          ]);
        });
      }

      return jsonResponse({ status: 'success', message: 'ซิงค์ข้อมูลทั้งระบบขึ้น Google Sheets เรียบร้อยแล้ว' });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });

  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

// ฟังก์ชันช่วยอัปเดตสต๊อกคงเหลือในชีต Inventory
function updateInventoryStock(ss, productId, productCode, productName, whName, zoneName, qty, condition, type) {
  const iSheet = ss.getSheetByName(SHEET_NAMES.INVENTORY);
  const rows = iSheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === String(productId) || String(rows[i][2]) === String(productCode)) {
      foundRow = i + 1;
      break;
    }
  }

  const delta = type === 'ADD' ? qty : -qty;

  if (foundRow > 0) {
    let currentGood = Number(iSheet.getRange(foundRow, 7).getValue()) || 0;
    let currentDamaged = Number(iSheet.getRange(foundRow, 8).getValue()) || 0;

    if (condition === 'DAMAGED') {
      currentDamaged = Math.max(0, currentDamaged + delta);
      iSheet.getRange(foundRow, 8).setValue(currentDamaged);
    } else {
      currentGood = Math.max(0, currentGood + delta);
      iSheet.getRange(foundRow, 7).setValue(currentGood);
    }

    iSheet.getRange(foundRow, 9).setValue(currentGood + currentDamaged);
    iSheet.getRange(foundRow, 10).setValue(new Date().toISOString());
  } else {
    // ถ้ายังไม่มีแถว ให้เพิ่มแถวใหม่
    const good = condition === 'DAMAGED' ? 0 : Math.max(0, delta);
    const damaged = condition === 'DAMAGED' ? Math.max(0, delta) : 0;
    iSheet.appendRow([
      'inv-' + Date.now(),
      productId,
      productCode,
      productName,
      whName,
      zoneName,
      good,
      damaged,
      good + damaged,
      new Date().toISOString()
    ]);
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
