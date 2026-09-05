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

// Active in-memory LINE Channel Access Token
let activeLineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

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
      return await res.json() as { displayName?: string; pictureUrl?: string; statusMessage?: string; userId?: string };
    }
    const errText = await res.text();
    console.warn(`[LINE Profile Fetch] Status ${res.status} for userId ${userId}:`, errText);
  } catch (err) {
    console.warn(`[LINE Profile Fetch] Error for userId ${userId}:`, err);
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
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
        let userStatusMessage = '';
        let groupName = '';
        let groupPictureUrl = '';

        // Try fetching user profile from LINE Messaging API if token and userId are available
        if (userId && activeLineChannelAccessToken) {
          const profile = await tryFetchLineProfile(userId, activeLineChannelAccessToken, groupId);
          if (profile) {
            userName = profile.displayName || '';
            userPictureUrl = profile.pictureUrl || '';
            userStatusMessage = profile.statusMessage || '';
          }
        }

        // Try fetching group summary if token and groupId are available
        if (groupId && activeLineChannelAccessToken) {
          const groupSummary = await tryFetchGroupSummary(groupId, activeLineChannelAccessToken);
          if (groupSummary) {
            groupName = groupSummary.groupName || '';
            groupPictureUrl = groupSummary.pictureUrl || '';
          }
        }

        switch (eventType) {
          case 'message': {
            messageType = event.message?.type || 'text';
            messageText = event.message?.text || (messageType === 'sticker' ? '[สติกเกอร์ LINE]' : `[ไฟล์แนบ/มัลติมีเดีย: ${messageType}]`);
            const senderLabel = userName ? `คุณ "${userName}"` : (userId ? `LINE User (${userId.slice(-6)})` : 'ผู้ใช้');
            
            if (sourceType === 'group') {
              details = `ได้รับข้อความ "${messageText}" จาก ${senderLabel} ในกลุ่ม (Group ID: ${groupId})`;
            } else if (sourceType === 'room') {
              details = `ได้รับข้อความ "${messageText}" จาก ${senderLabel} ในห้องสนทนา (Room ID: ${roomId})`;
            } else {
              details = `ได้รับข้อความ "${messageText}" จาก ${senderLabel} (แชตส่วนตัว)`;
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
            if (userName) {
              details = `👤 คุณ "${userName}" ได้กดติดตาม / เพิ่มเพื่อนกับ LINE Official Account เรียบร้อยแล้ว`;
            } else {
              details = `👤 ผู้ใช้กดติดตาม / เพิ่มเพื่อนกับ LINE Official Account (User ID: ${userId})`;
            }
            status = 'SUCCESS';
            break;
          }

          case 'unfollow': {
            const who = userName ? `คุณ "${userName}"` : `User ID: ${userId}`;
            details = `🚫 ผู้ใช้ (${who}) บล็อกหรือยกเลิกการติดตาม LINE Official Account`;
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
          userPictureUrl: userPictureUrl || undefined,
          statusMessage: userStatusMessage || undefined,
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
      const uId = `U${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`;
      const sampleFollowers = [
        {
          name: 'คุณพงศกร กิจเจริญ (ผู้จัดการฝ่ายจัดส่ง)',
          pic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          status: 'ฝ่ายประสานงานคลังสินค้า KASA'
        },
        {
          name: 'คุณณิชาภัทร วงศ์สวัสดิ์ (หัวหน้าคลัง)',
          pic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          status: 'ผู้จัดการคลังสินค้าเคมีภัณฑ์'
        },
        {
          name: 'คุณกิตติศักดิ์ พัฒนากุล (เจ้าหน้าที่ตรวจรับ)',
          pic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          status: 'ทีมขนส่งและโลจิสติกส์ KASA'
        }
      ];
      const picked = sampleFollowers[Math.floor(Math.random() * sampleFollowers.length)];

      syntheticEvent = {
        type: 'follow',
        timestamp: now,
        source: {
          type: 'user',
          userId: uId
        },
        _simulatedProfile: picked
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
      const prof = syntheticEvent._simulatedProfile;
      const displayName = customUserName || (prof ? prof.name : 'ผู้ใช้งานใหม่');
      detailMsg = `👤 คุณ "${displayName}" ได้กดติดตาม / เพิ่มเพื่อนกับ LINE Official Account เรียบร้อยแล้ว`;
    }

    const prof = syntheticEvent._simulatedProfile;
    const simPic = prof ? prof.pic : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
    const simName = customUserName || (prof ? prof.name : (uId ? `คุณสมคิด (ID: ${uId.slice(-6)})` : undefined));
    const simStatus = prof ? prof.status : 'เพิ่มเพื่อนใหม่';

    const createdLog: LineWebhookLog = {
      id: `sim-${now}`,
      timestamp: new Date(now).toISOString(),
      eventType: evType,
      sourceType: src.type,
      userId: uId,
      userName: simName,
      userPictureUrl: simPic,
      statusMessage: simStatus,
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

  // 6. POST /api/line/sync-config (Sync client LINE token to backend memory)
  app.post('/api/line/sync-config', (req, res) => {
    const { channelAccessToken } = req.body;
    if (channelAccessToken && typeof channelAccessToken === 'string') {
      activeLineChannelAccessToken = channelAccessToken.trim();
    }
    res.json({
      success: true,
      hasToken: Boolean(activeLineChannelAccessToken),
      message: 'ซิงค์ Access Token ไปยัง Backend สำเร็จ'
    });
  });

  // 7. POST /api/line/fetch-profile (Fetch or refresh profile for a specific User ID from LINE API)
  app.post('/api/line/fetch-profile', async (req, res) => {
    try {
      const { userId, channelAccessToken, groupId } = req.body;
      const token = (channelAccessToken && channelAccessToken.trim()) || activeLineChannelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุ User ID' });
      }

      if (token) {
        activeLineChannelAccessToken = token;
      }

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบ LINE Channel Access Token กรุณาระบุ Token ในแท็บ "ตั้งค่า Messaging API"'
        });
      }

      const profile = await tryFetchLineProfile(userId, token, groupId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: `ไม่สามารถดึงโปรไฟล์จาก LINE API ได้ (อาจเกิดจาก Token ไม่ถูกต้อง หรือผู้ใช้ไม่ได้เป็นเพื่อนกับบอท) User ID: ${userId}`
        });
      }

      // Update matching logs in memory
      let updatedCount = 0;
      for (const log of webhookLogs) {
        if (log.userId === userId) {
          if (profile.displayName) log.userName = profile.displayName;
          if (profile.pictureUrl) log.userPictureUrl = profile.pictureUrl;
          if (profile.statusMessage) log.statusMessage = profile.statusMessage;
          if (log.eventType === 'follow' && profile.displayName) {
            log.details = `👤 คุณ "${profile.displayName}" ได้กดติดตาม / เพิ่มเพื่อนกับ LINE Official Account เรียบร้อยแล้ว`;
          } else if (log.eventType === 'message' && profile.displayName && log.messageText) {
            log.details = `ได้รับข้อความ "${log.messageText}" จากคุณ "${profile.displayName}"`;
          }
          updatedCount++;
        }
      }

      res.json({
        success: true,
        profile,
        updatedCount,
        message: `ดึงข้อมูลโปรไฟล์ของ "${profile.displayName || userId}" สำเร็จ (${updatedCount} รายการอัปเดต)`
      });
    } catch (err: any) {
      console.error('Error fetching LINE profile:', err);
      res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
    }
  });

  // 8. POST /api/line/update-log-user (Manually set custom name/picture for a user in logs)
  app.post('/api/line/update-log-user', (req, res) => {
    const { userId, userName, userPictureUrl, statusMessage } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    let updatedCount = 0;
    for (const log of webhookLogs) {
      if (log.userId === userId) {
        if (userName) log.userName = userName;
        if (userPictureUrl !== undefined) log.userPictureUrl = userPictureUrl;
        if (statusMessage !== undefined) log.statusMessage = statusMessage;
        if (log.eventType === 'follow' && userName) {
          log.details = `👤 คุณ "${userName}" ได้กดติดตาม / เพิ่มเพื่อนกับ LINE Official Account เรียบร้อยแล้ว`;
        }
        updatedCount++;
      }
    }

    res.json({
      success: true,
      updatedCount,
      message: `อัปเดตข้อมูลผู้ใช้สำหรับ User ID ${userId} สำเร็จ (${updatedCount} รายการ)`
    });
  });

  // 9. GET /api/line/cron-ping (For cron-job.org or UptimeRobot to keep Render awake 100% free)
  app.get('/api/line/cron-ping', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      time: new Date().toISOString(),
      service: 'KASA WMS Server',
      message: 'Render Free Tier kept awake successfully. Zero cold start.'
    });
  });

  // 7. POST /api/line/notify (Send Push Message to LINE Group or User)
  app.post('/api/line/notify', async (req, res) => {
    try {
      const {
        channelAccessToken,
        targetId,
        type = 'test',
        title,
        details,
        data = {}
      } = req.body;

      const now = new Date();
      const timeStr = `${now.toLocaleDateString('th-TH')} ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`;

      // Define themes based on notification type
      let headerColor = '#7c3aed'; // Purple
      let headerTitle = title || '🔔 แจ้งเตือนจากระบบ KASA WMS';
      let badgeText = 'แจ้งเตือน';

      if (type === 'inbound') {
        headerColor = '#16a34a'; // Green
        headerTitle = title || '📦 รับเข้าสินค้าสำเร็จ (INBOUND)';
        badgeText = 'รับเข้าคลัง';
      } else if (type === 'outbound') {
        headerColor = '#0284c7'; // Sky Blue
        headerTitle = title || '🚚 เบิกจ่ายสินค้าสำเร็จ (OUTBOUND)';
        badgeText = 'ส่งมอบ/เบิกจ่าย';
      } else if (type === 'low_stock') {
        headerColor = '#dc2626'; // Red
        headerTitle = title || '⚠️ สินค้าใกล้หมดสต๊อก (LOW STOCK)';
        badgeText = 'เตือนสต๊อกต่ำ';
      }

      // Build item rows for Flex message
      const itemsList = Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : (data.productName ? [{
            productName: data.productName,
            productCode: data.productCode || '-',
            quantity: data.quantity || 1,
            unit: data.unit || 'หน่วย',
            zoneName: data.zoneName || '-',
            condition: data.condition || 'GOOD'
          }] : []);

      const itemComponents = itemsList.slice(0, 8).map((item: any, idx: number) => ({
        type: 'box',
        layout: 'vertical',
        margin: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `${idx + 1}. ${item.productName}`,
                weight: 'bold',
                size: 'sm',
                color: '#1e293b',
                flex: 4,
                wrap: true
              },
              {
                type: 'text',
                text: `${Number(item.quantity).toLocaleString()} ${item.unit}`,
                weight: 'bold',
                size: 'sm',
                color: headerColor,
                align: 'end',
                flex: 2
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `รหัส: ${item.productCode} | โซน: ${item.zoneName || '-'}`,
                size: 'xs',
                color: '#64748b',
                flex: 4
              },
              {
                type: 'text',
                text: item.condition === 'DAMAGED' ? '❌ ชำรุด' : '✅ ปกติ',
                size: 'xs',
                color: item.condition === 'DAMAGED' ? '#ef4444' : '#10b981',
                align: 'end',
                flex: 2
              }
            ]
          }
        ]
      }));

      // Flex Message payload
      const flexMessage = {
        type: 'flex',
        altText: `[KASA WMS] ${headerTitle}: ${data.transactionCode || ''}`,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: headerColor,
            paddingAll: '16px',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: headerTitle,
                    weight: 'bold',
                    color: '#ffffff',
                    size: 'md',
                    flex: 4,
                    wrap: true
                  },
                  {
                    type: 'text',
                    text: badgeText,
                    color: '#ffffff',
                    size: 'xxs',
                    align: 'end',
                    flex: 2
                  }
                ]
              },
              data.transactionCode ? {
                type: 'text',
                text: `เลขที่เอกสาร: ${data.transactionCode}`,
                color: '#ffffffcc',
                size: 'xs',
                margin: 'xs'
              } : { type: 'filler' }
            ]
          },
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '16px',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                spacing: 'xs',
                contents: [
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: '🕒 วันเวลา:', size: 'xs', color: '#64748b', flex: 2 },
                      { type: 'text', text: timeStr, size: 'xs', color: '#1e293b', flex: 4, weight: 'bold' }
                    ]
                  },
                  data.operatorName ? {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: '👤 ผู้ทำรายการ:', size: 'xs', color: '#64748b', flex: 2 },
                      { type: 'text', text: data.operatorName, size: 'xs', color: '#1e293b', flex: 4 }
                    ]
                  } : { type: 'filler' },
                  data.partnerName ? {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: type === 'inbound' ? '🏢 แหล่งที่มา/คู่ค้า:' : '🚚 ปลายทาง/ลูกค้า:', size: 'xs', color: '#64748b', flex: 2 },
                      { type: 'text', text: data.partnerName, size: 'xs', color: '#1e293b', flex: 4 }
                    ]
                  } : { type: 'filler' }
                ]
              },
              { type: 'separator', margin: 'md' },
              {
                type: 'text',
                text: '📋 รายการสินค้า:',
                weight: 'bold',
                size: 'xs',
                color: '#334155',
                margin: 'md'
              },
              ...itemComponents,
              data.note ? {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                backgroundColor: '#f8fafc',
                paddingAll: '8px',
                cornerRadius: '6px',
                contents: [
                  { type: 'text', text: `📝 หมายเหตุ: ${data.note}`, size: 'xs', color: '#475569', wrap: true }
                ]
              } : { type: 'filler' }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            paddingAll: '12px',
            backgroundColor: '#f1f5f9',
            contents: [
              {
                type: 'button',
                style: 'primary',
                height: 'sm',
                color: headerColor,
                action: {
                  type: 'uri',
                  label: '🔍 เปิดดูระบบคลังสินค้า (WMS)',
                  uri: 'https://kasa-wms.onrender.com'
                }
              }
            ]
          }
        }
      };

      const finalToken = channelAccessToken || activeLineChannelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (finalToken) activeLineChannelAccessToken = finalToken;
      const finalTarget = targetId || process.env.LINE_TARGET_ID;

      // If token and target are provided, send live LINE Push Message
      if (finalToken && finalTarget) {
        const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${finalToken}`
          },
          body: JSON.stringify({
            to: finalTarget,
            messages: [flexMessage]
          })
        });

        const lineData = await lineResponse.json().catch(() => ({}));

        if (!lineResponse.ok) {
          const errMsg = lineData.message || `LINE API responded with ${lineResponse.status}`;
          webhookLogs.unshift({
            id: `push-err-${Date.now()}`,
            timestamp: new Date().toISOString(),
            eventType: 'message',
            sourceType: 'system',
            groupId: finalTarget.startsWith('C') ? finalTarget : undefined,
            userId: finalTarget.startsWith('U') ? finalTarget : undefined,
            details: `❌ ส่งแจ้งเตือน LINE ล้มเหลว: ${errMsg}`,
            status: 'ERROR',
            rawPayload: lineData
          });
          if (webhookLogs.length > 500) webhookLogs.pop();

          return res.status(400).json({
            success: false,
            message: `LINE API Error: ${errMsg}`,
            error: lineData
          });
        }

        // Successfully sent
        webhookLogs.unshift({
          id: `push-ok-${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventType: 'message',
          sourceType: finalTarget.startsWith('C') ? 'group' : 'user',
          groupId: finalTarget.startsWith('C') ? finalTarget : undefined,
          userId: finalTarget.startsWith('U') ? finalTarget : undefined,
          details: `🚀 ส่งการแจ้งเตือน "${headerTitle}" ไปยัง LINE เรียบร้อยแล้ว (Target: ${finalTarget})`,
          status: 'SUCCESS',
          rawPayload: flexMessage
        });
        if (webhookLogs.length > 500) webhookLogs.pop();

        return res.json({
          success: true,
          message: 'ส่งการแจ้งเตือนเข้า LINE สำเร็จเรียบร้อย!',
          targetId: finalTarget
        });
      } else {
        // Log simulated push
        webhookLogs.unshift({
          id: `push-sim-${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventType: 'message',
          sourceType: 'system',
          details: `📱 [จำลองแจ้งเตือน] ${headerTitle} (ยังไม่ได้ใส่ Channel Access Token หรือ Target ID ในการตั้งค่า)`,
          status: 'INFO',
          rawPayload: flexMessage
        });
        if (webhookLogs.length > 500) webhookLogs.pop();

        return res.json({
          success: true,
          simulated: true,
          message: 'บันทึกการแจ้งเตือนในประวัติเรียบร้อย (หากต้องการส่งเข้าห้องแชต LINE จริง กรุณากรอก Channel Access Token และ Group ID ในหน้าตั้งค่า)',
          flexPreview: flexMessage
        });
      }
    } catch (err: any) {
      console.error('Push notification error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
      });
    }
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
