export const sanitizePhoneNumber = (phone: string): string => 
    phone.replace(/[^0-9]/g, '');
  
export const validatePhoneNumber = (phone: string): boolean => 
    /^\d{10}$/.test(phone);

export const formatDate = (dateString: string): string => {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString();
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
      timeZone: "UTC"
    });
  };


