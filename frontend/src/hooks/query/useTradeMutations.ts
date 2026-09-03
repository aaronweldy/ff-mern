import { Trade } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import { useMutation, useQueryClient } from "react-query";
import { apiDelete, apiPatch, apiPost } from "../../API/client";
import { auth } from "../../firebase-config";
import { queryKeys } from "./queryKeys";

export const useTradeMutations = (leagueId: string) => {
  const user = useAuthUser("user", auth);
  const queryClient = useQueryClient();
  const userId = user?.data?.uid;

  const invalidateTradeQueries = () => {
    queryClient.invalidateQueries(queryKeys.trades(userId));
    queryClient.invalidateQueries(queryKeys.teams(leagueId));
  };

  const proposeQuery = useMutation<void, Error, Trade>(
    async (trade) => {
      await apiPost<void>(`/api/v1/trade/propose/`, trade);
    },
    {
      onSuccess: () => {
        invalidateTradeQueries();
      },
    }
  );

  const cancelQuery = useMutation<void, Error, string>(
    async (tradeId) => {
      await apiDelete<void>(`/api/v1/trade/${tradeId}/`, { userId });
    },
    {
      onSuccess: () => {
        invalidateTradeQueries();
      },
    }
  );

  const rejectQuery = useMutation<void, Error, string>(
    async (tradeId) => {
      await apiPatch<void>(`/api/v1/trade/${tradeId}/reject/`, { userId });
    },
    {
      onSuccess: () => {
        invalidateTradeQueries();
      },
    }
  );

  const acceptQuery = useMutation<void, Error, string>(
    async (tradeId) => {
      await apiPatch<void>(`/api/v1/trade/${tradeId}/accept/`, { userId });
    },
    {
      onSuccess: () => {
        invalidateTradeQueries();
      },
    }
  );

  return { proposeQuery, cancelQuery, rejectQuery, acceptQuery };
};
