import { League } from "@ff-mern/ff-types";
import { getDownloadURL, ref } from "firebase/storage";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { apiGet, apiPost } from "../../API/client";
import { storage } from "../../firebase-config";
import { queryKeys } from "./queryKeys";

type SearchResultsResponse = Record<string, League>;
type JoinLeagueInfo = {
  id: string;
  userEmail: string;
};
type JoinLeagueResponse = {
  url: string;
};

const getSearchResults = (leagueName: string) =>
  apiGet<SearchResultsResponse>(`/api/v1/league/find/${leagueName}/`);

const joinLeague = ({ id, userEmail }: JoinLeagueInfo) =>
  apiPost<JoinLeagueResponse>(`/api/v1/league/${id}/join/`, {
    owner: userEmail,
  });

export const useLeagueSearchMutations = () => {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const findLeagueQuery = useMutation<SearchResultsResponse, Error, string>(
    getSearchResults,
    {
      onSuccess: (data) => {
        Promise.all(
          Object.entries(data).map(async ([id, league]) => {
            if (league.logo !== import.meta.env.VITE_DEFAULT_LOGO) {
              const imgUrl = await getDownloadURL(
                ref(storage, `logos/${league.logo}`)
              );
              setUrlMap((prev) => ({ ...prev, [id]: imgUrl }));
            }
            return { id, league };
          })
        );
      },
    }
  );
  const joinLeagueQuery = useMutation<
    JoinLeagueResponse,
    Error,
    JoinLeagueInfo
  >(joinLeague, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(queryKeys.teams(variables.id));
      queryClient.invalidateQueries(queryKeys.league(variables.id));
    },
  });
  return { findLeagueQuery, joinLeagueQuery, urlMap };
};
