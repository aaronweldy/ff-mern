import { CreateDraftRequest, DraftState, League } from "@ff-mern/ff-types";
import { useMutation, useQueryClient } from "react-query";
import { v4 } from "uuid";
import { apiPut } from "../../API/client";
import { DraftFormState } from "../../Components/LeagueHome/CreateDraftModal";
import { queryKeys } from "./queryKeys";

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
        return apiPut<DraftState>(`/api/v1/draft/create/`, body);
      }
      return undefined;
    },
    {
      onSuccess: (data) => {
        if (data) {
          queryClient.setQueryData(queryKeys.draftForLeague(data.leagueId), {
            draft: data,
          });
          queryClient.invalidateQueries(
            queryKeys.draftForLeague(data.leagueId)
          );
        } else {
          queryClient.invalidateQueries(queryKeys.draftForLeague(leagueId));
        }
      },
    }
  );
};
