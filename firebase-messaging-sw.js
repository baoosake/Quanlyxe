// firebase-messaging-sw.js
// QUAN TRỌNG: File này PHẢI được đặt ở thư mục GỐC của website
// (cùng cấp với file index.html / trang chính), KHÔNG được đặt trong thư mục con.
// Ví dụ đúng:   https://yourdomain.com/firebase-messaging-sw.js
// Ví dụ SAI:    https://yourdomain.com/js/firebase-messaging-sw.js
//
// Đây chính là lý do phổ biến nhất khiến "bật thông báo" báo lỗi hoặc
// không hoạt động trên điện thoại: thiếu file này, hoặc đặt sai vị trí.

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Cấu hình Firebase — PHẢI TRÙNG với cấu hình firebaseConfig trong file HTML chính
firebase.initializeApp({
    apiKey: "AIzaSyAA_D5hcU01_JfaAVx3T-WPRKG8IgVQ8-o",
    authDomain: "baoosake-d4486.firebaseapp.com",
    projectId: "baoosake-d4486",
    storageBucket: "baoosake-d4486.firebasestorage.app",
    messagingSenderId: "224648264266",
    appId: "1:224648264266:web:7d5654a2a74a6c1c2a84b3",
    measurementId: "G-6JMPC9VB42"
});

const messaging = firebase.messaging();

// Xử lý thông báo khi TAB ĐANG ĐÓNG hoặc MÀN HÌNH ĐÃ TẮT (chạy nền / background).
// Đây là phần giúp thông báo vẫn hiện lên khay thông báo (notification tray)
// của điện thoại/máy tính ngay cả khi không mở trình duyệt.
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Nhận thông báo nền:', payload);

    const title = (payload.notification && payload.notification.title) || 'Cảnh báo Nhà Xe';
    const options = {
        body: (payload.notification && payload.notification.body) || '',
        icon: '/icon-192.png',      // Tùy chọn: đổi thành icon thật của bạn nếu có
        badge: '/icon-192.png',     // Tùy chọn
        vibrate: [200, 100, 200],
        data: payload.data || {},
        tag: 'nha-xe-alert',        // Gộp các thông báo cùng loại lại, tránh spam nhiều thông báo chồng chéo
        renotify: true
    };

    self.registration.showNotification(title, options);
});

// Khi người dùng bấm vào thông báo, mở lại (hoặc focus) trang quản lý
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
