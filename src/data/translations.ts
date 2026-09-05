export interface TranslationSchema {
  appName: string;
  subTitle: string;
  nav: {
    inventory: string;
    inbound: string;
    outbound: string;
    catalog: string;
    zones: string;
    users: string;
    auditLog: string;
    lineOa: string;
    reports: string;
    database: string;
  };
  header: {
    searchPlaceholder: string;
    notifications: string;
    markAllRead: string;
    activeUser: string;
    quickInbound: string;
    quickOutbound: string;
    lineStatus: string;
  };
  inventory: {
    title: string;
    desc: string;
    filterWH: string;
    filterZone: string;
    filterCondition: string;
    allWH: string;
    allZones: string;
    allConditions: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
    damagedOnly: string;
    code: string;
    name: string;
    warehouseZone: string;
    goodQty: string;
    newQty: string;
    oldQty: string;
    damagedQty: string;
    totalQty: string;
    unit: string;
    status: string;
    action: string;
    editStock: string;
    stockDetails: string;
    adjustModalTitle: string;
    reason: string;
    adjustBy: string;
  };
  inbound: {
    title: string;
    desc: string;
    btnNew: string;
    code: string;
    product: string;
    qty: string;
    receiver: string;
    recorder: string;
    dateTime: string;
    location: string;
    condition: string;
    supplier: string;
    details: string;
    modalTitle: string;
    selectProduct: string;
    damageNotePlaceholder: string;
    successMsg: string;
  };
  outbound: {
    title: string;
    desc: string;
    btnNew: string;
    code: string;
    product: string;
    qty: string;
    dispatcher: string;
    recorder: string;
    dateTime: string;
    location: string;
    destination: string;
    details: string;
    modalTitle: string;
    insufficientStock: string;
    successMsg: string;
  };
  catalog: {
    title: string;
    desc: string;
    btnNew: string;
    code: string;
    name: string;
    chemical: string;
    character: string;
    container: string;
    unit: string;
    size: string;
    brand: string;
    threshold: string;
    search: string;
    modalTitle: string;
  };
  users: {
    title: string;
    desc: string;
    btnNew: string;
    empCode: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    active: string;
    inactive: string;
    modalTitle: string;
  };
  auditLog: {
    title: string;
    desc: string;
    filterAction: string;
    filterUser: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    allActions: string;
  };
  line: {
    title: string;
    desc: string;
    channelId: string;
    channelSecret: string;
    accessToken: string;
    liffId: string;
    groupId: string;
    toggleBot: string;
    notifyLowStock: string;
    notifyInbound: string;
    notifyOutbound: string;
    notifyDamaged: string;
    testBtn: string;
    liffPreview: string;
    copyLiffUrl: string;
    webhookConnected: string;
  };
  reports: {
    title: string;
    desc: string;
    totalProducts: string;
    totalStockQty: string;
    lowStockAlerts: string;
    damagedItems: string;
    inboundThisMonth: string;
    outboundThisMonth: string;
    exportCsv: string;
    dateRange: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
    allTime: string;
    chartMovements: string;
    chartWhRatio: string;
    chartConditionRatio: string;
  };
  common: {
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    search: string;
    confirm: string;
    close: string;
    new: string;
    old: string;
    damaged: string;
    success: string;
    filter: string;
    reset: string;
    rowsPerPage: string;
  };
}

