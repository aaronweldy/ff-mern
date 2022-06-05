import {
  CreateDraftRequest,
  DraftState,
  getNumPlayersFromLineupSettings,
  League,
  Team,
} from "@ff-mern/ff-types";
import { useMutation } from "react-query";
import { v4 } from "uuid";

export const useCreateDraft = (
  leagueId: string,
  teams: Team[],
  league?: League
) => {
  return useMutation<DraftState | undefined, Error>(async () => {
    if (league) {
      const url = process.env.REACT_APP_PUBLIC_URL + "/api/v1/draft/create/";
      const body: CreateDraftRequest = {
        leagueId,
        draftSettings: {
          draftId: v4(),
          type: "official",
          pickOrder: "snake",
          numRounds: getNumPlayersFromLineupSettings(league.lineupSettings) + 6,
          draftOrder: teams.map((team) => team.id),
        },
      };
      const options = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      };
      const data = await fetch(url, options);
      return (await data.json()) as DraftState;
    }
  });
};
