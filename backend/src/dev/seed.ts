/**
 * Dev seed for local emulator testing.
 *
 * Run with the Firebase emulators:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 \
 *   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
 *   GCLOUD_PROJECT=ff-mern \
 *   npx tsx src/dev/seed.ts
 * or: yarn seed:dev  (sets the env vars for you)
 *
 * Creates (idempotently):
 * - Auth user dev@orca.local / OrcaDev123!  (uid: dev-orca-1)
 * - Firestore users/dev-orca-1 doc
 */
import admin from "../config/firebase-config.js";

export const DEV_EMAIL = "dev@orca.local";
export const DEV_PASSWORD = "OrcaDev123!";
export const DEV_UID = "dev-orca-1";
export const DEV_DISPLAY_NAME = "Orca Dev";

async function ensureDevUser() {
  try {
    const existing = await admin.auth().getUserByEmail(DEV_EMAIL);
    console.log(`Dev user already exists: ${existing.uid} (${DEV_EMAIL})`);
    return existing;
  } catch {
    // Not found – create below.
  }
  try {
    const user = await admin.auth().createUser({
      uid: DEV_UID,
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
      displayName: DEV_DISPLAY_NAME,
      emailVerified: true,
    });
    console.log(`Created dev user: ${user.uid} (${DEV_EMAIL})`);
    return user;
  } catch (e: unknown) {
    // Race: someone created it between get and create.
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("already exists")) {
      const existing = await admin.auth().getUserByEmail(DEV_EMAIL);
      console.log(`Dev user already exists: ${existing.uid} (${DEV_EMAIL})`);
      return existing;
    }
    throw e;
  }
}

async function ensureUserDoc(uid: string) {
  const ref = admin.firestore().collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      email: DEV_EMAIL,
      displayName: DEV_DISPLAY_NAME,
      photoUrl: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Created users/${uid} doc`);
  } else {
    console.log(`users/${uid} doc already exists`);
  }
}

async function main() {
  const user = await ensureDevUser();
  await ensureUserDoc(user.uid);
  console.log("\nDev account ready:");
  console.log(`  email:    ${DEV_EMAIL}`);
  console.log(`  password: ${DEV_PASSWORD}`);
  console.log(`  uid:      ${user.uid}`);
  console.log("Sign in via the frontend (emulator mode) or Emulator UI http://localhost:4000");
}

const invokedDirectly =
  process.argv[1]?.endsWith("seed.ts") ||
  process.argv[1]?.endsWith("seed.js");
if (invokedDirectly) {
  main().catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
}
