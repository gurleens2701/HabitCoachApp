//firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBttbKIKHEUfbX-rKBjj1D-zR-YJdVEpoY",
  authDomain: "habitcoach-63c9c.firebaseapp.com",
  projectId: "habitcoach-63c9c",
  storageBucket: "habitcoach-63c9c.firebasestorage.app",
  messagingSenderId: "910490685688",
  appId: "1:910490685688:web:16f61bbda0a108b160ab0d",
  measurementId: "G-K4FJJTN8MY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

if (__DEV__) {
  console.log('Firebase debug mode enabled');
}

export { db, auth };