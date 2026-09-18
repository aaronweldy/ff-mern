import { NextFunction, Request, Response } from "express";
import admin from "../config/firebase-config.js";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

/**
 * Allows the scheduled scorer to call the scoring endpoint without creating
 * a Firebase user session. The token must be configured on both services.
 * This check is only used by the scoring route; normal API auth remains
 * Firebase-token based.
 */
export const isScoringServiceRequest = (req: Request): boolean => {
  const expected = process.env.SCORING_SERVICE_TOKEN?.trim();
  const provided = req.headers["x-scoring-service-token"];
  return Boolean(
    expected &&
      typeof provided === "string" &&
      provided.length > 0 &&
      provided === expected
  );
};

/**
 * Verifies `Authorization: Bearer <idToken>` via firebase-admin
 * `auth.verifyIdToken()`. On success sets `req.user = { uid, email }`
 * and calls next(). On failure responds 401.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).send({ error: "Missing Authorization Bearer token" });
    return;
  }
  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    res.status(401).send({ error: "Missing Authorization Bearer token" });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (e) {
    console.log("requireAuth: verifyIdToken failed", e);
    res.status(401).send({ error: "Invalid or expired ID token" });
  }
};

export const requireAuthOrScoringService = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (isScoringServiceRequest(req)) {
    next();
    return;
  }
  void requireAuth(req, res, next);
};

/**
 * Optional variant: populates req.user when a valid token is present,
 * otherwise continues anonymously. Useful for public GET reads.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }
  const idToken = header.slice("Bearer ".length).trim();
  if (!idToken) {
    next();
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    console.log("optionalAuth: verifyIdToken failed", e);
  }
  next();
  void res;
};

/**
 * Returns true when uid is listed as a commissioner of the league.
 */
export const isLeagueCommissioner = async (
  leagueId: string,
  uid: string
): Promise<boolean> => {
  try {
    const leagueDoc = await admin
      .firestore()
      .collection("leagues")
      .doc(leagueId)
      .get();
    if (!leagueDoc.exists) return false;
    const commissioners = (leagueDoc.data() as { commissioners?: string[] })
      .commissioners;
    return Array.isArray(commissioners) && commissioners.includes(uid);
  } catch (e) {
    console.log("isLeagueCommissioner failed", e);
    return false;
  }
};
