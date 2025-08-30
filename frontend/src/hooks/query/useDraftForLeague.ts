import { DraftState } from "@ff-mern/ff-types";
import { useQuery } from "react-query";

type DraftResponse = {
  draft: DraftState | null;
};

const fetchDraftForLeague = async (id: string) => {
  const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/${id}/draft/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  const data = (await resp.json()) as DraftResponse;
  return data;
};

export const useDraftForLeague = (leagueId: string) => {
  return useQuery<DraftResponse, Error>(["draftForLeague", leagueId], () =>
    fetchDraftForLeague(leagueId)
  );
};
