import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin with a try-catch to handle missing credentials gracefully
try {
  if (process.env.SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(
          Buffer.from(process.env.SERVICE_ACCOUNT, "base64").toString("ascii")
        )
      ),
    });
  } else {
    // Initialize without credentials for development/testing
    console.warn("SERVICE_ACCOUNT not set - initializing without Firebase credentials");
    admin.initializeApp({
      projectId: "demo-project",
    });
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
  // Initialize with minimal config for development
  admin.initializeApp({
    projectId: "demo-project",
  });
}

export default admin;
export const db = admin.firestore();
export const auth = getAuth();
