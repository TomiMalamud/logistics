export const sanitizePhoneNumber = (phone: string): string => 
    phone.replace(/[^0-9]/g, '');
  
export const validatePhoneNumber = (phone: string): boolean => 
    /^\d{10}$/.test(phone);