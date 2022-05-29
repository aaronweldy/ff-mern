import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT || "", "base64").toString("ascii"))),
});
export default admin;
export const db = admin.firestore();
export const auth = getAuth();
//# sourceMappingURL=firebase-config.js.map