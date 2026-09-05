/**
 * Client Service for communicating with Google Apps Script Web App
 */

export interface GoogleSheetsSyncData {
  products?: any[];
  inventory?: any[];
  inbound?: any[];
  outbound?: any[];
}

export async function testGoogleSheetsConnection(webAppUrl: string): Promise<{ success: boolean; message: string; title?: string }> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('กรุณาระบุ URL ของ Google Apps Script Web App');
  }

  const cleanUrl = webAppUrl.trim();
  const pingUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;

  try {
    const res = await fetch(pingUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.status === 'success') {
      return {
        success: true,
        message: json.message || 'เชื่อมต่อ Google Sheets สำเร็จ!',
        title: json.spreadsheetTitle
      };
    } else {
      throw new Error(json.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้');
    }
  } catch (err: any) {
    console.error('Google Sheets connection test error:', err);
    throw new Error(err.message || 'ไม่สามารถติดต่อ Google Apps Script URL นี้ได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง (Who has access: Anyone)');
  }
}

export async function fetchAllFromGoogleSheets(webAppUrl: string): Promise<any> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('ไม่พบ URL ของ Google Sheets Web App');
  }

  const cleanUrl = webAppUrl.trim();
  const getUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=getAll` : `${cleanUrl}?action=getAll`;

  const res = await fetch(getUrl, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`);
  }

  const json = await res.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Failed to fetch data from Google Sheets');
  }

  return json.data;
}

export async function syncAllToGoogleSheets(webAppUrl: string, data: GoogleSheetsSyncData): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('ไม่พบ URL ของ Google Sheets Web App');
  }

  const res = await fetch(webAppUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain prevents CORS preflight OPTIONS in Apps Script
    body: JSON.stringify({
      action: 'syncAll',
      data
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`);
  }

  const json = await res.json();
  return {
    success: json.status === 'success',
    message: json.message || 'ซิงค์ข้อมูลสำเร็จ'
  };
}

export async function postTransactionToGoogleSheets(
  webAppUrl: string, 
  action: 'inbound' | 'outbound', 
  transactionData: any
): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.trim()) return false;

  try {
    const res = await fetch(webAppUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action,
        data: transactionData
      })
    });
    return res.ok;
  } catch (err) {
    console.warn(`Failed to push ${action} to Google Sheets:`, err);
    return false;
  }
}
