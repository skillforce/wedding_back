import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKidsAmountInGuestForm1773420999498 implements MigrationInterface {
    name = 'AddKidsAmountInGuestForm1773420999498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_forms" ADD "amount_of_kids" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_forms" DROP COLUMN "amount_of_kids"`);
    }

}
