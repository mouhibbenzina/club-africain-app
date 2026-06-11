import { Linking, Platform } from 'react-native';

type SanitizedInput = {
  value: string;
  isValid: boolean;
  error?: string;
};

export function sanitizeString(input: string, maxLength = 255): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '')
    .slice(0, maxLength);
}

export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function sanitizeNumeric(input: string): string {
  return input.replace(/[^0-9.]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(tunisianPhone: string): boolean {
  const phoneRegex = /^[2459][0-9]{7}$/;
  return phoneRegex.test(tunisianPhone.replace(/^\+216/, ''));
}

export function validatePassword(password: string): SanitizedInput {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Au moins 8 caractères');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Une majuscule requise');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Un chiffre requis');
  }

  return {
    value: password,
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join(', ') : undefined,
  };
}

export function validateDeepLink(url: string): boolean {
  const allowedSchemes = ['club-africain://', 'https://clubafricain.tn'];
  return allowedSchemes.some((scheme) => url.startsWith(scheme));
}

export async function openDeepLink(url: string): Promise<boolean> {
  if (!validateDeepLink(url)) {
    console.warn('Blocked invalid deep link:', url);
    return false;
  }
  return Linking.canOpenURL(url).then(
    (supported) => supported && Linking.openURL(url),
  );
}
