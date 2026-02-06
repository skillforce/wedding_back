import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'supertest';

export const deleteAllData = async (
  app: INestApplication,
): Promise<Request> => {
  return await request(app.getHttpServer()).delete(`/api/testing/all-data`);
};
