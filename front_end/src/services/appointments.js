import api from "./api";

export const getMyAppointments = async () => {
  const response = await api.get("/appointments/me");
  return response.data;
};

export const getMyNextAppointment = async () => {
  const response = await api.get("/appointments/me/next");
  if (response.status === 204 || !response.data) {
    return null;
  }
  return response.data;
};

export const getAvailableDays = async (days = 21) => {
  const { data } = await api.get("/appointments/availability/days", {
    params: { days },
  });
  return data;
};

export const getAvailableSlots = async (date) => {
  const { data } = await api.get("/appointments/availability/slots", {
    params: { date },
  });
  return data;
};

export const createAppointment = async (data) => {
  const response = await api.post("/appointments", data);
  return response.data;
};

export const cancelAppointment = async (id) => {
  await api.delete(`/appointments/${id}`);
};

export const APPOINTMENT_TYPES = [
  "Kinésithérapie",
  "Rééducation sportive",
  "Bilan initial",
  "Suivi",
];
