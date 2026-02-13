import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { configValidationUtility } from '../helpers/config-validation.utility';

config();

export default new DataSource({
  url: process.env.DATABASE_URL,
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT as unknown as number,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: configValidationUtility.convertToBoolean(
    process.env.POSTGRES_SSL_STATUS || '',
  ) as boolean,
  migrations: ['src/migrations/*.ts'],
  entities: ['src/**/*.entity.ts'],
  logging: ['query'],
});
