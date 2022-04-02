import { useAuthUser } from "@react-query-firebase/auth";
import { useState } from "react";
import { useQuery } from "react-query";
import { Navigate, useParams } from "react-router-dom";
import { auth } from "../../firebase-config";
import { UserInfo } from "firebase/auth";

const fetchCommCheck = async (leagueId: string, userId?: string) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/league/${leagueId}/${userId}/isCommissioner/`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  return res;
};

export const CommissionerRoute = ({ children }: { children: JSX.Element }) => {
  const [redirect, setRedirect] = useState(false);
  const { id: leagueId } = useParams() as { id: string };
  const { data } = useAuthUser<UserInfo>(["user"], auth);
  const userId = data?.uid;
  console.log(!!data?.uid, data?.uid);
  useQuery(
    ["commissionerCheck", leagueId, data?.uid],
    () => fetchCommCheck(leagueId, data?.uid),
    {
      onSuccess: async (resp) => {
        const data: { isCommissioner: boolean } = await resp.json();
        if (!data.isCommissioner) {
          setRedirect(true);
        }
      },
      enabled: !!userId,
    }
  );
  if (redirect) {
    return <Navigate to="/" />;
  }
  return children;
};
