// firebase-messaging-sw.js
// File này PHẢI được đặt CÙNG CẤP THƯ MỤC với file HTML chính khi host lên server
// (ví dụ: https://tenmien.com/firebase-messaging-sw.js), không được để trong thư mục con.
// Nó chạy nền để hiện thông báo đẩy ngay cả khi tab trình duyệt đã đóng.

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// ⚠️ Dán ĐÚNG firebaseConfig giống hệt trong file HTML chính (bắt buộc phải khớp)
firebase.initializeApp({
    apiKey: "AIzaSyAA_D5hcU01_JfaAVx3T-WPRKG8IgVQ8-o",
    authDomain: "baoosake-d4486.firebaseapp.com",
    databaseURL: "https://baoosake-d4486-default-rtdb.firebaseio.com",
    projectId: "baoosake-d4486",
    storageBucket: "baoosake-d4486.firebasestorage.app",
    messagingSenderId: "224648264266",
    appId: "1:224648264266:web:7d5654a2a74a6c1c2a84b3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Nhận thông báo nền:', payload);
    const title = (payload.notification && payload.notification.title) || 'Cảnh báo Nhà Xe';
    const options = {
        body: (payload.notification && payload.notification.body) || '',
        icon: 'https://cdn-icons-png.flaticon.com/512/3097/3097144.png'
    };
    self.registration.showNotification(title, options);
});
