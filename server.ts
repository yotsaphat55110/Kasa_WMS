import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface LineWebhookLog {
  id: string;
  timestamp: string;
  eventType: 'message' | 'join' | 'leave' | 'memberJoined' | 'memberLeft' | 'follow' | 'unfollow' | 'postback' | 'verify' | 'unknown';
  sourceType: 'user' | 'group' | 'room' | 'system';
  userId?: string;
  userName?: string;
  userPictureUrl?: string;
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

// In-memory logs storage with initial demo entries
const webhookLogs: LineWebhookLog[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    eventType: 'join',
    sourceType: 'group',
    groupId: 'C12a34b56c78d90e1f23456789abcdef0',
    groupName: 'กลุ่มทีมจัดส่ง & คลังสินค้า KASA',
    groupPictureUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=150',
    details: 'บอทถูกเชิญเข้าร่วมกลุ่มสำเร็จ: "กลุ่มทีมจัดส่ง & คลังสินค้า KASA" (Group ID: C12a34b56c78d90e1f23456789abcdef0)',
    status: 'SUCCESS',
    rawPayload: {
      type: 'join',
      source: {
        type: 'group',
        groupId: 'C12a34b56c78d90e1f23456789abcdef0'
      }
    }
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    eventType: 'message',
    sourceType: 'group',
    userId: 'U9876543210fedcba0123456789abcdef',
    userName: 'สมชาย ใจดี (หัวหน้าคลัง)',
    userPictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    groupId: 'C12a34b56c78d90e1f23456789abcdef0',
    groupName: 'กลุ่มทีมจัดส่ง & คลังสินค้า KASA',
    messageType: 'text',
    messageText: 'เช็คสต๊อกสารเคมี โซน A1 ให้หน่อยครับ',
    details: 'ได้รับข้อความ "เช็คสต๊อกสารเคมี โซน A1 ให้หน่อยครับ" จาก สมชาย ใจดี ในกลุ่ม "กลุ่มทีมจัดส่ง & คลังสินค้า KASA"',
    status: 'INFO',
    rawPayload: {
      type: 'message',
      source: {
        type: 'group',
        groupId: 'C12a34b56c78d90e1f23456789abcdef0',
        userId: 'U9876543210fedcba0123456789abcdef'
      },
      message: {
        id: 'msg-1001',
        type: 'text',
        text: 'เช็คสต๊อกสารเคมี โซน A1 ให้หน่อยครับ'
      }
    }
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    eventType: 'verify',
    sourceType: 'system',
    details: 'Webhook Endpoint พร้อมใช้งาน - ระบบพร้อมรองรับทุก Event จาก LINE OA Developers',
    status: 'SUCCESS',
    rawPayload: {
      status: 'ready',
      endpoint: '/api/line/webhook'
    }
  }
];

