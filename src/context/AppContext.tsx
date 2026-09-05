import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Product,
  Warehouse,
  Zone,
  InventoryItem,
  InboundRecord,
  OutboundRecord,
  User,
  AuditLog,
  NotificationAlert,
  LineConfig,
  Language,
  ViewTab,
  ProductCondition,
  GoogleSheetsConfig
} from '../types';
import {
  syncAllToGoogleSheets,
  fetchAllFromGoogleSheets,
  postTransactionToGoogleSheets
} from '../services/googleSheetsService';
import {
  createWmsSpreadsheetDirect,
  populateWmsSpreadsheetData,
  readWmsSpreadsheetData,
  appendTransactionToGoogleSheet
} from '../services/googleSheetsDirectService';
import {
  getAccessToken,
  googleSignIn,
  logoutGoogle
} from '../services/googleAuthService';
import {
  initialProducts,
  initialWarehouses,
  generateInitialInventory,
  initialInboundRecords,
  initialOutboundRecords,
  initialUsers,
  initialAuditLogs,
  initialNotifications,
  initialLineConfig
} from '../data/initialData';
import { translations } from '../data/translations';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['th'];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  
  products: Product[];
  warehouses: Warehouse[];
  inventory: InventoryItem[];
  inboundRecords: InboundRecord[];
  outboundRecords: OutboundRecord[];
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  login: (employeeCodeOrEmail: string, password?: string) => { success: boolean; message: string };
  logout: () => void;
  auditLogs: AuditLog[];
  notifications: NotificationAlert[];
  lineConfig: LineConfig;
  googleSheetsConfig: GoogleSheetsConfig;
  updateGoogleSheetsConfig: (config: Partial<GoogleSheetsConfig>) => void;
  syncToGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  fetchFromGoogleSheets: () => Promise<{ success: boolean; message: string }>;
  createAndPopulateGoogleSheetDirect: (customTitle?: string) => Promise<{ success: boolean; message: string; sheetUrl?: string; sheetId?: string }>;
  fetchDirectFromGoogleSheet: () => Promise<{ success: boolean; message: string }>;
  
  // Actions
  addInbound: (record: Omit<InboundRecord, 'id' | 'transactionCode'>) => { success: boolean; message: string };
  addOutbound: (record: Omit<OutboundRecord, 'id' | 'transactionCode'>) => { success: boolean; message: string };
  adjustInventory: (inventoryId: string, newGoodQty: number, newDamagedQty: number, reason: string) => void;
  saveProduct: (productData: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  saveWarehouse: (whData: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => { success: boolean; message: string };
  saveZone: (warehouseId: string, zoneData: Partial<Zone>) => void;
  deleteZone: (warehouseId: string, zoneId: string) => { success: boolean; message: string };
  saveUser: (userData: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  updateLineConfig: (config: Partial<LineConfig>) => void;
  triggerLineTestBroadcast: (customMsg?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Helper getters
  getProductById: (id: string) => Product | undefined;
  getWarehouseById: (id: string) => Warehouse | undefined;
  getLowStockProducts: () => Array<{ product: Product; totalQty: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('kasa_language');
    return (saved === 'en' || saved === 'th') ? saved : 'th';
  });
  const [activeTab, setActiveTab] = useState<ViewTab>('inventory');
  
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kasa_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem('kasa_warehouses');
    return saved ? JSON.parse(saved) : initialWarehouses;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('kasa_inventory');
    return saved ? JSON.parse(saved) : generateInitialInventory();
  });

  const [inboundRecords, setInboundRecords] = useState<InboundRecord[]>(() => {
    const saved = localStorage.getItem('kasa_inbound');
    return saved ? JSON.parse(saved) : initialInboundRecords;
  });

  const [outboundRecords, setOutboundRecords] = useState<OutboundRecord[]>(() => {
    const saved = localStorage.getItem('kasa_outbound');
    return saved ? JSON.parse(saved) : initialOutboundRecords;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kasa_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('kasa_auth_status');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('kasa_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return users[0] || initialUsers[0];
  });

  const login = (employeeCodeOrEmail: string, password?: string) => {
    const query = employeeCodeOrEmail.trim().toLowerCase();
    const targetUser = users.find(u => 
      (u.username && u.username.toLowerCase() === query) ||
      u.employeeCode.toLowerCase() === query || 
      u.email.toLowerCase() === query ||
      u.firstName.toLowerCase() === query ||
      `${u.firstName} ${u.lastName}`.toLowerCase() === query
    );

    if (!targetUser) {
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้งาน ชื่อผู้ใช้ หรือรหัสพนักงานในระบบ' };
    }

    if (targetUser.status === 0) {
      return { success: false, message: `บัญชีผู้ใช้งาน ${targetUser.firstName} (${targetUser.employeeCode}) ถูกระงับการใช้งานชั่วคราว` };
    }

    // Password validation if password parameter is provided
    if (password !== undefined && password !== '') {
      const expectedPassword = targetUser.password || '123456';
      if (password !== expectedPassword) {
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
      }
    }

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    
    // Add audit log for login
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: targetUser.id,
      employeeCode: targetUser.employeeCode,
      userName: `${targetUser.firstName} ${targetUser.lastName}`,
      actionType: 'USER_LOGIN',
      details: `เข้าสู่ระบบสำเร็จ (สิทธิ์ใช้งาน: ${targetUser.role})`,
      ipAddress: '127.0.0.1 (Cloud Run)'
    };
    setAuditLogs(prev => [newLog, ...prev]);

    return { success: true, message: `เข้าสู่ระบบเรียบร้อย ยินดีต้อนรับคุณ ${targetUser.firstName} ${targetUser.lastName}` };
  };

  const logout = () => {
    if (currentUser) {
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        employeeCode: currentUser.employeeCode,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        actionType: 'USER_LOGOUT',
        details: `ออกจากระบบ`,
        ipAddress: '127.0.0.1 (Cloud Run)'
      };
      setAuditLogs(prev => [newLog, ...prev]);
    }
    setIsAuthenticated(false);
  };

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('kasa_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [notifications, setNotifications] = useState<NotificationAlert[]>(() => {
    const saved = localStorage.getItem('kasa_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [lineConfig, setLineConfig] = useState<LineConfig>(() => {
    const saved = localStorage.getItem('kasa_line_config');
    return saved ? JSON.parse(saved) : initialLineConfig;
  });

  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('kasa_google_sheets_config');
    return saved ? JSON.parse(saved) : {
      webAppUrl: '',
      spreadsheetUrl: '',
      autoSync: true,
      syncStatus: 'IDLE'
    };
  });

  // LocalStorage syncing
  useEffect(() => {
    localStorage.setItem('kasa_google_sheets_config', JSON.stringify(googleSheetsConfig));
  }, [googleSheetsConfig]);

  const updateGoogleSheetsConfig = (partial: Partial<GoogleSheetsConfig>) => {
    setGoogleSheetsConfig(prev => ({ ...prev, ...partial }));
  };

  const syncToGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!googleSheetsConfig.webAppUrl || !googleSheetsConfig.webAppUrl.trim()) {
      return { success: false, message: 'กรุณาระบุ URL ของ Google Apps Script Web App ก่อน' };
    }
    setGoogleSheetsConfig(prev => ({ ...prev, syncStatus: 'SYNCING' }));
    try {
      const res = await syncAllToGoogleSheets(googleSheetsConfig.webAppUrl, {
        products,
        inventory,
        inbound: inboundRecords,
        outbound: outboundRecords
      });
      setGoogleSheetsConfig(prev => ({ 
        ...prev, 
        syncStatus: 'CONNECTED',
        lastSyncTime: new Date().toISOString(),
        errorMessage: undefined
      }));
      addAuditLog('SYSTEM_CONFIG', 'ซิงค์ข้อมูลทั้งระบบ (Products, Inventory, Inbound, Outbound) ขึ้น Google Sheets สำเร็จ');
      return { success: true, message: res.message || 'ซิงค์ข้อมูลขึ้น Google Sheets เรียบร้อยแล้ว' };
    } catch (err: any) {
      setGoogleSheetsConfig(prev => ({
        ...prev,
        syncStatus: 'ERROR',
        errorMessage: err.message
      }));
      return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการซิงค์ข้อมูล' };
    }
  };

  const fetchFromGoogleSheets = async (): Promise<{ success: boolean; message: string }> => {
    if (!googleSheetsConfig.webAppUrl || !googleSheetsConfig.webAppUrl.trim()) {
      return { success: false, message: 'กรุณาระบุ URL ของ Google Apps Script Web App ก่อน' };
    }
    setGoogleSheetsConfig(prev => ({ ...prev, syncStatus: 'SYNCING' }));
    try {
      const data = await fetchAllFromGoogleSheets(googleSheetsConfig.webAppUrl);
      if (data) {
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
        if (data.inventory && Array.isArray(data.inventory) && data.inventory.length > 0) {
          setInventory(data.inventory);
        }
        if (data.inbound && Array.isArray(data.inbound) && data.inbound.length > 0) {
          setInboundRecords(data.inbound);
        }
        if (data.outbound && Array.isArray(data.outbound) && data.outbound.length > 0) {
          setOutboundRecords(data.outbound);
        }
      }
      setGoogleSheetsConfig(prev => ({
        ...prev,
        syncStatus: 'CONNECTED',
        lastSyncTime: new Date().toISOString(),
        errorMessage: undefined
      }));
      addAuditLog('SYSTEM_CONFIG', 'ดึงข้อมูลล่าสุดจาก Google Sheets มาอัปเดตระบบสำเร็จ');
      return { success: true, message: 'ดึงข้อมูลล่าสุดจาก Google Sheets เรียบร้อยแล้ว' };
    } catch (err: any) {
      setGoogleSheetsConfig(prev => ({
        ...prev,
        syncStatus: 'ERROR',
        errorMessage: err.message
      }));
      return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' };
    }
  };

  const createAndPopulateGoogleSheetDirect = async (customTitle?: string): Promise<{ success: boolean; message: string; sheetUrl?: string; sheetId?: string }> => {
    let token = getAccessToken();
    if (!token) {
      try {
        const signResult = await googleSignIn();
        token = signResult.accessToken;
      } catch (err: any) {
        return { success: false, message: 'กรุณาอนุญาตการเข้าสู่ระบบ Google เพื่อสร้าง Google Sheets: ' + err.message };
      }
    }

    setGoogleSheetsConfig(prev => ({ ...prev, syncStatus: 'SYNCING' }));
    try {
      const title = customTitle || 'KASA WMS - ระบบสต๊อกสินค้าเคมีภัณฑ์ (Database)';
      const created = await createWmsSpreadsheetDirect(token, title);
      
      // Populate all current data into the newly created sheet
      await populateWmsSpreadsheetData(token, created.spreadsheetId, {
        products,
        inventory,
        inboundRecords,
        outboundRecords
      });

      setGoogleSheetsConfig(prev => ({
        ...prev,
        spreadsheetId: created.spreadsheetId,
        spreadsheetUrl: created.spreadsheetUrl,
        spreadsheetTitle: created.title,
        syncStatus: 'CONNECTED',
        lastSyncTime: new Date().toISOString(),
        errorMessage: undefined
      }));

      addAuditLog('SYSTEM_CONFIG', `สร้าง Google Sheets "${created.title}" และบันทึกข้อมูลสินค้า สต๊อก รับเข้า ส่งออก สำเร็จเรียบร้อย`);
      return {
        success: true,
        message: 'สร้าง Google Sheets และบันทึกข้อมูลทั้งหมดขึ้น Google Drive สำเร็จ 100%!',
        sheetUrl: created.spreadsheetUrl,
        sheetId: created.spreadsheetId
      };
    } catch (err: any) {
      console.error('Create sheet direct error:', err);
      setGoogleSheetsConfig(prev => ({
        ...prev,
        syncStatus: 'ERROR',
        errorMessage: err.message
      }));
      return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการสร้าง Google Sheets' };
    }
  };

  const fetchDirectFromGoogleSheet = async (): Promise<{ success: boolean; message: string }> => {
    let token = getAccessToken();
    if (!token) {
      try {
        const signResult = await googleSignIn();
        token = signResult.accessToken;
      } catch (err: any) {
        return { success: false, message: 'กรุณาเข้าสู่ระบบ Google ก่อนดึงข้อมูล: ' + err.message };
      }
    }

    if (!googleSheetsConfig.spreadsheetId) {
      return { success: false, message: 'ยังไม่พบ Spreadsheet ID กรุณาสร้างหรือระบุ ID ของ Google Sheets ก่อน' };
    }

    setGoogleSheetsConfig(prev => ({ ...prev, syncStatus: 'SYNCING' }));
    try {
      const data = await readWmsSpreadsheetData(token, googleSheetsConfig.spreadsheetId);
      if (data.products.length > 0) setProducts(data.products);
      if (data.inventory.length > 0) setInventory(data.inventory);
      if (data.inbound.length > 0) setInboundRecords(data.inbound);
      if (data.outbound.length > 0) setOutboundRecords(data.outbound);

      setGoogleSheetsConfig(prev => ({
        ...prev,
        syncStatus: 'CONNECTED',
        lastSyncTime: new Date().toISOString(),
        errorMessage: undefined
      }));

      addAuditLog('SYSTEM_CONFIG', 'ดึงข้อมูลล่าสุดจาก Google Sheets โดยตรงสำเร็จ');
      return { success: true, message: 'ดึงข้อมูลล่าสุดจาก Google Sheets เรียบร้อยแล้ว' };
    } catch (err: any) {
      setGoogleSheetsConfig(prev => ({
        ...prev,
        syncStatus: 'ERROR',
        errorMessage: err.message
      }));
      return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheets' };
    }
  };

  // LocalStorage syncing
  useEffect(() => {
    localStorage.setItem('kasa_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('kasa_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('kasa_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('kasa_inbound', JSON.stringify(inboundRecords));
  }, [inboundRecords]);

  useEffect(() => {
    localStorage.setItem('kasa_outbound', JSON.stringify(outboundRecords));
  }, [outboundRecords]);

  useEffect(() => {
    localStorage.setItem('kasa_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('kasa_auth_status', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('kasa_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('kasa_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('kasa_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('kasa_line_config', JSON.stringify(lineConfig));
  }, [lineConfig]);

  useEffect(() => {
    localStorage.setItem('kasa_language', language);
  }, [language]);

  const t = translations[language] || translations.th;

  // Helper getters
  const getProductById = (id: string) => products.find(p => p.id === id);
  const getWarehouseById = (id: string) => warehouses.find(w => w.id === id);

  const getLowStockProducts = () => {
    const result: Array<{ product: Product; totalQty: number }> = [];
    products.forEach(product => {
      const totalQty = inventory
        .filter(inv => inv.productId === product.id)
        .reduce((sum, inv) => sum + inv.quantityGood, 0);
      
      if (totalQty <= product.minThreshold) {
        result.push({ product, totalQty });
      }
    });
    return result;
  };

  const addAuditLog = (
    actionType: AuditLog['actionType'],
    details: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      employeeCode: currentUser.employeeCode,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      actionType,
      details,
      ipAddress: '127.0.0.1 (Cloud Run)'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addNotification = (
    type: NotificationAlert['type'],
    title: string,
    message: string,
    relatedProductId?: string
  ) => {
    const newNotif: NotificationAlert = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      title,
      message,
      isRead: false,
      sentToLine: lineConfig.lineBotEnabled,
      relatedProductId
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Add Inbound
  const addInbound = (data: Omit<InboundRecord, 'id' | 'transactionCode'>) => {
    const txCode = `INB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: InboundRecord = {
      ...data,
      id: `inb-${Date.now()}`,
      transactionCode: txCode
    };

    setInboundRecords(prev => [newRecord, ...prev]);

    // Update Inventory
    setInventory(prev => {
      const existingIdx = prev.findIndex(
        inv => inv.productId === data.productId && inv.warehouseId === data.warehouseId && inv.zoneId === data.zoneId
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const item = { ...updated[existingIdx] };
        
        if (data.condition === 'DAMAGED') {
          item.quantityDamaged += data.quantity;
        } else {
          item.quantityGood += data.quantity;
        }
        item.lastUpdated = new Date().toISOString();
        item.lastAdjustedBy = `${currentUser.firstName} (${currentUser.employeeCode})`;
        updated[existingIdx] = item;
        return updated;
      } else {
        // Create new inventory allocation
        const newItem: InventoryItem = {
          id: `inv-${data.productId}-${data.warehouseId}-${Date.now()}`,
          productId: data.productId,
          warehouseId: data.warehouseId,
          zoneId: data.zoneId,
          quantityGood: data.condition === 'DAMAGED' ? 0 : data.quantity,
          quantityDamaged: data.condition === 'DAMAGED' ? data.quantity : 0,
          lastUpdated: new Date().toISOString(),
          lastAdjustedBy: `${currentUser.firstName} (${currentUser.employeeCode})`
        };
        return [newItem, ...prev];
      }
    });

    // Audit Log
    addAuditLog(
      'INBOUND',
      `รับเข้าสินค้า ${data.productName} (${data.productCode}) จำนวน ${data.quantity.toLocaleString()} ${data.unit} เข้าคลัง ${data.warehouseName} โซน ${data.zoneName} โดยผู้รับ: ${data.receiverName}`
    );

    // Notification
    const notifTitle = data.condition === 'DAMAGED' ? 'พบสินค้าชำรุดตอนรับเข้า!' : 'รับเข้าสินค้าเรียบร้อย';
    addNotification(
      data.condition === 'DAMAGED' ? 'DAMAGED_STOCK' : 'INBOUND',
      notifTitle,
      `รับเข้า ${data.productName} จำนวน ${data.quantity.toLocaleString()} ${data.unit} ผู้รับ: ${data.receiverName} (บันทึกโดย ${data.recorderName})`,
      data.productId
    );

    // Background sync to Google Sheets if configured
    if (googleSheetsConfig.autoSync) {
      if (googleSheetsConfig.webAppUrl) {
        postTransactionToGoogleSheets(googleSheetsConfig.webAppUrl, 'inbound', {
          ...data,
          id: newRecord.id,
          transactionCode: txCode
        }).catch(err => console.warn('Google Sheets background sync failed:', err));
      }
      const token = getAccessToken();
      if (token && googleSheetsConfig.spreadsheetId) {
        appendTransactionToGoogleSheet(token, googleSheetsConfig.spreadsheetId, 'Inbound', [
          newRecord.id,
          txCode,
          data.productCode,
          data.productName,
          data.condition === 'GOOD' ? 'ปกติ (Good)' : 'ชำรุด (Damaged)',
          data.receiverName,
          data.recorderName,
          data.date,
          data.time,
          data.quantity,
          data.unit,
          data.warehouseName,
          data.zoneName,
          data.supplierOrSource || '',
          data.details || ''
        ]).catch(err => console.warn('Direct Google Sheet append failed:', err));
      }
    }

    return { success: true, message: 'บันทึกรับเข้าสินค้าเรียบร้อยแล้ว' };
  };

  // Add Outbound
  const addOutbound = (data: Omit<OutboundRecord, 'id' | 'transactionCode'>) => {
    const txCode = `OUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: OutboundRecord = {
      ...data,
      id: `out-${Date.now()}`,
      transactionCode: txCode
    };

    setOutboundRecords(prev => [newRecord, ...prev]);

    // Deduct stock or create new record if zone stock doesn't exist yet
    setInventory(prev => {
      const existingIdx = prev.findIndex(
        inv => inv.productId === data.productId && inv.warehouseId === data.warehouseId && inv.zoneId === data.zoneId
      );

      if (existingIdx >= 0) {
        return prev.map((inv, idx) => {
          if (idx === existingIdx) {
            return {
              ...inv,
              quantityGood: data.condition === 'DAMAGED' ? inv.quantityGood : Math.max(0, inv.quantityGood - data.quantity),
              quantityDamaged: data.condition === 'DAMAGED' ? Math.max(0, inv.quantityDamaged - data.quantity) : inv.quantityDamaged,
              lastUpdated: new Date().toISOString(),
              lastAdjustedBy: `${currentUser.firstName} (${currentUser.employeeCode})`
            };
          }
          return inv;
        });
      } else {
        // Create new inventory row with 0 initial stock for this product/warehouse/zone
        const newItem: InventoryItem = {
          id: `inv-${data.productId}-${data.warehouseId}-${Date.now()}`,
          productId: data.productId,
          warehouseId: data.warehouseId,
          zoneId: data.zoneId,
          quantityGood: 0,
          quantityDamaged: 0,
          lastUpdated: new Date().toISOString(),
          lastAdjustedBy: `${currentUser.firstName} (${currentUser.employeeCode})`
        };
        return [newItem, ...prev];
      }
    });

    // Audit Log
    addAuditLog(
      'OUTBOUND',
      `ส่งออกสินค้า ${data.productName} (${data.productCode}) จำนวน ${data.quantity.toLocaleString()} ${data.unit} ออกจากคลัง ${data.warehouseName} โซน ${data.zoneName} โดยผู้ส่ง: ${data.dispatcherName}`
    );

    // Check if low stock reached
    const product = getProductById(data.productId);
    const totalRemainingGood = inventory
      .filter(inv => inv.productId === data.productId)
      .reduce((sum, inv) => sum + inv.quantityGood, 0) - data.quantity;

    if (product && totalRemainingGood <= product.minThreshold) {
      addNotification(
        'LOW_STOCK',
        'เตือนสินค้าใกล้หมดสต๊อก!',
        `สินค้า ${product.name} คงเหลือรวม ${totalRemainingGood.toLocaleString()} ${data.unit} (ต่ำกว่าจุดเตือน ${product.minThreshold} ${data.unit})`,
        data.productId
      );
    } else {
      addNotification(
        'OUTBOUND',
        'ส่งออกสินค้าเรียบร้อย',
        `ส่งออก ${data.productName} จำนวน ${data.quantity.toLocaleString()} ${data.unit} ผู้ส่ง: ${data.dispatcherName}`,
        data.productId
      );
    }

    // Background sync to Google Sheets if configured
    if (googleSheetsConfig.autoSync) {
      if (googleSheetsConfig.webAppUrl) {
        postTransactionToGoogleSheets(googleSheetsConfig.webAppUrl, 'outbound', {
          ...data,
          id: newRecord.id,
          transactionCode: txCode
        }).catch(err => console.warn('Google Sheets background sync failed:', err));
      }
      const token = getAccessToken();
      if (token && googleSheetsConfig.spreadsheetId) {
        appendTransactionToGoogleSheet(token, googleSheetsConfig.spreadsheetId, 'Outbound', [
          newRecord.id,
          txCode,
          data.productCode,
          data.productName,
          data.condition === 'GOOD' ? 'ปกติ (Good)' : 'ชำรุด (Damaged)',
          data.dispatcherName,
          data.recorderName,
          data.date,
          data.time,
          data.quantity,
          data.unit,
          data.warehouseName,
          data.zoneName,
          data.destination || '',
          data.details || ''
        ]).catch(err => console.warn('Direct Google Sheet append failed:', err));
      }
    }

    return { success: true, message: 'บันทึกส่งออกสินค้าเรียบร้อยแล้ว' };
  };

  // Adjust Inventory
  const adjustInventory = (inventoryId: string, newGoodQty: number, newDamagedQty: number, reason: string) => {
    let affectedProduct = '';
    setInventory(prev =>
      prev.map(item => {
        if (item.id === inventoryId) {
          affectedProduct = item.productId;
          return {
            ...item,
            quantityGood: newGoodQty,
            quantityDamaged: newDamagedQty,
            lastUpdated: new Date().toISOString(),
            lastAdjustedBy: `${currentUser.firstName} (${currentUser.employeeCode})`
          };
        }
        return item;
      })
    );

    const product = getProductById(affectedProduct);
    const prodName = product ? product.name : 'สินค้า';

    addAuditLog(
      'STOCK_ADJUST',
      `ปรับปรุงจำนวนสต๊อก ${prodName}: ปกติ = ${newGoodQty}, ชำรุด = ${newDamagedQty} (เหตุผล: ${reason})`
    );

    addNotification(
      'LOW_STOCK',
      'ปรับปรุงสต๊อกสินค้าเรียบร้อย',
      `ปรับปรุงสต๊อก ${prodName} โดย ${currentUser.firstName} (${reason})`
    );
  };

  // Product CRUD
  const saveProduct = (productData: Partial<Product>) => {
    if (productData.id) {
      setProducts(prev =>
        prev.map(p => (p.id === productData.id ? ({ ...p, ...productData, updatedAt: new Date().toISOString() } as Product) : p))
      );
      addAuditLog('PRODUCT_UPDATE', `แก้ไขข้อมูลสินค้า ${productData.name} (${productData.code})`);
    } else {
      const newProd: Product = {
        id: `p-${Date.now()}`,
        code: productData.code || `KASA-${Math.floor(100 + Math.random() * 900)}`,
        name: productData.name || 'สินค้าใหม่',
        chemicalFormula: productData.chemicalFormula || '-',
        characters: productData.characters || 'Solid / ผง',
        container: productData.container || 'ถุง',
        unit: productData.unit || 'กิโลกรัม',
        size: productData.size || '25 กก.',
        brand: productData.brand || 'KASA Chemical',
        minThreshold: productData.minThreshold || 200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProducts(prev => [newProd, ...prev]);
      addAuditLog('PRODUCT_CREATE', `เพิ่มสินค้าใหม่ในระบบ ${newProd.name} (${newProd.code})`);
    }
  };

  const deleteProduct = (id: string) => {
    const prod = getProductById(id);
    if (prod) {
      setProducts(prev => prev.filter(p => p.id !== id));
      addAuditLog('PRODUCT_UPDATE', `ลบสินค้า ${prod.name} (${prod.code}) ออกจากระบบ`);
    }
  };

  // Warehouse & Zone CRUD
  const saveWarehouse = (whData: Partial<Warehouse>) => {
    if (whData.id) {
      setWarehouses(prev =>
        prev.map(w => (w.id === whData.id ? ({ ...w, ...whData } as Warehouse) : w))
      );
      addAuditLog('STOCK_ADJUST', `แก้ไขข้อมูลคลังสินค้า ${whData.name} (${whData.code})`);
    } else {
      const newWh: Warehouse = {
        id: `wh-${Date.now()}`,
        code: whData.code || `WH-0${warehouses.length + 1}`,
        name: whData.name || 'คลังสินค้าใหม่',
        location: whData.location || 'อาคารใหม่',
        zones: []
      };
      setWarehouses(prev => [...prev, newWh]);
      addAuditLog('STOCK_ADJUST', `สร้างคลังสินค้าใหม่ ${newWh.name} (${newWh.code})`);
    }
  };

  const deleteWarehouse = (id: string) => {
    const wh = warehouses.find(w => w.id === id);
    if (!wh) return { success: false, message: 'ไม่พบคลังสินค้า' };
    
    // Check if there is active stock in this warehouse
    const hasStock = inventory.some(
      inv => inv.warehouseId === id && (inv.quantityGood > 0 || inv.quantityDamaged > 0)
    );
    if (hasStock) {
      return { success: false, message: `ไม่สามารถลบคลัง "${wh.name}" ได้ เนื่องจากยังมีสินค้าคงเหลือในคลังนี้` };
    }

    setWarehouses(prev => prev.filter(w => w.id !== id));
    addAuditLog('STOCK_ADJUST', `ลบคลังสินค้า ${wh.name} (${wh.code})`);
    return { success: true, message: `ลบคลังสินค้า "${wh.name}" เรียบร้อยแล้ว` };
  };

  const saveZone = (warehouseId: string, zoneData: Partial<Zone>) => {
    const targetWh = warehouses.find(w => w.id === warehouseId);
    if (!targetWh) return;

    setWarehouses(prev =>
      prev.map(wh => {
        if (wh.id === warehouseId) {
          let updatedZones: Zone[];
          if (zoneData.id) {
            updatedZones = wh.zones.map(z => (z.id === zoneData.id ? ({ ...z, ...zoneData } as Zone) : z));
            addAuditLog('STOCK_ADJUST', `แก้ไขข้อมูลโซน ${zoneData.name} (${zoneData.code}) ในคลัง ${wh.name}`);
          } else {
            const newZone: Zone = {
              id: `z-${Date.now()}`,
              code: zoneData.code || `Z-${wh.zones.length + 1}`,
              name: zoneData.name || `โซน ${zoneData.code || 'ใหม่'}`,
              description: zoneData.description || ''
            };
            updatedZones = [...wh.zones, newZone];
            addAuditLog('STOCK_ADJUST', `เพิ่มโซนใหม่ ${newZone.name} ในคลัง ${wh.name}`);
          }
          return { ...wh, zones: updatedZones };
        }
        return wh;
      })
    );
  };

  const deleteZone = (warehouseId: string, zoneId: string) => {
    const targetWh = warehouses.find(w => w.id === warehouseId);
    if (!targetWh) return { success: false, message: 'ไม่พบคลังสินค้า' };

    const targetZone = targetWh.zones.find(z => z.id === zoneId);
    if (!targetZone) return { success: false, message: 'ไม่พบโซนจัดเก็บ' };

    // Check if there is active stock in this zone
    const hasStock = inventory.some(
      inv => inv.warehouseId === warehouseId && inv.zoneId === zoneId && (inv.quantityGood > 0 || inv.quantityDamaged > 0)
    );
    if (hasStock) {
      return { success: false, message: `ไม่สามารถลบโซน "${targetZone.name}" ได้ เนื่องจากยังมีสินค้าคงเหลือในโซนนี้` };
    }

    setWarehouses(prev =>
      prev.map(wh => {
        if (wh.id === warehouseId) {
          return { ...wh, zones: wh.zones.filter(z => z.id !== zoneId) };
        }
        return wh;
      })
    );
    addAuditLog('STOCK_ADJUST', `ลบโซน ${targetZone.name} ออกจากคลัง ${targetWh.name}`);
    return { success: true, message: `ลบโซน "${targetZone.name}" เรียบร้อยแล้ว` };
  };

  // User CRUD
  const saveUser = (userData: Partial<User>) => {
    if (userData.id) {
      setUsers(prev => prev.map(u => (u.id === userData.id ? ({ ...u, ...userData } as User) : u)));
      addAuditLog('USER_UPDATE', `แก้ไขข้อมูลพนักงาน ${userData.firstName} ${userData.lastName} (${userData.employeeCode})`);
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        employeeCode: userData.employeeCode || `EMP-${Math.floor(100 + Math.random() * 900)}`,
        firstName: userData.firstName || 'พนักงาน',
        lastName: userData.lastName || 'ใหม่',
        email: userData.email || 'user@kasa.co.th',
        phone: userData.phone || '02-994-7478',
        status: userData.status ?? 1,
        role: userData.role || 'Warehouse Officer',
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLog('USER_CREATE', `เพิ่มพนักงานใหม่ ${newUser.firstName} ${newUser.lastName} (${newUser.employeeCode})`);
    }
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const newStatus = u.status === 1 ? 0 : 1;
          addAuditLog('USER_UPDATE', `เปลี่ยนสถานะพนักงาน ${u.firstName} ${u.lastName} เป็น ${newStatus === 1 ? 'ใช้งาน (Active)' : 'ไม่ใช้งาน (Inactive)'}`);
          return { ...u, status: newStatus as 0 | 1 };
        }
        return u;
      })
    );
  };

  const updateLineConfig = (config: Partial<LineConfig>) => {
    setLineConfig(prev => ({ ...prev, ...config }));
    addAuditLog('LINE_CONFIG_UPDATE', 'อัปเดตการตั้งค่าการเชื่อมต่อ LINE OA และ Bot Notification');
  };

  const triggerLineTestBroadcast = (customMsg?: string) => {
    const msg = customMsg || '📢 [LINE Bot Notification Test] ระบบคลังสินค้า KASA ทดสอบการแจ้งเตือนเชื่อมต่อกลุ่ม LINE OA สำเร็จเรียบร้อย!';
    addNotification('INBOUND', 'ทดสอบส่งการแจ้งเตือน LINE Bot Group', msg);
    addAuditLog('LINE_CONFIG_UPDATE', 'ทดสอบการส่งสัญญาณ LINE Bot Notification ไปยังกลุ่ม');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        activeTab,
        setActiveTab,
        products,
        warehouses,
        inventory,
        inboundRecords,
        outboundRecords,
        users,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        logout,
        auditLogs,
        notifications,
        lineConfig,
        googleSheetsConfig,
        updateGoogleSheetsConfig,
        syncToGoogleSheets,
        fetchFromGoogleSheets,
        createAndPopulateGoogleSheetDirect,
        fetchDirectFromGoogleSheet,
        addInbound,
        addOutbound,
        adjustInventory,
        saveProduct,
        deleteProduct,
        saveWarehouse,
        deleteWarehouse,
        saveZone,
        deleteZone,
        saveUser,
        toggleUserStatus,
        updateLineConfig,
        triggerLineTestBroadcast,
        markNotificationRead,
        markAllNotificationsRead,
        getProductById,
        getWarehouseById,
        getLowStockProducts
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
