import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { initializeApp, cert } from 'npm:firebase-admin@12.0.0/app'
import { getMessaging } from 'npm:firebase-admin@12.0.0/messaging'

// 1. Khởi tạo Firebase Admin bằng Service Account (Cấu hình trong Supabase Secrets)
const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
if (Object.keys(serviceAccount).length > 0) {
    try { 
        initializeApp({ credential: cert(serviceAccount) }); 
    } catch (e) {
        console.error("Lỗi khởi tạo Firebase Admin:", e); // Ghi log lỗi để dễ gỡ rối
    }
}

// 2. Khởi tạo Supabase Client nội bộ
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const STALE_MS = 45000;
const STOP_SPEED_KMH = 5;

Deno.serve(async (req) => {
    const now = Date.now();

    // Lấy dữ liệu từ database
    const { data: locs } = await supabase.from('busLocations').select('*');
    const { data: settings } = await supabase.from('settings').select('*').eq('key', 'stopAlertMinutes').single();
    const { data: trackers } = await supabase.from('stopTracker').select('*');
    
    const stopAlertMinutes = settings && settings.value ? parseFloat(settings.value) : 2;
    const thresholdMs = stopAlertMinutes * 60 * 1000;
    const alertsToSend: any[] = [];
    
    for (const loc of (locs || [])) {
        const busId = loc.busId;
        const isFresh = now - loc.timestamp < STALE_MS;
        const speedKmH = (loc.speed || 0) * 3.6;
        let tracker = trackers?.find(t => t.busId === busId);

        // Xe mất tín hiệu hoặc đang chạy nhanh -> Xóa bộ đếm dừng
        if (!isFresh || speedKmH >= STOP_SPEED_KMH) {
            if (tracker) await supabase.from('stopTracker').delete().eq('busId', busId);
            continue;
        }

        // Xe đang dừng
        if (!tracker) {
            await supabase.from('stopTracker').insert([{ busId, since: loc.timestamp, alerted: false }]);
        } else if (!tracker.alerted) {
            const stoppedMs = now - tracker.since;
            if (stoppedMs >= thresholdMs) {
                await supabase.from('stopTracker').update({ alerted: true }).eq('busId', busId);
                const mins = Math.round(stoppedMs / 60000);
                const msg = `Xe đã dừng liên tục khoảng ${mins} phút. Vui lòng kiểm tra Camera!`;
                
                // Lấy giờ Việt Nam (UTC+7) trên môi trường Edge Function
                const vnTime = new Date(Date.now() + 7 * 60 * 60 * 1000);
                const timeString = vnTime.toLocaleTimeString('vi-VN', { timeZone: 'UTC' });
                
                // Ghi vào bảng fraudAlerts (Bỏ id để Supabase tự động tạo UUID/Identity, tránh trùng ID)
                const alertData = {
                    type: 'Dừng Lâu',
                    busId: busId,
                    msg: msg,
                    time: timeString
                };
                
                await supabase.from('fraudAlerts').insert([alertData]);
                alertsToSend.push(alertData);
            }
        }
    }

    // 3. Gửi Thông báo đẩy (Push Notification) tới Admin
    if (alertsToSend.length > 0) {
        const { data: tokens } = await supabase.from('adminTokens').select('token');
        if (tokens && tokens.length > 0) {
            const fcmTokens = tokens.map(t => t.token);
            for (const alert of alertsToSend) {
                const message = {
                    notification: {
                        title: '🚨 Cảnh báo xe dừng lâu',
                        body: `Xe ${alert.busId}: ${alert.msg}`
                    },
                    tokens: fcmTokens 
                };
                try {
                    await getMessaging().sendEachForMulticast(message);
                } catch(e) {
                    console.error('FCM Error:', e);
                }
            }
        }
    }

    return new Response(JSON.stringify({ success: true, alerts: alertsToSend.length }), { headers: { "Content-Type": "application/json" } });
});