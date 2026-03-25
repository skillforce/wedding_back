import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyExchangeEntity1774435428002 implements MigrationInterface {
    name = 'AddCurrencyExchangeEntity1774435428002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."currency_rates_base_enum" AS ENUM('USD', 'BYN', 'RUB')`);
        await queryRunner.query(`CREATE TABLE "currency_rates" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "base" "public"."currency_rates_base_enum" NOT NULL DEFAULT 'USD', "byn" numeric(12,6) NOT NULL, "rub" numeric(12,6) NOT NULL, CONSTRAINT "PK_43636e55d92705f102d2a6e75a0" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "currency_rates"`);
        await queryRunner.query(`DROP TYPE "public"."currency_rates_base_enum"`);
    }

}
