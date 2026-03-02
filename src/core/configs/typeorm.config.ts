import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { configValidationUtility } from '../helpers/config-validation.utility';

config();

const isTesting = process.env.NODE_ENV === 'testing';
const isProd = process.env.NODE_ENV === 'production';

export default new DataSource({
  url: process.env.DATABASE_URL,
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT as unknown as number,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: configValidationUtility.convertToBoolean(
    process.env.POSTGRES_SSL_STATUS || '',
  ) as boolean,
  migrations: [isProd ? 'dist/migrations/*.js' : 'src/migrations/*.ts'],
  entities: [isProd ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  logging: ['query'],
  dropSchema: false,
  synchronize: false,
});
