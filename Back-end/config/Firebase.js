// back-end/config/Firebase.js
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getAnalytics, isSupported } = require("firebase/analytics");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXpokbYiDOyuZ9VP4xNit4q7FyxKKCsbA",
  authDomain: "startup-wings-e4ec7.firebaseapp.com",
  projectId: "startup-wings-e4ec7",
  storageBucket: "startup-wings-e4ec7.firebasestorage.app",
  messagingSenderId: "673808021267",
  appId: "1:673808021267:web:46f5fae1ec7c634f834ce6",
  measurementId: "G-HF26BBEBT6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Analytics (only in supported environments)
let analytics = null;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch(console.error);

// Export in CommonJS format
module.exports = { app, auth, analytics };
