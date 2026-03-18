import dotenv from 'dotenv';

dotenv.config();

type Env = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function loadConfig(): Env {
  const nodeEnv =
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'test'
      ? (process.env.NODE_ENV as Env['NODE_ENV'])
      : 'development';

  const portRaw = process.env.PORT || '5007';
  const port = Number(portRaw);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const DATABASE_URL = requireEnv('DATABASE_URL');
  const JWT_SECRET = requireEnv('JWT_SECRET');
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? null;

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
  };
}

export const config = loadConfig();

