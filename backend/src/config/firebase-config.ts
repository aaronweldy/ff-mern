import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import dotenv from "dotenv";

dotenv.config();

export const isFirebaseConfigured = Boolean(process.env.SERVICE_ACCOUNT);

if (isFirebaseConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(
          Buffer.from(process.env.SERVICE_ACCOUNT || "", "base64").toString("utf8")
        )
      ),
    });
  } catch (e) {
    console.error(
      "Failed to initialize Firebase Admin SDK from SERVICE_ACCOUNT. Booting without credentials; Firestore routes will fail until it is fixed.",
      e
    );
  }
} else {
  console.warn(
    "SERVICE_ACCOUNT env var is missing. Booting without Firebase credentials; GET / healthcheck works but Firestore routes will fail."
  );
  try {
    admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || "ff-mern" });
  } catch {
    // Already initialized (e.g. tests) – ignore.
  }
}

export default admin;
export const db = admin.firestore();
export const auth = getAuth();
