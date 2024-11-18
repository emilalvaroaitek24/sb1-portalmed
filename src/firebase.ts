import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBRQOvzFXc1hpDe2DpyVyYhmkSUuDvdGnI",
  authDomain: "potent-bulwark-434423-t6.firebaseapp.com",
  databaseURL: "https://potent-bulwark-434423-t6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "potent-bulwark-434423-t6",
  storageBucket: "potent-bulwark-434423-t6.appspot.com",
  messagingSenderId: "882839078564",
  appId: "1:882839078564:web:8d455f8a18b6865f04c831",
  measurementId: "G-Q15XFHMGG9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);