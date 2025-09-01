/*
 Utils for querying the database.

*/
import { db } from "../config/firebase-config.js";
export const getNflSchedule = async () => {
    const schedule = await db.collection("nflSchedule").get();
    const resp = {};
    schedule.forEach((doc) => {
        resp[doc.id] = doc.data();
    });
    return resp;
};
//# sourceMappingURL=db.js.map