export type Language = 'th' | 'en';

export type ProductCondition = 'GOOD' | 'DAMAGED';

export type ProductContainer = 'ถุง' | 'ถัง' | 'ชิ้น' | 'อัน' | 'กล่อง' | 'แกลลอน' | 'หลอด' | 'พาเลท' | string;

export type ProductUnit = 'กิโลกรัม' | 'กก.' | 'ตัน' | 'กรัม' | 'ลิตร' | 'มิลลิลิตร' | 'ชิ้น' | 'อัน' | 'ถุง' | 'ถัง' | string;

export interface Product {
  id: string;
  code: string; // 3.1 รหัสสินค้า
  name: string; // 3.2 ชื่อสินค้า
  thaiName?: string; // ชื่อภาษาไทย / คำอธิบายเพิ่มเติม
  chemicalFormula: string; // 3.5 ชื่อทางเคมี / สูตรเคมี
  characters: string; // 3.4 ลักษณะวัสดุ (Solid/ผง/ก้อน, Liquid/เหลว, ฯลฯ)
  container: ProductContainer; // 3.3 ภาชนะบรรจุ
  unit: ProductUnit; // 3.6 หน่วยนับ
  size: string; // ขนาดบรรจุ เช่น 25 กก.
  brand: string; // 3.7 ชื่อยี่ห้อสินค้า
  minThreshold: number; // เกณฑ์การแจ้งเตือนสินค้าใกล้หมด
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string; // เช่น โซน A1 - สารเคมีผง, โซน B2 - สารเคมีเหลว
  description?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string; // เช่น คลังสินค้าหลัก (Main WH), คลังเคมี A, คลังระยอง
  location: string;
  zones: Zone[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  zoneId: string;
  quantityGood: number; // ของปกติ
  quantityDamaged: number; // สินค้าชำรุดเสียหาย
  lastUpdated: string;
  lastAdjustedBy?: string;
}

export interface InboundRecord {
  id: string;
  transactionCode: string; // e.g. INB-20260803-001
  productId: string;
  productCode: string; // 1.1
  productName: string; // 1.1
  details?: string; // 1.2 รายละเอียดสินค้า
  condition: ProductCondition; // ของใหม่ / ของเก่า / สินค้าชำรุด
  receiverName: string; // 1.3 ชื่อผู้รับสินค้า
  recorderName: string; // 1.3 ผู้บันทึกในระบบ (กรณีไม่ใช่คนเดียวกัน)
  recorderId: string;
  date: string; // 1.3 วันที่ YYYY-MM-DD
  time: string; // 1.3 เวลา HH:mm
  quantity: number; // 1.4 จำนวนสินค้า
  unit: string;
  warehouseId: string; // 1.5
  warehouseName: string; // 1.5
  zoneId: string; // 1.5
  zoneName: string; // 1.5
  damageNote?: string; // กรณีชำรุด
  supplierOrSource?: string; // ผู้จัดส่ง / บริษัทต้นทาง
}

export interface OutboundRecord {
  id: string;
  transactionCode: string; // e.g. OUT-20260803-001
  productId: string;
  productCode: string; // 2.1
  productName: string; // 2.1
  details?: string; // 2.2 รายละเอียดสินค้า
  condition: ProductCondition;
  dispatcherName: string; // 2.3 ชื่อผู้ส่งออกสินค้า
  recorderName: string; // 2.3 ผู้บันทึกในระบบ
  recorderId: string;
  date: string; // 2.3 วันที่
  time: string; // 2.3 เวลา
  quantity: number; // 2.4 จำนวนสินค้า
  unit: string;
  warehouseId: string; // 2.5 คลังที่ออก
  warehouseName: string;
  zoneId: string; // 2.5 โซนที่ออก
  zoneName: string;
  destination?: string; // ลูกค้า / แผนกผู้รับปลายทาง
  damageNote?: string;
}

export interface User {
  id: string; // 5.1 ID
  employeeCode: string; // 5.2 รหัสพนักงาน (e.g. EMP-001)
  username?: string; // ชื่อผู้ใช้งาน (Username)
  password?: string; // รหัสผ่าน (Password)
  firstName: string; // 5.3 ชื่อ
  lastName: string; // 5.3 นามสกุล
  email: string; // 5.4 E-Mail
  phone: string; // 5.5 เบอร์โทรศัพท์
  status: 0 | 1; // 5.6 Status (0 = ไม่ใช้งาน, 1 = ใช้งาน)
  role: 'Admin' | 'Stock Manager' | 'Warehouse Officer' | 'Inspector';
  avatarUrl?: string;
}

export interface AuditLog {
  id: string; // 6.1 ID
  timestamp: string; // วันเวลาที่ทำรายการ
  userId: string;
  employeeCode: string;
  userName: string; // ชื่อพนักงานผู้ทำรายการ
  actionType: 
    | 'INBOUND'
    | 'OUTBOUND'
    | 'STOCK_ADJUST'
    | 'PRODUCT_CREATE'
    | 'PRODUCT_UPDATE'
    | 'USER_CREATE'
    | 'USER_UPDATE'
    | 'LINE_CONFIG_UPDATE'
    | 'DAMAGE_REPORT'
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'SYSTEM_CONFIG';
  details: string; // รายละเอียดการทำงาน
  ipAddress?: string;
}

export interface NotificationAlert {
  id: string;
  timestamp: string;
  type: 'LOW_STOCK' | 'INBOUND' | 'OUTBOUND' | 'DAMAGED_STOCK';
  title: string;
  message: string;
  isRead: boolean;
  sentToLine: boolean;
  relatedProductId?: string;
}

export interface LineConfig {
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  liffId: string;
  customDeployedUrl?: string;
  lineBotGroupId: string;
  lineBotEnabled: boolean;
  notifyLowStock: boolean;
  notifyInbound: boolean;
  notifyOutbound: boolean;
  notifyDamaged: boolean;
  webhookStatus: 'CONNECTED' | 'DISCONNECTED' | 'TESTING';
}

export interface LineWebhookLog {
  id: string;
  timestamp: string;
  eventType: 'message' | 'join' | 'leave' | 'memberJoined' | 'memberLeft' | 'follow' | 'unfollow' | 'postback' | 'verify' | 'unknown';
  sourceType: 'user' | 'group' | 'room' | 'system';
  userId?: string;
  userName?: string;
  userPictureUrl?: string;
  statusMessage?: string;
  groupId?: string;
  groupName?: string;
  groupPictureUrl?: string;
  roomId?: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker' | string;
  messageText?: string;
  replyToken?: string;
  details: string;
  status: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  rawPayload?: any;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetTitle?: string;
  autoSync: boolean;
  lastSyncTime?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'CONNECTED' | 'ERROR';
  errorMessage?: string;
}

export type ViewTab = 
  | 'inventory' // คลังสินค้า / สต๊อก
  | 'inbound' // รับเข้า
  | 'outbound' // ส่งออก
  | 'catalog' // รายการสินค้า
  | 'zones' // จัดการโซนจัดเก็บ
  | 'users' // จัดการ User
  | 'audit-log' // Log การทำงาน
  | 'line-oa' // Line OA / LIFF / Bot
  | 'reports' // รายงาน Report
  | 'database'; // ฐานข้อมูล Google Sheets
