import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, onDisconnect, set, remove, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyCNOPt1WfRf2I7STVuWY-AMwQ7dKJqB5h4',
  authDomain: 'cheatsheet-86a51.firebaseapp.com',
  databaseURL: 'https://cheatsheet-86a51-default-rtdb.firebaseio.com',
  projectId: 'cheatsheet-86a51',
  storageBucket: 'cheatsheet-86a51.firebasestorage.app',
  messagingSenderId: '784400130549',
  appId: '1:784400130549:web:6af93990d0bbf0fb65c0bc',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export function initPresence(onCount) {
  const userId = Math.random().toString(36).slice(2, 10);
  const userRef = ref(db, `online/${userId}`);
  const connectedRef = ref(db, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(userRef).remove();
      set(userRef, { at: serverTimestamp() });
    }
  });

  const onlineRef = ref(db, 'online');
  onValue(onlineRef, (snap) => {
    const count = snap.exists() ? Object.keys(snap.val()).length : 0;
    onCount(count);
  });
}
