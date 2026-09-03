import { DraftState } from "@ff-mern/ff-types";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { queryKeys } from "./queryKeys";

type DraftResponse = {
  draft: DraftState | null;
};

const fetchDraftForLeague = (id: string) =>
  apiGet<DraftResponse>(`/api/v1/league/${id}/draft/`);

export const useDraftForLeague = (leagueId: string) => {
  return useQuery<DraftResponse, Error>(queryKeys.draftForLeague(leagueId), () =>
    fetchDraftForLeague(leagueId)
  );
};
