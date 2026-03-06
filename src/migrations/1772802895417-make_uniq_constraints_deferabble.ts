import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeUniqConstraintsDeferabble1772802895417 implements MigrationInterface {
  name = 'MakeUniqConstraintsDeferabble1772802895417';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checklist_items" DROP CONSTRAINT "UQ_808b68e61e13ea8be943c228704"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_phases" DROP CONSTRAINT "UQ_5366a4673ea91a38341a4ed09f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" ADD CONSTRAINT "UQ_checklist_items_phase_id_sort_order" UNIQUE ("phase_id", "sort_order") DEFERRABLE INITIALLY DEFERRED`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_phases" ADD CONSTRAINT "UQ_checklist_phases_checklist_id_sort_order" UNIQUE ("checklist_id", "sort_order") DEFERRABLE INITIALLY DEFERRED`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checklist_phases" DROP CONSTRAINT "UQ_checklist_phases_checklist_id_sort_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" DROP CONSTRAINT "UQ_checklist_items_phase_id_sort_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_phases" ADD CONSTRAINT "UQ_5366a4673ea91a38341a4ed09f3" UNIQUE ("checklist_id", "sort_order")`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" ADD CONSTRAINT "UQ_808b68e61e13ea8be943c228704" UNIQUE ("phase_id", "sort_order")`,
    );
  }
}
