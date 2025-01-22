// utils/emailValidation.ts

const BLOCKED_DOMAINS = [
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "mercadolibre.com",
  "mercadolibre.com.ar",
  "mercadolibre.com.mx",
  "mercadolibre.com.br",
  "mercadolibre.cl",
  "mercadolibre.com.co",
  "mercadolibre.com.pe",
  "mercadolibre.com.uy",
  "mercadolibre.com.ve"
] as const;

const SPAM_PATTERNS = [
  /^test@/i,
  /^spam@/i,
  /^noreply@/i,
  /^no-reply@/i,
  /^donotreply@/i,
  /^do-not-reply@/i,
  /^anonymous@/i,
  /^temp@/i,
  /^temporary@/i,
  /^fake@/i
] as const;

export const isEmailValid = (email: string): boolean => {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check for blocked domains
  const domain = email.split("@")[1].toLowerCase();
  if (BLOCKED_DOMAINS.some((blockedDomain) => domain.includes(blockedDomain))) {
    return false;
  }

  // Check for spam patterns
  if (SPAM_PATTERNS.some((pattern) => pattern.test(email))) {
    return false;
  }

  return true;
};
