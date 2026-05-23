import api from "./api";

export const API_BASE_URL = "http://localhost:8080/api";

export const getNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get("/notifications/unread-count");
  return data.count ?? 0;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  await api.put("/notifications/read-all");
};

export function getNotificationStreamUrl(token) {
  const params = new URLSearchParams({ access_token: token });
  return `${API_BASE_URL}/notifications/stream?${params.toString()}`;
}
