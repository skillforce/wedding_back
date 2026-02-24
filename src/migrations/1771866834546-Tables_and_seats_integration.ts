import { MigrationInterface, QueryRunner } from 'typeorm';

export class TablesAndSeatsIntegration1771866834546 implements MigrationInterface {
  name = 'TablesAndSeatsIntegration1771866834546';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "seating_seats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "table_id" uuid NOT NULL, "name" character varying NOT NULL, "seat_order" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_588e982ca146d1b6a9f8a3e0188" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "seating_tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, "name" character varying NOT NULL, "position" jsonb NOT NULL, "shape" character varying(8) NOT NULL DEFAULT 'circle', "rotation" double precision NOT NULL DEFAULT '0', "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "PK_ae9dc9237b2da4e66fd26a878b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "seating_seats" ADD CONSTRAINT "FK_5a07d3af315bfab93865d7f75bb" FOREIGN KEY ("table_id") REFERENCES "seating_tables"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "seating_tables" ADD CONSTRAINT "FK_9bbd9bef65ff83addc02595676a" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seating_tables" DROP CONSTRAINT "FK_9bbd9bef65ff83addc02595676a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seating_seats" DROP CONSTRAINT "FK_5a07d3af315bfab93865d7f75bb"`,
    );
    await queryRunner.query(`DROP TABLE "seating_tables"`);
    await queryRunner.query(`DROP TABLE "seating_seats"`);
  }
}
