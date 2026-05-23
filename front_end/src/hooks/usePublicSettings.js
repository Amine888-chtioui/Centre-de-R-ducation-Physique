import { useEffect, useState } from "react";
import { getPublicSettings } from "../services/settings";

const DEFAULT = {
  centreName: "Centre de Rééducation Physique",
  phone: "+212 600 000 000",
  hours: "Lun–Sam 8h–20h",
};

export function usePublicSettings() {
  const [settings, setSettings] = useState(DEFAULT);

  useEffect(() => {
    getPublicSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  const telHref = `tel:${settings.phone.replace(/\s/g, "")}`;

  return { ...settings, telHref };
}
