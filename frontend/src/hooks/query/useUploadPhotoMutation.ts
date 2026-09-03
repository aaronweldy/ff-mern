import { useMutation, useQueryClient } from "react-query";
import { apiPost } from "../../API/client";

type UploadPhotoRequest = {
  id: string;
  newUrl: string;
};

const uploadPhoto = ({ id, newUrl }: UploadPhotoRequest) =>
  apiPost<void>(`/api/v1/user/${id}/updatePhoto/`, { newUrl });

export const useUploadPhotoMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, UploadPhotoRequest>(uploadPhoto, {
    onSuccess: () => {
      // Photo URL lives in Firebase storage + user profile, not in a
      // react-query cache entry, but keep an invalidation hook so future
      // user-profile queries stay fresh.
      queryClient.invalidateQueries("user");
    },
  });
};
