import { Trade } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import { useQuery } from "react-query";
import { apiGet } from "../../API/client";
import { auth } from "../../firebase-config";
import { queryKeys } from "./queryKeys";

type TradesForUserResponse = {
  trades: Trade[];
  userProposed: Record<string, boolean>;
};

const fetchUserTrades = (userId?: string) =>
  apiGet<TradesForUserResponse>(`/api/v1/user/${userId}/trades/`);

export const useTradesForUser = () => {
  const user = useAuthUser("user", auth);
  return useQuery<TradesForUserResponse, Error>(
    queryKeys.trades(user?.data?.uid),
    () => fetchUserTrades(user?.data?.uid),
    {
      enabled: !!user?.data?.uid,
    }
  );
};
