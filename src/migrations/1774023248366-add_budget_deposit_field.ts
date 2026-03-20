import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBudgetDepositField1774023248366 implements MigrationInterface {
    name = 'AddBudgetDepositField1774023248366'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_items" ADD "deposit" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budget_items" DROP COLUMN "deposit"`);
    }

}
