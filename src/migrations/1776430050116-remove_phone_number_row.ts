import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePhoneNumberRow1776430050116 implements MigrationInterface {
    name = 'RemovePhoneNumberRow1776430050116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserProfiles" DROP COLUMN "phoneNumber"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "UserProfiles" ADD "phoneNumber" character varying`);
    }

}
