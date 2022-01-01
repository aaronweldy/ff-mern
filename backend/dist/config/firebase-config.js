import admin from "firebase-admin";
admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(Buffer.from(process.env.SERVICE_ACCOUNT || "", "base64").toString("ascii"))),
});
export default admin;
export const db = admin.firestore();
//# sourceMappingURL=firebase-config.js.map