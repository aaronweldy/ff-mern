import {
  FinalizedLineup,
  LineupSettings,
  QuicksetLineupType,
  Team,
  Week,
} from "@ff-mern/ff-types";
import { Router } from "express";
import admin, { db } from "../config/firebase-config.js";
import { getNflSchedule } from "../utils/db.js";
import { fetchPlayerProjections } from "../utils/fetchRoutes.js";
import { assertLineupUnlocked, TeamUpdateError } from "../utils/lineupLocks.js";
import { isLeagueCommissioner, requireAuth } from "../middleware/auth.js";
import { buildProjectedLineup } from "../utils/projectedLineup.js";
const router = Router();

// All lineup writes validate against the latest stored team in a transaction.
// Authorization to edit a team does not imply permission to bypass kickoff locks.
const saveTeams = async (
  uid: string,
  updates: { id: string; build: (previous: Team) => Team }[],
  requestOverride = false
): Promise<Team[]> => {
  const schedule = await getNflSchedule();
  return db.runTransaction(async (transaction) => {
    const saved: Team[] = [];
    for (const update of updates) {
      const doc = db.collection("teams").doc(update.id);
      const previous = (await transaction.get(doc)).data() as Team | undefined;
      if (!previous) throw new TeamUpdateError(404, "Team not found");
      const commissioner = await isLeagueCommissioner(previous.league, uid);
      if (previous.owner !== uid && !commissioner) {
        throw new TeamUpdateError(403, "Not authorized to update this team");
      }
      const next = update.build(previous);
      // Commissioner membership alone never unlocks the regular Team page.
      assertLineupUnlocked(
        previous,
        next,
        schedule,
        commissioner && requestOverride
      );
      saved.push({ ...next, lastUpdated: new Date().toLocaleString() });
    }
    // Firestore requires every read to precede every write. Validate the full
    // batch before queuing writes so a rejected team cannot partially save it.
    saved.forEach((team) =>
      transaction.set(db.collection("teams").doc(team.id), team)
    );
    return saved;
  });
};

const sendUpdateError = (res: import("express").Response, error: unknown) => {
  if (error instanceof TeamUpdateError) {
    res.status(error.status).send({ message: error.message });
  } else {
    console.error(error);
    res
      .status(500)
      .send({ message: "Unable to save the lineup. Please try again." });
  }
};

router.post("/validateTeams/", requireAuth, async (req, res) => {
  const { teams } = req.body as { teams: Team[] };
  try {
    const owners = await Promise.all(
      teams.map(async (team) => {
        try {
          return (await admin.auth().getUserByEmail(team.ownerName)).uid;
        } catch {
          return "default";
        }
      })
    );
    // Owner validation must not replace lineups with a stale client snapshot.
    const saved = await saveTeams(
      req.user!.uid,
      teams.map((team, index) => ({
        id: team.id,
        build: (previous) => ({ ...previous, owner: owners[index] }),
      }))
    );
    res.status(200).send({ teams: saved });
  } catch (error) {
    sendUpdateError(res, error);
  }
});

router.post("/updateTeams/", requireAuth, async (req, res) => {
  const { teams } = req.body as { teams: Team[] };
  try {
    const saved = await saveTeams(
      req.user!.uid,
      teams.map((team) => ({
        id: team.id,
        build: () => team,
      }))
    );
    res.status(200).send({ teams: saved });
  } catch (error) {
    sendUpdateError(res, error);
  }
});

router.put("/updateSingleTeam/", requireAuth, async (req, res) => {
  const { team, isAdmin } = req.body as { team: Team; isAdmin?: boolean };
  try {
    const [saved] = await saveTeams(
      req.user!.uid,
      [{ id: team.id, build: () => team }],
      isAdmin === true
    );
    res.status(200).send({ team: saved });
  } catch (error) {
    sendUpdateError(res, error);
  }
});

router.get("/:id/", async (req, res) => {
  const team = await db.collection("teams").doc(req.params.id).get();
  res.status(200).json({
    team: team.data(),
  });
});

router.post("/setLineupFromProjection/", requireAuth, async (req, res) => {
  const {
    team,
    week,
    type,
    lineupSettings,
    isAdmin,
  }: {
    team: Team;
    week: Week;
    type: QuicksetLineupType;
    lineupSettings?: LineupSettings;
    isAdmin?: boolean;
  } = req.body;
  const weekNum = Number(week);
  if (
    !Number.isInteger(weekNum) ||
    weekNum < 1 ||
    (type !== "LastWeek" && type !== "Projection") ||
    (type === "LastWeek" && weekNum === 1)
  ) {
    res.status(400).send({ message: "Invalid quick-set week or type." });
    return;
  }
  try {
    // Check authorization before fetching projections. Recheck it at commit.
    const stored = (await db.collection("teams").doc(team.id).get()).data() as
      | Team
      | undefined;
    if (!stored) throw new TeamUpdateError(404, "Team not found");
    if (
      stored.owner !== req.user!.uid &&
      !(await isLeagueCommissioner(stored.league, req.user!.uid))
    ) {
      throw new TeamUpdateError(403, "Not authorized to update this team");
    }
    let projections: Record<string, number>;
    if (type === "Projection") {
      try {
        projections = await fetchPlayerProjections(week);
      } catch (error) {
        console.error(`Projection fetch failed for week ${week}`, error);
        throw new TeamUpdateError(
          503,
          `Complete projections are unavailable for week ${week}. Your lineup has not been changed. Please try again later.`
        );
      }
    }
    const [saved] = await saveTeams(
      req.user!.uid,
      [
        {
          id: team.id,
          build: (previous) => {
            if (!previous.weekInfo[weekNum])
              throw new TeamUpdateError(400, "Invalid lineup week.");
            let lineup: FinalizedLineup;
            try {
              lineup =
                type === "LastWeek"
                  ? previous.weekInfo[weekNum - 1].finalizedLineup
                  : buildProjectedLineup(
                      previous.rosteredPlayers,
                      previous.weekInfo[weekNum].finalizedLineup,
                      projections,
                      lineupSettings
                    );
            } catch (error) {
              throw new TeamUpdateError(
                422,
                error instanceof Error
                  ? error.message
                  : "Unable to build the projected lineup."
              );
            }
            return {
              ...previous,
              weekInfo: previous.weekInfo.map((info, index) =>
                index === weekNum ? { ...info, finalizedLineup: lineup } : info
              ),
            };
          },
        },
      ],
      isAdmin === true
    );
    res.status(200).send({ team: saved });
  } catch (error) {
    sendUpdateError(res, error);
  }
});

export default router;
