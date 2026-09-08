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

  try {
    const res = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: webAppUrl.trim(),
        method: 'GET',
        action: 'ping'
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `เซิร์ฟเวอร์ตอบกลับรหัสข้อผิดพลาด HTTP ${res.status}`);
    }

    const jsonResult = await res.json();
    if (jsonResult.success && jsonResult.data && jsonResult.data.status === 'success') {
      return {
        success: true,
        message: jsonResult.data.message || 'เชื่อมต่อ Google Sheets สำเร็จ!',
        title: jsonResult.data.spreadsheetTitle
      };
    } else {
      throw new Error((jsonResult.data && jsonResult.data.message) || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้');
    }
  } catch (err: any) {
    console.error('Google Sheets connection test error:', err);
    throw new Error(err.message || 'ไม่สามารถติดต่อ Google Apps Script ผ่านระบบ Proxy ได้');
  }
}

export async function fetchAllFromGoogleSheets(webAppUrl: string): Promise<any> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('ไม่พบ URL ของ Google Sheets Web App');
  }

  const res = await fetch('/api/sheets/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webAppUrl: webAppUrl.trim(),
      method: 'GET',
      action: 'getAll'
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP Error: ${res.status}`);
  }

  const jsonResult = await res.json();
  if (!jsonResult.success || !jsonResult.data || jsonResult.data.status !== 'success') {
    throw new Error((jsonResult.data && jsonResult.data.message) || 'Failed to fetch data from Google Sheets');
  }

  return jsonResult.data.data;
}

export async function syncAllToGoogleSheets(webAppUrl: string, data: GoogleSheetsSyncData): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl || !webAppUrl.trim()) {
    throw new Error('ไม่พบ URL ของ Google Sheets Web App');
  }

  const res = await fetch('/api/sheets/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webAppUrl: webAppUrl.trim(),
      method: 'POST',
      action: 'syncAll',
      data
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `HTTP Error: ${res.status}`);
  }

  const jsonResult = await res.json();
  return {
    success: jsonResult.success && jsonResult.data && jsonResult.data.status === 'success',
    message: (jsonResult.data && jsonResult.data.message) || 'ซิงค์ข้อมูลสำเร็จ'
  };
}

export async function postTransactionToGoogleSheets(
  webAppUrl: string, 
  action: 'inbound' | 'outbound', 
  transactionData: any
): Promise<boolean> {
  if (!webAppUrl || !webAppUrl.trim()) return false;

  try {
    const res = await fetch('/api/sheets/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: webAppUrl.trim(),
        method: 'POST',
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
