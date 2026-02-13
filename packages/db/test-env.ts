import * as dotenv from 'dotenv';
import * as path from 'path';

const rootEnvPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: rootEnvPath });

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20));
