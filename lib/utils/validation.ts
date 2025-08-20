export const validateEmail = (email: string, allowedDomains: string[]): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  const domain = email.split('@')[1];
  return allowedDomains.some(allowedDomain => 
    domain === allowedDomain || domain.endsWith('.' + allowedDomain)
  );
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9-\s()]+$/;
  const cleanPhone = phone.replace(/[-\s()]/g, '');
  return phoneRegex.test(phone) && cleanPhone.length >= 9;
};

export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5, 9)}`;
};

export const isWithinApplyWindow = (start: string, end: string): boolean => {
  const now = new Date();
  const startDate = new Date(start);
  const endDate = new Date(end);
  return now >= startDate && now <= endDate;
};