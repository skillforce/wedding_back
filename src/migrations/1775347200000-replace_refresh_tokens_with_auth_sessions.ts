import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceRefreshTokensWithAuthSessions1775347200000
  implements MigrationInterface
{
  name = 'ReplaceRefreshTokensWithAuthSessions1775347200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" integer NOT NULL,
        "refreshTokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "deviceId" character varying NOT NULL,
        "userAgent" character varying(512) NOT NULL,
        "deviceName" character varying,
        "lastActiveAt" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_auth_sessions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_sessions_user_device"
      ON "auth_sessions" ("userId", "deviceId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_sessions_expires_at"
      ON "auth_sessions" ("expiresAt")
    `);

    await queryRunner.query(`
      INSERT INTO "auth_sessions"
        ("id", "userId", "refreshTokenHash", "expiresAt", "deviceId", "userAgent", "lastActiveAt", "createdAt", "updatedAt")
      SELECT
        "id",
        "userId",
        "tokenHash",
        "expiresAt",
        uuid_generate_v4()::varchar,
        'migrated',
        "createdAt",
        "createdAt",
        "updatedAt"
      FROM "RefreshTokens"
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
        ADD CONSTRAINT "FK_auth_sessions_user"
        FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "RefreshTokens" DROP CONSTRAINT "FK_6dfd786f75cfe054e9ae3a45f5e"
    `);

    await queryRunner.query(`DROP TABLE "RefreshTokens"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "RefreshTokens" (
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" integer NOT NULL,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_07ff4bc1b9063ed3401f15aea10" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "RefreshTokens" ("id", "userId", "tokenHash", "expiresAt", "createdAt", "updatedAt")
      SELECT "id", "userId", "refreshTokenHash", "expiresAt", "createdAt", "updatedAt"
      FROM "auth_sessions"
    `);

    await queryRunner.query(`
      ALTER TABLE "RefreshTokens"
        ADD CONSTRAINT "FK_6dfd786f75cfe054e9ae3a45f5e"
        FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`DROP INDEX "IDX_auth_sessions_user_device"`);
    await queryRunner.query(`DROP INDEX "IDX_auth_sessions_expires_at"`);
    await queryRunner.query(`
      ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_auth_sessions_user"
    `);
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
  }
}