import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvitationUrl1772120683706 implements MigrationInterface {
    name = 'AddInvitationUrl1772120683706'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" ADD "invitationUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "invitationUrl"`);
    }

}
