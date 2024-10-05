/*
 Utils for querying the database.

*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { db } from "../config/firebase-config.js";
export const getNflSchedule = () => __awaiter(void 0, void 0, void 0, function* () {
    const schedule = yield db.collection("nflSchedule").get();
    const resp = {};
    schedule.forEach((doc) => {
        resp[doc.id] = doc.data();
    });
    return resp;
});
//# sourceMappingURL=db.js.map