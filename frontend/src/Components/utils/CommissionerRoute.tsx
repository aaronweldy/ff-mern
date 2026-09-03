import { useAuthUser } from "@react-query-firebase/auth";
import { UserInfo } from "firebase/auth";
import { useState } from "react";
import { useQuery } from "react-query";
import { Navigate, useParams } from "react-router-dom";
import { apiGet } from "../../API/client";
import { auth } from "../../firebase-config";
import { queryKeys } from "../../hooks/query/queryKeys";

const fetchCommCheck = (leagueId: string, userId?: string) =>
  apiGet<{ isCommissioner: boolean }>(
    `/api/v1/league/${leagueId}/${userId}/isCommissioner/`
  );

export const CommissionerRoute = ({ children }: { children: JSX.Element }) => {
  const [redirect, setRedirect] = useState(false);
  const { id: leagueId } = useParams() as { id: string };
  const { data } = useAuthUser<UserInfo>(["user"], auth);
  const userId = data?.uid;
  console.log(!!data?.uid, data?.uid);
  useQuery(
    queryKeys.commissionerCheck(leagueId, data?.uid),
    () => fetchCommCheck(leagueId, data?.uid),
    {
      onSuccess: (data) => {
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
