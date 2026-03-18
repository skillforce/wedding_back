import { MigrationInterface, QueryRunner } from "typeorm";

export class WithCoupleGuestFormUpdate1773855677433 implements MigrationInterface {
    name = 'WithCoupleGuestFormUpdate1773855677433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_forms" ADD "if_with_couple_response" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "Guest_forms" ADD "if_with_couple_couple_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_forms" DROP COLUMN "if_with_couple_couple_id"`);
        await queryRunner.query(`ALTER TABLE "Guest_forms" DROP COLUMN "if_with_couple_response"`);
    }

}
