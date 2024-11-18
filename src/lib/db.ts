import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { Scribe } from '@/types/scribe';

export async function saveScribe(scribe: Scribe) {
  try {
    const docRef = await addDoc(collection(db, 'scribes'), scribe);
    return docRef.id;
  } catch (error) {
    console.error('Error saving scribe:', error);
    throw error;
  }
}

export async function getScribes() {
  try {
    const q = query(collection(db, 'scribes'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Scribe[];
  } catch (error) {
    console.error('Error getting scribes:', error);
    throw error;
  }
}