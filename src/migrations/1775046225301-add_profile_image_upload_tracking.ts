import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileImageUploadTracking1775046225301 implements MigrationInterface {
  name = 'AddProfileImageUploadTracking1775046225301';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "UserProfiles" ADD COLUMN "dailyImageUploadCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "UserProfiles" ADD COLUMN "imageUploadResetDate" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "UserProfiles" DROP COLUMN "imageUploadResetDate"`);
    await queryRunner.query(`ALTER TABLE "UserProfiles" DROP COLUMN "dailyImageUploadCount"`);
  }
}