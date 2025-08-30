import { useAuthUser } from "@react-query-firebase/auth";
import { useMutation } from "react-query";
import { auth } from "../../firebase-config";

export const useDeleteLeagueMutation = (leagueId: string) => {
  const user = useAuthUser("user", auth);
  return useMutation<void, Error>(async () => {
    const url = `${import.meta.env.VITE_PUBLIC_URL}/api/v1/league/${leagueId}/delete/`;
    const req = {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: user?.data?.uid }),
    };
    const resp = await fetch(url, req);
    if (!resp.ok) {
      throw new Error(resp.statusText);
    }
  });
};
