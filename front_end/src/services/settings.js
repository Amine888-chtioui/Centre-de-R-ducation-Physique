import api from "./api";

export const getPublicSettings = async () => {
  const { data } = await api.get("/settings/public");
  return data;
};
