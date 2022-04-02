import { useMutation } from "react-query";

type UploadPhotoRequest = {
  id: string;
  newUrl: string;
};

const uploadPhoto = async ({ id, newUrl }: UploadPhotoRequest) => {
  const url = `${process.env.REACT_APP_PUBLIC_URL}/api/v1/user/${id}/updatePhoto/`;
  const req = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ newUrl }),
  };
  const resp = await fetch(url, req);
  if (!resp.ok) {
    throw new Error(resp.statusText);
  }
};

export const useUploadPhotoMutation = () => {
  return useMutation<void, Error, UploadPhotoRequest>(uploadPhoto);
};
