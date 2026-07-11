import api from "./api";
import { getNotificationStreamUrl } from "../config/api";

export { getNotificationStreamUrl };

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

export const deleteNotification = async (id) => {
  await api.delete(`/notifications/${id}`);
};

export const deleteAllNotifications = async () => {
  await api.delete("/notifications");
};
