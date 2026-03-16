/*
  NattuFeed FCM Service Worker
  Evaluating this script on localhost requires a valid Firebase Config.
*/

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// IMPORTANT: Replace these with your actual Firebase config values from .env.local
// This file is static and cannot read process.env.
firebase.initializeApp({
  apiKey: "AIzaSyCJ2n2tgbjaXdN-5qnh_7vnkyrPmDrwzFE", // Add your API Key here
  authDomain: "nattufeed-d59c9.firebaseapp.com",
  projectId: "nattufeed-d59c9",
  storageBucket: "nattufeed-d59c9.firebasestorage.app",
  messagingSenderId: "1:947236927958:web:60a40dd95d283e89facc77", // This MUST match your project
  appId: "G-0VF8GNY987"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message:', payload);
  
  const notificationTitle = payload.notification?.title || 'NattuFeed Update';
  const notificationOptions = {
    body: payload.notification?.body || 'New neighborhood news!',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
