// Import the Firebase scripts that are needed for messaging.
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
/*firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
});
*/

firebase.initializeApp({
    apiKey: "AIzaSyC7PBohRxQ1BlhklF7qJopWVJdjkBfbGHU",
    authDomain: "church-5a085.firebaseapp.com",
    databaseURL: "https://church-5a085-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "church-5a085",
    storageBucket: "church-5a085.firebasestorage.app",
    messagingSenderId: "545837111455",
    appId: "1:545837111455:web:2425c8513c80f5c91f6aaa",
    measurementId: "G-SZ309LYYHH"
  });
  
// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});