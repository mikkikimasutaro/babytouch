import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyDg2rXAuoqXeJTtAFfwj70uZ96Q_9kWslU",
    authDomain: "babytouch-63ad3.firebaseapp.com",
    projectId: "babytouch-63ad3",
    storageBucket: "babytouch-63ad3.firebasestorage.app",
    messagingSenderId: "517970121360",
    appId: "1:517970121360:web:7c95151df5fcaf3f397e15",
    measurementId: "G-5ERYS8XHGG"
};

const firebaseApp = initializeApp(firebaseConfig);

const functions = getFunctions(firebaseApp, 'asia-northeast1');

export const analyzeTouchHistory = httpsCallable(functions, 'analyzeTouchHistory');
