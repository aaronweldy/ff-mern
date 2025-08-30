import { League } from "@ff-mern/ff-types";
import { getDownloadURL, ref } from "firebase/storage";
import { useState } from "react";
import { useMutation } from "react-query";
import { storage } from "../../firebase-config";

type SearchResultsResponse = Record<string, League>;
type JoinLeagueInfo = {
  id: string;
  userEmail: string;
};
type JoinLeagueResponse = {
  url: string;
};

const getSearchResults = async (leagueName: string) => {
  const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/find/${leagueName}/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as SearchResultsResponse;
};

const joinLeague = async ({ id, userEmail }: JoinLeagueInfo) => {
  const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/${id}/join/`;
  const body = {
    owner: userEmail,
  };
  const req = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
  const resp = await fetch(url, req);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as JoinLeagueResponse;
};

export const useLeagueSearchMutations = () => {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
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
              setUrlMap({ ...urlMap, [id]: imgUrl });
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
  >(joinLeague);
  return { findLeagueQuery, joinLeagueQuery, urlMap };
};
