import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameEmailConfirmationsToConfirmations1777000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "email_confirmations" RENAME TO "confirmations"`);

    await queryRunner.query(`
      ALTER TABLE "confirmations"
      ADD COLUMN "type" varchar NOT NULL DEFAULT 'EMAIL_CONFIRMATION'
    `);

    await queryRunner.query(`
      ALTER TABLE "confirmations" ALTER COLUMN "type" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "confirmations" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "confirmations" RENAME TO "email_confirmations"`);
  }
}