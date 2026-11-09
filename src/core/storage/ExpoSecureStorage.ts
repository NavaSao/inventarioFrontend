import * as SecureStore from 'expo-secure-store';
import { ISecureStorage } from './ISecureStorage';

const TOKEN_KEY = 'assetops_auth_token';

/**
 * Implementación de ISecureStorage utilizando expo-secure-store (Keychain en iOS / Keystore en Android).
 * Incluye fallback seguro en memoria para entornos web o de pruebas automatizadas sin hardware nativo.
 */
export class ExpoSecureStorage implements ISecureStorage {
  private fallbackMemoryToken: string | null = null;
  private readonly key: string;

  constructor(key: string = TOKEN_KEY) {
    this.key = key;
  }

  async guardarToken(token: string): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.setItemAsync(this.key, token);
        return;
      }
    } catch {
      // Entorno sin soporte nativo de hardware
    }
    this.fallbackMemoryToken = token;
  }

  async obtenerToken(): Promise<string | null> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        const token = await SecureStore.getItemAsync(this.key);
        if (token) return token;
      }
    } catch {
      // Entorno sin soporte nativo de hardware
    }
    return this.fallbackMemoryToken;
  }

  async eliminarToken(): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        await SecureStore.deleteItemAsync(this.key);
      }
    } catch {
      // Entorno sin soporte nativo de hardware
    }
    this.fallbackMemoryToken = null;
  }
}

