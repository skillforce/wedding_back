import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScenarioTables1776500000000 implements MigrationInterface {
  name = 'AddScenarioTables1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "scenarios" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, CONSTRAINT "UQ_scenarios_user_id" UNIQUE ("user_id"), CONSTRAINT "REL_scenarios_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_scenarios" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "scenario_points" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scenario_id" uuid NOT NULL, "time" char(5) NOT NULL, "title" character varying(50) NOT NULL, "icon" character varying(16) NOT NULL DEFAULT 'ceremony', "note" character varying(50) NOT NULL DEFAULT '', "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_scenario_points_scenario_id_sort_order" UNIQUE ("scenario_id", "sort_order") DEFERRABLE INITIALLY DEFERRED, CONSTRAINT "PK_scenario_points" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_scenario_points_scenario_id" ON "scenario_points" ("scenario_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenarios" ADD CONSTRAINT "FK_scenarios_user_id" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_points" ADD CONSTRAINT "FK_scenario_points_scenario_id" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "scenarios" ("user_id") SELECT "id" FROM "Users"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "scenario_points" DROP CONSTRAINT "FK_scenario_points_scenario_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenarios" DROP CONSTRAINT "FK_scenarios_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_scenario_points_scenario_id"`);
    await queryRunner.query(`DROP TABLE "scenario_points"`);
    await queryRunner.query(`DROP TABLE "scenarios"`);
  }
}