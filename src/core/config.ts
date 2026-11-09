import { Platform } from 'react-native';

/**
 * Obtiene la URL base adecuada según la plataforma de ejecución:
 * - Emulador Android estándar: 10.0.2.2 mapea a 127.0.0.1 de la máquina anfitrión.
 * - iOS / Web / Node / Desktop: 127.0.0.1 o localhost.
 * - Puede sobreescribirse mediante la variable EXPO_PUBLIC_API_URL.
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://127.0.0.1:3000';
}

