import { Trade } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import { useMutation, useQueryClient } from "react-query";
import { auth } from "../../firebase-config";

export const useTradeMutations = (leagueId: string) => {
  const user = useAuthUser("user", auth);
  const queryClient = useQueryClient();

  const proposeQuery = useMutation<void, Error, Trade>(async (trade) => {
    const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/trade/propose/`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(trade),
    });
    if (!resp.ok) {
      throw new Error(resp.statusText);
    }
  });

  const cancelQuery = useMutation<void, Error, string>(
    async (tradeId) => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/trade/${tradeId}/`;
      const resp = await fetch(url, {
        headers: { "content-type": "application/json" },
        method: "DELETE",
        body: JSON.stringify({ userId: user?.data?.uid }),
      });
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["trades", user?.data?.uid]);
      },
    }
  );

  const rejectQuery = useMutation<void, Error, string>(
    async (tradeId) => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/trade/${tradeId}/reject/`;
      const resp = await fetch(url, {
        headers: { "content-type": "application/json" },
        method: "PATCH",
        body: JSON.stringify({ userId: user?.data?.uid }),
      });
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["trades", user?.data?.uid]);
      },
    }
  );

  const acceptQuery = useMutation<void, Error, string>(
    async (tradeId) => {
      const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/trade/${tradeId}/accept/`;
      const resp = await fetch(url, {
        headers: { "content-type": "application/json" },
        method: "PATCH",
        body: JSON.stringify({ userId: user?.data?.uid }),
      });
      if (!resp.ok) {
        throw new Error(resp.statusText);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["trades", user?.data?.uid]);
        queryClient.invalidateQueries(["teams", leagueId]);
      },
    }
  );

  return { proposeQuery, cancelQuery, rejectQuery, acceptQuery };
};
