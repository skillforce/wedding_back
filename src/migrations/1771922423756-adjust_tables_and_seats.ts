import { MigrationInterface, QueryRunner } from "typeorm";

export class AdjustTablesAndSeats1771922423756 implements MigrationInterface {
    name = 'AdjustTablesAndSeats1771922423756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seating_seats" DROP COLUMN "seat_order"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "sort_order"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "seating_seats" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "seating_seats" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "sort_order" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "seating_seats" ADD "seat_order" integer NOT NULL DEFAULT '0'`);
    }

}
