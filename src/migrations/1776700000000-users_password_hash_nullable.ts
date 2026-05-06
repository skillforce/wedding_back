import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersPasswordHashNullable1776700000000 implements MigrationInterface {
  name = 'UsersPasswordHashNullable1776700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "passwordHash" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "Users" SET "passwordHash" = '' WHERE "passwordHash" IS NULL`);
    await queryRunner.query(`ALTER TABLE "Users" ALTER COLUMN "passwordHash" SET NOT NULL`);
  }
}