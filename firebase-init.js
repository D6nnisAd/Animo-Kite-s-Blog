// IMPORTANT: Paste your Firebase config object here from the Firebase console.
// Go to Project Settings > General > Your apps > Firebase SDK snippet > Config

  const firebaseConfig = {
    apiKey: "AIzaSyDtCuUA4TF7s9IsDWYPk-gyYLBHD5OiJZY",
    authDomain: "animo-kite-blog.firebaseapp.com",
    projectId: "animo-kite-blog",
    storageBucket: "animo-kite-blog.firebasestorage.app",
    messagingSenderId: "154153643587",
    appId: "1:154153643587:web:1097f695ae200140852ef6"
  };

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
