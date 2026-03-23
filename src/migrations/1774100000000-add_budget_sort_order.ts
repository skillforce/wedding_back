import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBudgetSortOrder1774100000000 implements MigrationInterface {
  name = 'AddBudgetSortOrder1774100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget_sections" ADD "sortOrder" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_items" ADD "sortOrder" integer NOT NULL DEFAULT '0'`,
    );

    await queryRunner.query(
      `UPDATE "budget_sections" AS "section"
       SET "sortOrder" = "ordered"."sortOrder"
       FROM (
         SELECT
           "id",
           ROW_NUMBER() OVER (
             PARTITION BY "budgetId"
             ORDER BY "createdAt" ASC, "id" ASC
           ) - 1 AS "sortOrder" 
         FROM "budget_sections"
       ) AS "ordered"
       WHERE "ordered"."id" = "section"."id"`,
    );
    await queryRunner.query(
      `UPDATE "budget_items" AS "item"
       SET "sortOrder" = "ordered"."sortOrder"
       FROM (
         SELECT
           "id",
           ROW_NUMBER() OVER (
             PARTITION BY "sectionId"
             ORDER BY "createdAt" ASC, "id" ASC
           ) - 1 AS "sortOrder"
         FROM "budget_items"
       ) AS "ordered"
       WHERE "ordered"."id" = "item"."id"`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_budget_sections_budget_id" ON "budget_sections" ("budgetId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_budget_items_section_id" ON "budget_items" ("sectionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_sections" ADD CONSTRAINT "UQ_budget_sections_budget_id_sort_order" UNIQUE ("budgetId", "sortOrder") DEFERRABLE INITIALLY DEFERRED`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_items" ADD CONSTRAINT "UQ_budget_items_section_id_sort_order" UNIQUE ("sectionId", "sortOrder") DEFERRABLE INITIALLY DEFERRED`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "budget_items" DROP CONSTRAINT "UQ_budget_items_section_id_sort_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_sections" DROP CONSTRAINT "UQ_budget_sections_budget_id_sort_order"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_budget_items_section_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_budget_sections_budget_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_items" DROP COLUMN "sortOrder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "budget_sections" DROP COLUMN "sortOrder"`,
    );
  }
}
