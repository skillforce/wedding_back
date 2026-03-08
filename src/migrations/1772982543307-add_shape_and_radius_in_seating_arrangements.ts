import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShapeAndRadiusInSeatingArrangements1772982543307 implements MigrationInterface {
    name = 'AddShapeAndRadiusInSeatingArrangements1772982543307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "radius" integer NOT NULL DEFAULT '70'`);
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "shape"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "shape" character varying(16) NOT NULL DEFAULT 'circle'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "shape"`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "shape" character varying(8) NOT NULL DEFAULT 'circle'`);
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "radius"`);
    }

}
