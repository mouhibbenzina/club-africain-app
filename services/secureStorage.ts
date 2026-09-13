import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

const isWeb = Platform.OS === 'web';

const web = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const SecureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return web.getItem(key);
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      web.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      web.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },

  async setToken(token: string): Promise<void> {
    await this.setItem(TOKEN_KEY, token);
  },

  async getToken(): Promise<string | null> {
    return this.getItem(TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await this.setItem(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return this.getItem(REFRESH_TOKEN_KEY);
  },

  async setUser(user: object): Promise<void> {
    await this.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser<T>(): Promise<T | null> {
    const data = await this.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async clear(): Promise<void> {
    await this.removeItem(TOKEN_KEY);
    await this.removeItem(REFRESH_TOKEN_KEY);
    await this.removeItem(USER_KEY);
  },
};