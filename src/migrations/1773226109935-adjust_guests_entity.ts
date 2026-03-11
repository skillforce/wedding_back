import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustGuestsEntity1773226109935 implements MigrationInterface {
    name = 'AdjustGuestsEntity1773226109935'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "Guest_responses"`);
        await queryRunner.query(`DELETE FROM "Guests"`);
        await queryRunner.query(`CREATE TABLE "Guest_forms" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "guest_id" uuid NOT NULL, "relationship_to_couple" character varying NOT NULL, "age_group" character varying NOT NULL, "has_kids_attending" boolean NOT NULL DEFAULT false, "personality_type" character varying NOT NULL, "vip_parents" boolean NOT NULL DEFAULT false, "vip_grandparents" boolean NOT NULL DEFAULT false, "vip_relatives" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_56d3cd08fc5ad1c348de1a482f" UNIQUE ("guest_id"), CONSTRAINT "PK_29a1e1942d0757651bd86796a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Guest_forms" ADD CONSTRAINT "FK_56d3cd08fc5ad1c348de1a482fa" FOREIGN KEY ("guest_id") REFERENCES "Guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Guest_forms" DROP CONSTRAINT "FK_56d3cd08fc5ad1c348de1a482fa"`);
        await queryRunner.query(`DROP TABLE "Guest_forms"`);
    }

}
