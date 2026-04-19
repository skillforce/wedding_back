import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScenarioRemoveSortOrderAddTimeUniqueAddDuration1776600000000 implements MigrationInterface {
  name = 'ScenarioRemoveSortOrderAddTimeUniqueAddDuration1776600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "scenario_points" DROP CONSTRAINT "UQ_scenario_points_scenario_id_sort_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_points" DROP COLUMN "sort_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_points" ADD CONSTRAINT "UQ_scenario_points_scenario_id_time" UNIQUE ("scenario_id", "time")`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_points" ADD COLUMN "duration" integer DEFAULT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "scenario_points" DROP COLUMN "duration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_points" DROP CONSTRAINT "UQ_scenario_points_scenario_id_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_points" ADD COLUMN "sort_order" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "scenario_points" ADD CONSTRAINT "UQ_scenario_points_scenario_id_sort_order" UNIQUE ("scenario_id", "sort_order") DEFERRABLE INITIALLY DEFERRED`,
    );
  }
}