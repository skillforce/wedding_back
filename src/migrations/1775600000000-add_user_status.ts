import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserStatus1775600000000 implements MigrationInterface {
  name = 'AddUserStatus1775600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Users"
        ADD COLUMN "status" varchar NOT NULL DEFAULT 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "status"`);
  }
}