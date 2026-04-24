import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

console.log('Firebase config check:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'loaded' : 'MISSING',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'loaded' : 'MISSING',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'loaded' : 'MISSING',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? 'loaded' : 'MISSING',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'loaded' : 'MISSING',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'loaded' : 'MISSING',
})

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app
let db

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  console.log('Firebase initialized successfully')
} catch (e) {
  console.error('Firebase initialization failed:', e)
}

export { db }
