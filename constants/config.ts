import { Platform } from 'react-native';
import Constants from 'expo-constants';

type Env = 'development' | 'staging' | 'production';

interface AppConfig {
  env: Env;
  apiUrl: string;
  appName: string;
  version: string;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
}

const env = (Constants.expoConfig?.extra?.env as Env) || 'development';

const configs: Record<Env, AppConfig> = {
  development: {
    env: 'development',
    apiUrl: 'https://dev-api.clubafricain.tn',
    appName: 'Club Africain (Dev)',
    version: '1.0.0',
    enableAnalytics: false,
    enableCrashReporting: false,
    maxLoginAttempts: 10,
    sessionTimeoutMinutes: 1440,
  },
  staging: {
    env: 'staging',
    apiUrl: 'https://staging-api.clubafricain.tn',
    appName: 'Club Africain (Staging)',
    version: '1.0.0',
    enableAnalytics: true,
    enableCrashReporting: true,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 480,
  },
  production: {
    env: 'production',
    apiUrl: 'https://api.clubafricain.tn',
    appName: 'Club Africain',
    version: '1.0.0',
    enableAnalytics: true,
    enableCrashReporting: true,
    maxLoginAttempts: 3,
    sessionTimeoutMinutes: 60,
  },
};

export const appConfig: AppConfig = configs[env];

export const isDev = env === 'development';
export const isStaging = env === 'staging';
export const isProd = env === 'production';
