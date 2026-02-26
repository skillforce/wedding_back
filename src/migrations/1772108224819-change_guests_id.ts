import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeGuestsId1772108224819 implements MigrationInterface {
    name = 'ChangeGuestsId1772108224819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_responses" DROP CONSTRAINT "FK_d05752e7216a4d872d82172125f"`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" DROP CONSTRAINT "REL_d05752e7216a4d872d82172125"`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" DROP COLUMN "guest_id"`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" ADD "guest_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" ADD CONSTRAINT "UQ_d05752e7216a4d872d82172125f" UNIQUE ("guest_id")`);
        await queryRunner.query(`ALTER TABLE "Guests" DROP CONSTRAINT "PK_3a0fee9819ab35f614faa7e01b3"`);
        await queryRunner.query(`ALTER TABLE "Guests" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "Guests" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "Guests" ADD CONSTRAINT "PK_3a0fee9819ab35f614faa7e01b3" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" ADD CONSTRAINT "FK_d05752e7216a4d872d82172125f" FOREIGN KEY ("guest_id") REFERENCES "Guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_responses" DROP CONSTRAINT "FK_d05752e7216a4d872d82172125f"`);
        await queryRunner.query(`ALTER TABLE "Guests" DROP CONSTRAINT "PK_3a0fee9819ab35f614faa7e01b3"`);
        await queryRunner.query(`ALTER TABLE "Guests" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "Guests" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Guests" ADD CONSTRAINT "PK_3a0fee9819ab35f614faa7e01b3" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" DROP CONSTRAINT "UQ_d05752e7216a4d872d82172125f"`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" DROP COLUMN "guest_id"`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" ADD "guest_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" ADD CONSTRAINT "REL_d05752e7216a4d872d82172125" UNIQUE ("guest_id")`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" ADD CONSTRAINT "FK_d05752e7216a4d872d82172125f" FOREIGN KEY ("guest_id") REFERENCES "Guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
