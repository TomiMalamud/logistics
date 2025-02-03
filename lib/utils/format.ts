import parsePhoneNumberFromString from "libphonenumber-js";

export const sanitizePhoneNumber = (phone: string): string =>
  phone.replace(/[^0-9]/g, "");

export const validatePhoneNumber = (phone: string): boolean =>
  /^\d{10}$/.test(phone);

export const formatDate = (dateString: string): string => {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("es-AR");
};

export const formatLongDate = (dateString: string) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("es-AR");
};

export const formatNoteDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatPhoneNumber = (phoneNumber?: string) => {
  if (!phoneNumber) return "Number not available";
  const parsed = parsePhoneNumberFromString(phoneNumber, "AR");
  return parsed
    ? parsed.formatInternational().replace("+54 ", "")
    : "Invalid phone number";
};
