import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustSeatingSeatsWithGuestsRelation1773140269140 implements MigrationInterface {
    name = 'AdjustSeatingSeatsWithGuestsRelation1773140269140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "seating_seats"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" RENAME COLUMN "name" TO "guest_id"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" DROP COLUMN "guest_id"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" ADD "guest_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "seating_seats" ADD CONSTRAINT "UQ_0f91a3234958d6a26ce442e92bc" UNIQUE ("guest_id")`);
        await queryRunner.query(`ALTER TABLE "seating_seats" ADD CONSTRAINT "FK_0f91a3234958d6a26ce442e92bc" FOREIGN KEY ("guest_id") REFERENCES "Guests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seating_seats" DROP CONSTRAINT "FK_0f91a3234958d6a26ce442e92bc"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" DROP CONSTRAINT "UQ_0f91a3234958d6a26ce442e92bc"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" DROP COLUMN "guest_id"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" ADD "guest_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "seating_seats" RENAME COLUMN "guest_id" TO "name"`);
    }

}
