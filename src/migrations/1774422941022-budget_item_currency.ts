import { MigrationInterface, QueryRunner } from "typeorm";

export class BudgetItemCurrency1774422941022 implements MigrationInterface {
    name = 'BudgetItemCurrency1774422941022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."budget_items_currency_enum" AS ENUM('RUB', 'USD', 'BYN')`);
        await queryRunner.query(`ALTER TABLE "budget_items" ADD "currency" "public"."budget_items_currency_enum" NOT NULL DEFAULT 'USD'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_items" DROP COLUMN "currency"`);
        await queryRunner.query(`DROP TYPE "public"."budget_items_currency_enum"`);
    }

}
