import firebase from 'firebase/app'
import * as admin from 'firebase-admin'
import 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyCXG6J4qNGuYc4P2RZM_wKAEdECO7_qaog",
    authDomain: "ff-mern.firebaseapp.com",
    projectId: "ff-mern",
    storageBucket: "ff-mern.appspot.com",
    messagingSenderId: "54859804653",
    appId: "1:54859804653:web:7ca0c44cce579e08da01e4",
    measurementId: "G-CKLBF5P572"
};

admin.initializeApp();

export default admin;