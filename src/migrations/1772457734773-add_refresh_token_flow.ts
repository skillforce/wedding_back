import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenFlow1772457734773 implements MigrationInterface {
    name = 'AddRefreshTokenFlow1772457734773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "RefreshTokens" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" integer NOT NULL, "tokenHash" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_07ff4bc1b9063ed3401f15aea10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "RefreshTokens" ADD CONSTRAINT "FK_6dfd786f75cfe054e9ae3a45f5e" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "RefreshTokens" DROP CONSTRAINT "FK_6dfd786f75cfe054e9ae3a45f5e"`);
        await queryRunner.query(`DROP TABLE "RefreshTokens"`);
    }

}
