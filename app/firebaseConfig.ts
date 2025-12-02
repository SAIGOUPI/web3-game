import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};


let app;
let db: any = null;

try {

    if (firebaseConfig.apiKey) {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
    } else {
        console.warn("Firebase Config missing! Check .env.local or Vercel Environment Variables.");
    }
} catch (error) {
    console.error("Firebase 初始化失败:", error);
}


export { db };