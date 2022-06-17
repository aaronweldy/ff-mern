var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from "express";
import env from "dotenv";
import { db } from "../config/firebase-config.js";
import { getCurrentSeason } from "@ff-mern/ff-types";
const router = Router();
env.config();
router.get("/:id/leagues/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teams = [];
    const { id } = req.params;
    db.collection("teams")
        .where("owner", "==", id)
        .get()
        .then((snapshot) => __awaiter(void 0, void 0, void 0, function* () {
        snapshot.forEach((data) => {
            teams.push(data.data());
        });
        const resp = { teams, url: "" };
        const urlDoc = yield db.collection("users").doc(id).get();
        if (urlDoc.exists) {
            resp.url = urlDoc.data().url;
        }
        res.json(resp).send();
    }));
}));
router.get("/:id/trades/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = [];
    const userProposed = {};
    const { id } = req.params;
    const teamsForUser = yield db
        .collection("teams")
        .where("owner", "==", id)
        .get()
        .then((snapshot) => __awaiter(void 0, void 0, void 0, function* () {
        const teamIds = [];
        snapshot.forEach((data) => {
            teamIds.push(data.data().id);
        });
        return teamIds;
    }));
    for (const teamId of teamsForUser) {
        const trades = yield db
            .collection("trades")
            .where("teamsInvolved", "array-contains", teamId)
            .where("season", "==", getCurrentSeason())
            .orderBy("dateProposed", "desc")
            .get();
        trades.forEach((trade) => {
            const tradeData = trade.data();
            response.push(tradeData);
            if (tradeData.teamsInvolved[0] === teamId) {
                userProposed[tradeData.id] = true;
            }
        });
    }
    res.status(200).send({ trades: response, userProposed });
}));
router.post("/:id/updatePhoto", (req, res) => {
    const { id } = req.params;
    const { url } = req.body;
    db.collection("users")
        .doc(id)
        .set({ url })
        .then(() => res.status(200).send());
});
export default router;
//# sourceMappingURL=user.js.map