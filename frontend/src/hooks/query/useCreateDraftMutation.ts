import { CreateDraftRequest, DraftState, League } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { v4 } from "uuid";
import { DraftFormState } from "../../Components/LeagueHome/CreateDraftModal";

export const useCreateDraft = (
  leagueId: string,
  existingDraft: DraftState | null | undefined,
  league?: League
) => {
  const queryClient = useQueryClient();
  return useMutation<DraftState | undefined, Error, DraftFormState>(
    async (state: DraftFormState) => {
      console.log("creating draft", state);
      if (league) {
        const url = process.env.REACT_APP_PUBLIC_URL + "/api/v1/draft/create/";
        const body: CreateDraftRequest = {
          leagueId,
          draftSettings: {
            draftId: v4(),
            type: "official",
            pickOrder: state.pickOrder,
            numRounds: state.numRounds,
            draftOrder: state.draftOrder.map((teamInfo) => teamInfo.id),
          },
        };
        if (existingDraft) {
          body.draftSettings.draftId = existingDraft.settings.draftId;
        }
        const options = {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        };
        const data = await fetch(url, options);
        return (await data.json()) as DraftState;
      }
    },
    {
      onSuccess: (data) => {
        if (data) {
          queryClient.setQueryData(["draftForLeague", data.leagueId], {
            draft: data,
          });
        }
      },
    }
  );
};
