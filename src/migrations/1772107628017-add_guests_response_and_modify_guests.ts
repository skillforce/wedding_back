import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGuestsResponseAndModifyGuests1772107628017 implements MigrationInterface {
    name = 'AddGuestsResponseAndModifyGuests1772107628017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Guest_responses" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "guest_id" integer NOT NULL, "preferred_drinks" text array NOT NULL, "other_preferences" character varying, "plus_one" boolean NOT NULL DEFAULT false, "plus_one_name" character varying, CONSTRAINT "REL_d05752e7216a4d872d82172125" UNIQUE ("guest_id"), CONSTRAINT "PK_f36beb80faf8ace21b006ed878a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Guests" DROP COLUMN "preferred_drinks"`);
        await queryRunner.query(`ALTER TABLE "Guests" DROP COLUMN "other_preferences"`);
        await queryRunner.query(`ALTER TABLE "Guest_responses" ADD CONSTRAINT "FK_d05752e7216a4d872d82172125f" FOREIGN KEY ("guest_id") REFERENCES "Guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_responses" DROP CONSTRAINT "FK_d05752e7216a4d872d82172125f"`);
        await queryRunner.query(`ALTER TABLE "Guests" ADD "other_preferences" character varying`);
        await queryRunner.query(`ALTER TABLE "Guests" ADD "preferred_drinks" text array NOT NULL`);
        await queryRunner.query(`DROP TABLE "Guest_responses"`);
    }

}
