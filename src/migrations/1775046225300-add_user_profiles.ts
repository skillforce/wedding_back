import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfiles1775046225300 implements MigrationInterface {
  name = 'AddUserProfiles1775046225300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "UserProfiles" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invitationUrl" character varying,
        "profileImg" character varying,
        "weddingDate" TIMESTAMP WITH TIME ZONE,
        "phoneNumber" character varying,
        "email" character varying,
        "userId" integer NOT NULL,
        CONSTRAINT "REL_UserProfiles_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_UserProfiles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "UserProfiles"
        ADD CONSTRAINT "FK_UserProfiles_userId"
        FOREIGN KEY ("userId") REFERENCES "Users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      INSERT INTO "UserProfiles" ("userId", "invitationUrl")
      SELECT "id", "invitationUrl" FROM "Users"
    `);

    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "invitationUrl"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" ADD COLUMN "invitationUrl" character varying`);

    await queryRunner.query(`
      UPDATE "Users" u
      SET "invitationUrl" = p."invitationUrl"
      FROM "UserProfiles" p
      WHERE p."userId" = u."id"
    `);

    await queryRunner.query(`ALTER TABLE "UserProfiles" DROP CONSTRAINT "FK_UserProfiles_userId"`);
    await queryRunner.query(`DROP TABLE "UserProfiles"`);
  }
}