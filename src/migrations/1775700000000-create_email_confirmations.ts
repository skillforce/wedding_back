import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailConfirmations1775700000000 implements MigrationInterface {
  name = 'CreateEmailConfirmations1775700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "email_confirmations" (
        "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
        "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
        "userId"      integer       NOT NULL,
        "token"       varchar       NOT NULL,
        "email"       varchar       NOT NULL,
        "expiresAt"   TIMESTAMPTZ   NOT NULL,
        "confirmedAt" TIMESTAMPTZ   NULL,
        CONSTRAINT "PK_email_confirmations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_confirmations_token" UNIQUE ("token"),
        CONSTRAINT "FK_email_confirmations_user"
          FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_email_confirmations_token" ON "email_confirmations" ("token")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_confirmations"`);
  }
}