import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleAndCreatedBy1775500000000 implements MigrationInterface {
  name = 'AddUserRoleAndCreatedBy1775500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Users"
        ADD COLUMN "role" varchar NOT NULL DEFAULT 'plainUser'
    `);

    await queryRunner.query(`
      ALTER TABLE "Users"
        ADD COLUMN "createdByUserId" integer NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "Users"
        ADD CONSTRAINT "FK_users_created_by"
        FOREIGN KEY ("createdByUserId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Users" DROP CONSTRAINT "FK_users_created_by"
    `);

    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "createdByUserId"`);
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "role"`);
  }
}