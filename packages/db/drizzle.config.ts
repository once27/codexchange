import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load env from root first, then apps/web
const rootEnvPath = path.resolve(__dirname, '../../.env.local');
const webEnvPath = path.resolve(__dirname, '../../apps/web/.env.local');

if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(webEnvPath)) {
    dotenv.config({ path: webEnvPath });
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env.local file');
}

export default {
    schema: './schema.ts',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
} satisfies Config;
