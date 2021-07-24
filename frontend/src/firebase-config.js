import firebase from "firebase/app";
import * as firebaseui from "firebaseui";
import "firebase/storage";
import "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXG6J4qNGuYc4P2RZM_wKAEdECO7_qaog",
  authDomain: "ff-mern.firebaseapp.com",
  projectId: "ff-mern",
  storageBucket: "ff-mern.appspot.com",
  messagingSenderId: "54859804653",
  appId: "1:54859804653:web:7ca0c44cce579e08da01e4",
  measurementId: "G-CKLBF5P572",
};

const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult(authResult) {
      console.log(authResult);
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      return true;
    },
    uiShown() {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById("loader").style.display = "none";
    },
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: "popup",
  signInSuccessUrl: "/",
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    {
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      fullLabel: "Email authentication",
    },
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
  ],
};

firebase.initializeApp(firebaseConfig);

export const storage = firebase.storage();
export const auth = firebase.auth();
export const ui = new firebaseui.auth.AuthUI(firebase.auth());
export { uiConfig };
export default firebase;
