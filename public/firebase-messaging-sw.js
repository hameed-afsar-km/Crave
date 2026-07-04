importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = {
  apiKey: 'AIzaSyDoNTX95yP6dSMJna4xqkz5l6cjYWPPZZw',
  authDomain: 'crave-538c0.firebaseapp.com',
  projectId: 'crave-538c0',
  storageBucket: 'crave-538c0.firebasestorage.app',
  messagingSenderId: '805252056943',
  appId: '1:805252056943:web:c357af95d17d4442394a9a',
};

firebase.initializeApp(config);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notificationTitle = data.title || payload.notification?.title || 'Crave';
  const notificationOptions = {
    body: data.body || payload.notification?.body || '',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/orders' },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
