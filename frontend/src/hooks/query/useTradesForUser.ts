import { Trade } from "@ff-mern/ff-types";
import { useAuthUser } from "@react-query-firebase/auth";
import { useQuery } from "react-query";
import { auth } from "../../firebase-config";

type TradesForUserResponse = {
  trades: Trade[];
  userProposed: Record<string, boolean>;
};

const fetchUserTrades = async (userId?: string) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/user/${userId}/trades/`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
  return (await resp.json()) as TradesForUserResponse;
};

export const useTradesForUser = () => {
  const user = useAuthUser("user", auth);
  return useQuery<TradesForUserResponse, Error>(
    ["trades", user?.data?.uid],
    () => fetchUserTrades(user?.data?.uid),
    {
      enabled: !!user?.data?.uid,
    }
  );
};
