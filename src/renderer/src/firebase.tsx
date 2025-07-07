import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/messaging";
import { offlineMode } from "./utils/app_constants";

const serverConfig = {
  apiKey: "AIzaSyAS1hhsQJI7L8unX74frLAVA7yjEBdv818",
  authDomain: "contributer-tool.firebaseapp.com",
  projectId: "contributer-tool",
  storageBucket: "contributer-tool.firebasestorage.app",
  messagingSenderId: "871761169415",
  appId: "1:871761169415:web:5f384b75601a1687a66ea2",
  measurementId: "G-2QBK4JPDP6"
};

// Initialize Firebase
firebase.initializeApp(serverConfig);
const firebaseAuth = firebase.auth();
const firebaseFirestore = firebase.firestore();
const firebaseStorage = firebase.storage();
const firebaseMessaging = firebase.messaging();

export { firebaseAuth, firebaseFirestore, firebaseStorage, firebaseMessaging };
