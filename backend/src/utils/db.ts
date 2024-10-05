/*
 Utils for querying the database.

*/

import { NFLSchedule } from "@ff-mern/ff-types";
import { db } from "../config/firebase-config.js";

export const getNflSchedule = async () => {
    const schedule = await db.collection("nflSchedule").get();
    const resp: NFLSchedule = {}
    schedule.forEach((doc) => {
        resp[doc.id] = doc.data()
    })
    return resp;
};

