import api from "./api";

export const getAdminStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data;
};

export const getTodayAppointments = async () => {
  const { data } = await api.get("/admin/appointments/today");
  return data;
};

export const getAllAppointments = async () => {
  const { data } = await api.get("/admin/appointments");
  return data;
};

export const updateAppointmentStatus = async (id, status) => {
  const { data } = await api.put(`/admin/appointments/${id}/status`, {
    status: String(status).toUpperCase(),
  });
  return data;
};

export const getPatients = async (search = "") => {
  const { data } = await api.get("/admin/patients", {
    params: search ? { search } : {},
  });
  return data;
};

export const getPatientDetail = async (id) => {
  const { data } = await api.get(`/admin/patients/${id}`);
  return data;
};

export const createManualAppointment = async (payload) => {
  const { data } = await api.post("/admin/appointments", payload);
  return data;
};

export const getRecentActivity = async () => {
  const { data } = await api.get("/admin/activity");
  return data;
};

export const getWeeklyChart = async () => {
  const { data } = await api.get("/admin/chart/weekly");
  return data;
};

export const getAdminSettings = async () => {
  const { data } = await api.get("/admin/settings");
  return data;
};

export const updateAdminSettings = async (settings) => {
  const { data } = await api.put("/admin/settings", settings);
  return data;
};

export const getAdminSchedule = async () => {
  const { data } = await api.get("/admin/schedule");
  return data;
};

export const updateAdminSchedule = async (payload) => {
  const { data } = await api.put("/admin/schedule", payload);
  return data;
};