// Helper to fetch user profile from LINE API if token is provided
async function tryFetchLineProfile(userId: string, token?: string, groupId?: string) {
  if (!token || !userId) return null;
  try {
    const url = groupId 
      ? `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`
      : `https://api.line.me/v2/bot/profile/${userId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json() as { displayName?: string; pictureUrl?: string };
    }
  } catch {
    // Ignore fetch errors
  }
  return null;
}

// Helper to fetch group summary from LINE API if token is provided
async function tryFetchGroupSummary(groupId: string, token?: string) {
  if (!token || !groupId) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json() as { groupName?: string; pictureUrl?: string };
    }
  } catch {
    // Ignore fetch errors
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for development/preview
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-line-signature');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() });
  });

  // 1. GET /api/line/webhook (Verification status for browser tests)
  app.get('/api/line/webhook', (req, res) => {
    res.json({
      status: 'online',
      message: 'LINE Webhook Endpoint is ready and listening for HTTP POST requests from LINE Developers',
      endpoint: '/api/line/webhook',
      supportedEvents: ['message', 'join', 'leave', 'memberJoined', 'memberLeft', 'follow', 'unfollow', 'postback', 'verify'],
      totalLogsCaptured: webhookLogs.length
    });
  });

  // 2. POST /api/line/webhook (Main LINE Webhook Handler)
  app.post('/api/line/webhook', async (req, res) => {
    try {
      const body = req.body || {};
      const events = Array.isArray(body.events) ? body.events : [];
      const destination = body.destination;
      const signature = req.headers['x-line-signature'];

      // Case A: LINE Console "Verify" button test (events is empty array)
      if (events.length === 0) {
        const verifyLog: LineWebhookLog = {
          id: `verify-${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventType: 'verify',
          sourceType: 'system',
          details: 'LINE Webhook URL Verification สำเร็จ - ได้รับการตรวจสอบการเชื่อมต่อ (Ping) จาก LINE Developers Console เรียบร้อย 200 OK',
          status: 'SUCCESS',
          rawPayload: {
            destination,
            signature: signature || 'none',
            headers: req.headers,
            body
          }
        };
        webhookLogs.unshift(verifyLog);
        if (webhookLogs.length > 500) webhookLogs.pop();
        return res.status(200).send('OK');
      }

      // Case B: Process each event in the webhook payload
      for (const event of events) {
        const eventType = event.type || 'unknown';
        const source = event.source || {};
        const sourceType = source.type || 'unknown';
        const userId = source.userId;
        const groupId = source.groupId;
        const roomId = source.roomId;
        const replyToken = event.replyToken;

        let details = '';
        let messageType = '';
        let messageText = '';
        let status: LineWebhookLog['status'] = 'INFO';
        let userName = '';
        let userPictureUrl = '';
        let groupName = '';
        let groupPictureUrl = '';

        switch (eventType) {
          case 'message': {
            messageType = event.message?.type || 'text';
            messageText = event.message?.text || (messageType === 'sticker' ? '[สติกเกอร์ LINE]' : `[ไฟล์แนบ/มัลติมีเดีย: ${messageType}]`);
            
            if (sourceType === 'group') {
              details = `ได้รับข้อความ "${messageText}" จากผู้ใช้ (User ID: ${userId || 'ไม่ระบุ'}) ในกลุ่ม (Group ID: ${groupId})`;
            } else if (sourceType === 'room') {
              details = `ได้รับข้อความ "${messageText}" จากผู้ใช้ (User ID: ${userId || 'ไม่ระบุ'}) ในห้องสนทนา (Room ID: ${roomId})`;
            } else {
              details = `ได้รับข้อความ "${messageText}" จากผู้ใช้ส่วนตัว (User ID: ${userId})`;
            }
            status = 'INFO';
            break;
          }

          case 'join': {
            const targetGroupId = groupId || roomId || 'ไม่ระบุ';
            details = `🎉 บอทถูกเชิญเข้าร่วมกลุ่มเรียบร้อยแล้ว! (Group ID: ${targetGroupId}) - คุณสามารถคัดลอก Group ID นี้ไปใส่ในระบบแจ้งเตือนได้ทันที`;
            status = 'SUCCESS';
            break;
          }

          case 'leave': {
            details = `⚠️ บอทถูกลบหรือออกจากกลุ่ม (Group ID: ${groupId || roomId || 'ไม่ระบุ'})`;
            status = 'WARNING';
            break;
          }

          case 'memberJoined': {
            const memberCount = event.joined?.members?.length || 1;
            details = `มีสมาชิกใหม่ ${memberCount} คน เข้าร่วมกลุ่ม (Group ID: ${groupId})`;
            status = 'INFO';
            break;
          }

          case 'memberLeft': {
            const leftCount = event.left?.members?.length || 1;
            details = `มีสมาชิก ${leftCount} คน ออกจากกลุ่ม (Group ID: ${groupId})`;
            status = 'INFO';
            break;
          }

          case 'follow': {
            details = `👤 ผู้ใช้กดติดตาม / เพิ่มเพื่อนกับ LINE Official Account (User ID: ${userId})`;
            status = 'SUCCESS';
            break;
          }

          case 'unfollow': {
            details = `🚫 ผู้ใช้บล็อกหรือยกเลิกการติดตาม LINE Official Account (User ID: ${userId})`;
            status = 'WARNING';
            break;
          }

          case 'postback': {
            const postbackData = event.postback?.data || '';
            details = `กดปุ่มเลือกคำสั่ง (Postback Data: "${postbackData}") จาก User ID: ${userId}`;
            status = 'INFO';
            break;
          }

          default: {
            details = `ได้รับ Event ชนิด "${eventType}" จาก ${sourceType}`;
            status = 'INFO';
            break;
          }
        }

        const logEntry: LineWebhookLog = {
          id: `line-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          timestamp: new Date(event.timestamp || Date.now()).toISOString(),
          eventType: eventType as LineWebhookLog['eventType'],
          sourceType: sourceType as LineWebhookLog['sourceType'],
          userId,
          userName: userName || (userId ? `LINE User (${userId.slice(-6)})` : undefined),
          userPictureUrl,
          groupId: groupId || roomId,
          groupName: groupName || (groupId ? `กลุ่ม LINE (${groupId.slice(-6)})` : undefined),
          groupPictureUrl,
          roomId,
          messageType,
          messageText,
          replyToken,
          details,
          status,
          rawPayload: event
        };

        webhookLogs.unshift(logEntry);
        if (webhookLogs.length > 500) webhookLogs.pop();
      }

      // Always return HTTP 200 OK to LINE Webhook immediately
      return res.status(200).send('OK');
    } catch (err: any) {
      console.error('Webhook error:', err);
      // Even on parsing exception, return 200 to prevent LINE retrying indefinitely
      return res.status(200).send('OK');
    }
  });

  // 3. GET /api/line/logs (Fetch Webhook logs for frontend UI)
  app.get('/api/line/logs', (req, res) => {
    res.json({
      success: true,
      count: webhookLogs.length,
      logs: webhookLogs
    });
  });

  // 4. POST /api/line/logs/clear (Clear Webhook logs)
  app.post('/api/line/logs/clear', (req, res) => {
    webhookLogs.length = 0;
    res.json({ success: true, message: 'ล้างประวัติ Webhook Logs เรียบร้อยแล้ว' });
  });

  // 5. POST /api/line/simulate (Simulate events from UI for testing)
  app.post('/api/line/simulate', async (req, res) => {
    const { actionType, customText, customGroupId, customGroupName, customUserName } = req.body;

    let syntheticEvent: any = null;
    const now = Date.now();

    if (actionType === 'group_join') {
      const gId = customGroupId || `C${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      syntheticEvent = {
        type: 'join',
        timestamp: now,
        source: {
          type: 'group',
          groupId: gId
        },
        replyToken: `reply-${now}`
      };
    } else if (actionType === 'message') {
      const uId = `U${Math.random().toString(36).substring(2, 12)}`;
      const gId = customGroupId || (req.body.isGroup ? 'C12a34b56c78d90e1f23456789abcdef0' : undefined);
      syntheticEvent = {
        type: 'message',
        timestamp: now,
        source: {
          type: gId ? 'group' : 'user',
          userId: uId,
          groupId: gId
        },
        message: {
          id: `msg-${now}`,
          type: 'text',
          text: customText || 'สวัสดีครับ สอบถามสินค้าคงเหลือในคลังครับ'
        },
        replyToken: `reply-${now}`
      };
    } else if (actionType === 'follow') {
      const uId = `U${Math.random().toString(36).substring(2, 12)}`;
      syntheticEvent = {
        type: 'follow',
        timestamp: now,
        source: {
          type: 'user',
          userId: uId
        }
      };
    } else {
      // Default verify test
      syntheticEvent = null;
    }

    if (!syntheticEvent) {
      const verifyLog: LineWebhookLog = {
        id: `verify-${now}`,
        timestamp: new Date().toISOString(),
        eventType: 'verify',
        sourceType: 'system',
        details: 'ทดสอบจำลองส่ง Ping / Verify ไปยัง Webhook Endpoint สำเร็จ (HTTP 200 OK)',
        status: 'SUCCESS',
        rawPayload: { action: 'simulate_verify', time: new Date().toISOString() }
      };
      webhookLogs.unshift(verifyLog);
      return res.json({ success: true, log: verifyLog });
    }

    // Process synthetic event via the same handler logic
    const evType = syntheticEvent.type;
    const src = syntheticEvent.source || {};
    const uId = src.userId;
    const gId = src.groupId;
    let detailMsg = '';
    let msgType = '';
    let msgText = '';

    if (evType === 'join') {
      detailMsg = `🎉 บอทถูกเชิญเข้าร่วมกลุ่มสำเร็จ! ชื่อกลุ่ม: "${customGroupName || 'กลุ่มคลังสินค้า KASA'}" (Group ID: ${gId})`;
    } else if (evType === 'message') {
      msgType = 'text';
      msgText = syntheticEvent.message?.text;
      detailMsg = gId
        ? `ได้รับข้อความ "${msgText}" จาก ${customUserName || 'พนักงานคลัง'} (User ID: ${uId}) ในกลุ่ม "${customGroupName || 'กลุ่มคลังสินค้า KASA'}" (Group ID: ${gId})`
        : `ได้รับข้อความ "${msgText}" จาก ${customUserName || 'ลูกค้า'} (User ID: ${uId}) ผ่านแชตส่วนตัว`;
    } else if (evType === 'follow') {
      detailMsg = `👤 ${customUserName || 'ผู้ใช้งานใหม่'} เพิ่มเพื่อนกับ LINE Official Account (User ID: ${uId})`;
    }

    const createdLog: LineWebhookLog = {
      id: `sim-${now}`,
      timestamp: new Date(now).toISOString(),
      eventType: evType,
      sourceType: src.type,
      userId: uId,
      userName: customUserName || (uId ? `คุณสมคิด (ID: ${uId.slice(-6)})` : undefined),
      userPictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      groupId: gId,
      groupName: customGroupName || (gId ? 'กลุ่มคลังสินค้า KASA' : undefined),
      groupPictureUrl: gId ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=150' : undefined,
      messageType: msgType || undefined,
      messageText: msgText || undefined,
      replyToken: syntheticEvent.replyToken,
      details: detailMsg,
      status: 'SUCCESS',
      rawPayload: syntheticEvent
    };

    webhookLogs.unshift(createdLog);
    if (webhookLogs.length > 500) webhookLogs.pop();

    res.json({ success: true, log: createdLog });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