export const translations: Record<'th' | 'en', TranslationSchema> = {
  th: {
    appName: 'ระบบจัดการคลังสินค้า KASA',
    subTitle: 'KASA Limited Partnership Warehouse Management System',
    nav: {
      inventory: 'คลังสินค้า & สต๊อก',
      inbound: 'รับเข้าสินค้า',
      outbound: 'ส่งออกสินค้า',
      catalog: 'รายการสินค้า',
      zones: 'จัดการคลัง & โซน',
      users: 'จัดการพนักงาน (Users)',
      auditLog: 'Log การทำงาน',
      lineOa: 'LINE OA & Webhook Logs',
      reports: 'รายงาน & สถิติ',
      database: 'ฐานข้อมูล Google Sheets',
    },
    header: {
      searchPlaceholder: 'ค้นหารหัสสินค้า, ชื่อสินค้า, สูตรเคมี, คลัง...',
      notifications: 'การแจ้งเตือน',
      markAllRead: 'อ่านทั้งหมดแล้ว',
      activeUser: 'ผู้ใช้งานปัจจุบัน',
      quickInbound: '+ รับเข้าสินค้า',
      quickOutbound: '- ส่งออกสินค้า',
      lineStatus: 'LINE Bot เชื่อมต่อแล้ว',
    },
    inventory: {
      title: 'คลังสินค้าและตรวจสอบสต๊อก',
      desc: 'เช็คจำนวนสินค้าคงเหลือ แยกตามคลังสินค้า โซน สถานะของปกติ และสินค้าชำรุด',
      filterWH: 'เลือกคลังสินค้า',
      filterZone: 'เลือกโซน',
      filterCondition: 'สถานะสินค้า',
      allWH: 'ทุกคลังสินค้า',
      allZones: 'ทุกโซน',
      allConditions: 'ทุกสถานะ',
      inStock: 'มีในสต๊อก',
      lowStock: 'สินค้าใกล้หมด',
      outOfStock: 'สินค้าหมด',
      damagedOnly: 'ชำรุดเสียหาย',
      code: 'รหัสสินค้า',
      name: 'ชื่อสินค้า / สูตรเคมี',
      warehouseZone: 'คลังสินค้า / โซน',
      goodQty: 'ของปกติ',
      newQty: 'ของใหม่',
      oldQty: 'ของเก่า',
      damagedQty: 'ชำรุด',
      totalQty: 'รวมทั้งหมด',
      unit: 'หน่วย',
      status: 'สถานะสต๊อก',
      action: 'จัดการสต๊อก',
      editStock: 'ปรับปรุงสต๊อก',
      stockDetails: 'รายละเอียดสต๊อก',
      adjustModalTitle: 'ปรับปรุงจำนวนสต๊อกสินค้า',
      reason: 'เหตุผลในการปรับปรุง',
      adjustBy: 'ผู้ทำรายการปรับปรุง',
    },
    inbound: {
      title: 'บันทึกการรับสินค้าเข้าคลัง',
      desc: 'บันทึกรหัสสินค้า ผู้รับสินค้า ผู้ลงระบบ วันเวลา จำนวน และคลังโซนจัดเก็บ',
      btnNew: 'บันทึกรับเข้าสินค้าใหม่',
      code: 'รหัสรับเข้า',
      product: 'สินค้า',
      qty: 'จำนวนรับเข้า',
      receiver: 'ผู้รับสินค้า',
      recorder: 'ผู้บันทึกระบบ',
      dateTime: 'วัน-เวลา',
      location: 'คลัง / โซน',
      condition: 'สภาพสินค้า',
      supplier: 'ผู้จัดส่ง / แหล่งที่มา',
      details: 'รายละเอียดเพิ่มเติม',
      modalTitle: 'แบบฟอร์มบันทึกรับเข้าสินค้า',
      selectProduct: '--- เลือกรหัสหรือชื่อสินค้า ---',
      damageNotePlaceholder: 'ระบุรายละเอียดความเสียหาย/ชำรุด (ถ้ามี)',
      successMsg: 'บันทึกการรับเข้าสินค้าเรียบร้อยแล้ว!',
    },
    outbound: {
      title: 'บันทึกการส่งออกสินค้า',
      desc: 'บันทึกรายการสินค้าเบิกจ่าย ออกจากคลังสินค้าและโซน ระบุผู้ส่งและผู้บันทึก',
      btnNew: 'บันทึกส่งออกสินค้า',
      code: 'รหัสส่งออก',
      product: 'สินค้า',
      qty: 'จำนวนส่งออก',
      dispatcher: 'ผู้ส่งออกสินค้า',
      recorder: 'ผู้บันทึกระบบ',
      dateTime: 'วัน-เวลา',
      location: 'ตัดจากคลัง / โซน',
      destination: 'ปลายทาง / ลูกค้า',
      details: 'รายละเอียดการส่งออก',
      modalTitle: 'แบบฟอร์มบันทึกส่งออกสินค้า',
      insufficientStock: 'จำนวนสินค้าในสต๊อกของคลังนี้ไม่เพียงพอ!',
      successMsg: 'บันทึกส่งออกสินค้าเรียบร้อยแล้ว!',
    },
    catalog: {
      title: 'รายการสินค้าทั้งหมด',
      desc: 'จัดการรหัสสินค้า ชื่อเคมี ลักษณะวัสดุ ภาชนะบรรจุ หน่วยนับ และยี่ห้อ',
      btnNew: 'เพิ่มสินค้าใหม่',
      code: 'รหัสสินค้า (Item Code)',
      name: 'ชื่อสินค้า',
      chemical: 'ชื่อทางเคมี / สูตรเคมี',
      character: 'ลักษณะวัสดุ',
      container: 'ภาชนะบรรจุ',
      unit: 'หน่วยนับ',
      size: 'ขนาดบรรจุ',
      brand: 'ยี่ห้อสินค้า',
      threshold: 'จุดเตือนใกล้หมด',
      search: 'ค้นหาสินค้า...',
      modalTitle: 'จัดการข้อมูลสินค้า',
    },
    users: {
      title: 'จัดการพนักงานผู้ใช้งาน (Users)',
      desc: 'เพิ่มหรือแก้ไขรายชื่อพนักงาน รหัสพนักงาน อีเมล เบอร์โทรศัพท์ และสถานะการใช้งาน',
      btnNew: 'เพิ่มพนักงานใหม่',
      empCode: 'รหัสพนักงาน',
      name: 'ชื่อ-นามสกุล',
      email: 'อีเมล (E-Mail)',
      phone: 'เบอร์โทรศัพท์',
      role: 'ตำแหน่ง / สิทธิ์',
      status: 'สถานะการใช้งาน',
      active: '1 = ใช้งาน (Active)',
      inactive: '0 = ไม่ใช้งาน (Inactive)',
      modalTitle: 'ข้อมูลพนักงาน',
    },
    auditLog: {
      title: 'Log รายการทำงานของระบบทั้งหมด',
      desc: 'ตรวจสอบประวัติการบันทึก รับเข้า ส่งออก ปรับปรุงสต๊อก และการตั้งค่าระบบ',
      filterAction: 'ประเภทการทำงาน',
      filterUser: 'ผู้ทำรายการ',
      timestamp: 'วัน-เวลา',
      user: 'พนักงานผู้ทำรายการ',
      action: 'การกระทำ',
      details: 'รายละเอียดกิจกรรม',
      allActions: 'ทุกประเภทกิจกรรม',
    },
    line: {
      title: 'การเชื่อมต่อ LINE OA, LINE LIFF & Bot Notification',
      desc: 'ตั้งค่าระบบแจ้งเตือนเข้ากลุ่ม LINE Bot เมื่อมีสินค้าเข้า-ออก หรือของใกล้หมด และจำลองหน้า LINE LIFF บนมือถือ',
      channelId: 'Channel ID',
      channelSecret: 'Channel Secret',
      accessToken: 'Channel Access Token',
      liffId: 'LIFF ID',
      groupId: 'LINE Group Target ID',
      toggleBot: 'เปิดระบบ LINE Bot Notification',
      notifyLowStock: 'แจ้งเตือนเมื่อสินค้าใกล้หมด (Low Stock)',
      notifyInbound: 'แจ้งเตือนเมื่อรับสินค้าเข้า (Inbound)',
      notifyOutbound: 'แจ้งเตือนเมื่อส่งออกสินค้า (Outbound)',
      notifyDamaged: 'แจ้งเตือนเมื่อพบสินค้าชำรุด (Damaged)',
      testBtn: 'ทดสอบส่งข้อความแจ้งเตือน (Test Broadcast)',
      liffPreview: 'จำลองการแสดงผลบน LINE LIFF App (Mobile View)',
      copyLiffUrl: 'คัดลอก URL สำหรับ LIFF App',
      webhookConnected: 'สถานะ Webhook: เชื่อมต่อสำเร็จ',
    },
    reports: {
      title: 'รายงานและสถิติภาพรวมคลังสินค้า',
      desc: 'สรุปภาพรวมสินค้า สต๊อกคงเหลือ รายการรับเข้า-ส่งออก พร้อมตัวกรองค้นหาละเอียด',
      totalProducts: 'จำนวนรายการสินค้าทั้งหมด',
      totalStockQty: 'ปริมาณสต๊อกรวมทุกคลัง',
      lowStockAlerts: 'เตือนสินค้าใกล้หมด',
      damagedItems: 'สินค้าชำรุดเสียหาย',
      inboundThisMonth: 'รับเข้ารวม (เดือนนี้)',
      outboundThisMonth: 'ส่งออกรวม (เดือนนี้)',
      exportCsv: 'ดาวน์โหลดรายงาน CSV',
      dateRange: 'ช่วงเวลา',
      today: 'วันนี้',
      thisWeek: 'สัปดาห์นี้',
      thisMonth: 'เดือนนี้',
      allTime: 'ทั้งหมด',
      chartMovements: 'แนวโน้มการรับเข้า - ส่งออกสินค้า',
      chartWhRatio: 'สัดส่วนสต๊อกแยกตามคลังสินค้า',
      chartConditionRatio: 'สัดส่วนสภาพสินค้า (ปกติ / ชำรุด)',
    },
    common: {
      save: 'บันทึกข้อมูล',
      cancel: 'ยกเลิก',
      edit: 'แก้ไข',
      delete: 'ลบ',
      search: 'ค้นหา...',
      confirm: 'ยืนยัน',
      close: 'ปิด',
      new: 'ของใหม่',
      old: 'ของเก่า',
      damaged: 'ชำรุด',
      success: 'ดำเนินการสำเร็จ',
      filter: 'กรองข้อมูล',
      reset: 'รีเซ็ต',
      rowsPerPage: 'รายการต่อหน้า',
    }
  },
  en: {
    appName: 'KASA Warehouse WMS',
    subTitle: 'KASA Limited Partnership Warehouse Management System',
    nav: {
      inventory: 'Inventory & Stock',
      inbound: 'Inbound Receiving',
      outbound: 'Outbound Dispatch',
      catalog: 'Product Catalog',
      zones: 'Warehouses & Zones',
      users: 'User Management',
      auditLog: 'System Audit Logs',
      lineOa: 'LINE OA & Webhook Logs',
      reports: 'Reports & Analytics',
      database: 'Google Sheets Database',
    },
    header: {
      searchPlaceholder: 'Search product code, name, formula, location...',
      notifications: 'Notifications',
      markAllRead: 'Mark all as read',
      activeUser: 'Current Operator',
      quickInbound: '+ Receive Stock',
      quickOutbound: '- Dispatch Stock',
      lineStatus: 'LINE Bot Connected',
    },
    inventory: {
      title: 'Warehouse & Stock Verification',
      desc: 'Check stock levels by warehouse, zone, new/old condition, and damaged item breakdown',
      filterWH: 'Select Warehouse',
      filterZone: 'Select Zone',
      filterCondition: 'Item Condition',
      allWH: 'All Warehouses',
      allZones: 'All Zones',
      allConditions: 'All Conditions',
      inStock: 'In Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      damagedOnly: 'Damaged Items',
      code: 'Item Code',
      name: 'Product Name / Formula',
      warehouseZone: 'Warehouse / Zone',
      goodQty: 'Good Qty',
      newQty: 'New Stock',
      oldQty: 'Old Stock',
      damagedQty: 'Damaged Qty',
      totalQty: 'Total Qty',
      unit: 'Unit',
      status: 'Stock Status',
      action: 'Action',
      editStock: 'Adjust Stock',
      stockDetails: 'Stock Details',
      adjustModalTitle: 'Adjust Inventory Quantity',
      reason: 'Adjustment Reason',
      adjustBy: 'Adjusted By Operator',
    },
    inbound: {
      title: 'Inbound Stock Receiving Record',
      desc: 'Record product receipt, receiver name, recorder, timestamp, quantity, and assigned warehouse zone',
      btnNew: 'New Inbound Receipt',
      code: 'Inbound Ref',
      product: 'Product Item',
      qty: 'Inbound Qty',
      receiver: 'Receiver Name',
      recorder: 'Recorded By',
      dateTime: 'Date & Time',
      location: 'Target WH / Zone',
      condition: 'Item Condition',
      supplier: 'Supplier / Source',
      details: 'Additional Details',
      modalTitle: 'Inbound Stock Receiving Form',
      selectProduct: '--- Select Product Code / Name ---',
      damageNotePlaceholder: 'Describe damage or defect details if applicable',
      successMsg: 'Inbound receiving recorded successfully!',
    },
    outbound: {
      title: 'Outbound Stock Dispatch Record',
      desc: 'Record stock dispatch from specific warehouse & zone with dispatcher and recorder attribution',
      btnNew: 'New Outbound Dispatch',
      code: 'Outbound Ref',
      product: 'Product Item',
      qty: 'Dispatched Qty',
      dispatcher: 'Dispatcher Name',
      recorder: 'Recorded By',
      dateTime: 'Date & Time',
      location: 'Deducted WH / Zone',
      destination: 'Destination / Customer',
      details: 'Dispatch Notes',
      modalTitle: 'Outbound Stock Dispatch Form',
      insufficientStock: 'Insufficient inventory quantity in this warehouse zone!',
      successMsg: 'Outbound dispatch recorded successfully!',
    },
    catalog: {
      title: 'Master Product Catalog',
      desc: 'Manage item codes, chemical names, material characteristics, containers, units, and brands',
      btnNew: 'Add New Product',
      code: 'Product Code',
      name: 'Product Name',
      chemical: 'Chemical Name / Formula',
      character: 'Material Characteristics',
      container: 'Container Type',
      unit: 'Unit of Measure',
      size: 'Container Size',
      brand: 'Brand Name',
      threshold: 'Low Stock Alert Level',
      search: 'Search products...',
      modalTitle: 'Product Item Manager',
    },
    users: {
      title: 'Employee User Management',
      desc: 'Add or edit staff profiles, employee IDs, email, phone numbers, and active account status',
      btnNew: 'Add New Employee',
      empCode: 'Employee Code',
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      role: 'Role / Permission',
      status: 'Account Status',
      active: '1 = Active',
      inactive: '0 = Inactive',
      modalTitle: 'Employee User Profile',
    },
    auditLog: {
      title: 'System Activity Audit Logs',
      desc: 'Trace complete audit history for receiving, dispatch, stock adjustments, and system settings',
      filterAction: 'Action Type',
      filterUser: 'Operator Name',
      timestamp: 'Timestamp',
      user: 'Operator',
      action: 'Action',
      details: 'Activity Details',
      allActions: 'All Action Types',
    },
    line: {
      title: 'LINE OA, LIFF App & Bot Notification Settings',
      desc: 'Configure LINE Bot group alerts for inbound, outbound, damaged, and low stock events with simulated mobile LIFF view',
      channelId: 'Channel ID',
      channelSecret: 'Channel Secret',
      accessToken: 'Channel Access Token',
      liffId: 'LIFF ID',
      groupId: 'LINE Group Target ID',
      toggleBot: 'Enable LINE Bot Notifications',
      notifyLowStock: 'Alert on Low Stock',
      notifyInbound: 'Alert on Inbound Receipt',
      notifyOutbound: 'Alert on Outbound Dispatch',
      notifyDamaged: 'Alert on Damaged Stock',
      testBtn: 'Send Test Broadcast Alert',
      liffPreview: 'Simulated Mobile LINE LIFF Interface',
      copyLiffUrl: 'Copy LIFF App URL',
      webhookConnected: 'Webhook Status: Connected',
    },
    reports: {
      title: 'Warehouse Analytics & Summary Reports',
      desc: 'Comprehensive inventory stats, stock movement trends, and filtered export options',
      totalProducts: 'Total Catalog Products',
      totalStockQty: 'Total Stock Quantity',
      lowStockAlerts: 'Low Stock Warnings',
      damagedItems: 'Damaged Stock Count',
      inboundThisMonth: 'Total Inbound (This Month)',
      outboundThisMonth: 'Total Outbound (This Month)',
      exportCsv: 'Export CSV Report',
      dateRange: 'Time Period',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      allTime: 'All Time',
      chartMovements: 'Inbound vs Outbound Trend',
      chartWhRatio: 'Stock Distribution by Warehouse',
      chartConditionRatio: 'Good vs Damaged Stock Ratio',
    },
    common: {
      save: 'Save Changes',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search...',
      confirm: 'Confirm',
      close: 'Close',
      new: 'New Stock',
      old: 'Old Stock',
      damaged: 'Damaged',
      success: 'Operation Successful',
      filter: 'Filter',
      reset: 'Reset',
      rowsPerPage: 'Rows per page',
    }
  }
};
