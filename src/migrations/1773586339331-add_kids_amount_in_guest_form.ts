import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKidsAmountInGuestForm1773586339331 implements MigrationInterface {
    name = 'AddKidsAmountInGuestForm1773586339331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "shape"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "shape" character varying NOT NULL DEFAULT 'circle'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "shape"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "shape" character varying(16) NOT NULL DEFAULT 'circle'`);
    }

}
