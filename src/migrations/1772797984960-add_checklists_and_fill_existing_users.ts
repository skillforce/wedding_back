import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChecklistsAndFillExistingUsers1772797984960 implements MigrationInterface {
  name = 'AddChecklistsAndFillExistingUsers1772797984960';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."checklist_items_priority_enum" AS ENUM('high', 'normal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "checklist_items" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phase_id" uuid NOT NULL, "title" character varying(50) NOT NULL, "note" character varying(50), "comment" character varying(200), "completed" boolean NOT NULL DEFAULT false, "priority" "public"."checklist_items_priority_enum" NOT NULL DEFAULT 'normal', "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_808b68e61e13ea8be943c228704" UNIQUE ("phase_id", "sort_order"), CONSTRAINT "PK_bae00945a1d4789bd648e583e29" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_items_phase" ON "checklist_items" ("phase_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "checklist_phases" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "checklist_id" uuid NOT NULL, "name" character varying(50), "timeline" character varying(50), "icon" character varying(50), "sort_order" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_5366a4673ea91a38341a4ed09f3" UNIQUE ("checklist_id", "sort_order"), CONSTRAINT "PK_2687d74035228b31b02f1e4e5de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_phases_checklist" ON "checklist_phases" ("checklist_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "checklists" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, CONSTRAINT "UQ_c78d42f169177d5a554e85f674d" UNIQUE ("user_id"), CONSTRAINT "REL_c78d42f169177d5a554e85f674" UNIQUE ("user_id"), CONSTRAINT "PK_336ade2047f3d713e1afa20d2c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" ADD CONSTRAINT "FK_ace3defad9aff7a59dfe916e809" FOREIGN KEY ("phase_id") REFERENCES "checklist_phases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_phases" ADD CONSTRAINT "FK_975aa8942f8c387aca7136f08fd" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklists" ADD CONSTRAINT "FK_c78d42f169177d5a554e85f674d" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "checklists" ("user_id") SELECT "id" FROM "Users"`,
    );
    await queryRunner.query(
      `INSERT INTO "checklist_phases" ("checklist_id", "name", "timeline", "icon", "sort_order") SELECT "id", NULL, '12–10 months before', NULL, 0 FROM "checklists"`,
    );
    await queryRunner.query(
      `INSERT INTO "checklist_phases" ("checklist_id", "name", "timeline", "icon", "sort_order") SELECT "id", NULL, '9–7 months before', NULL, 1 FROM "checklists"`,
    );
    await queryRunner.query(
      `INSERT INTO "checklist_phases" ("checklist_id", "name", "timeline", "icon", "sort_order") SELECT "id", NULL, '6–4 months before', NULL, 2 FROM "checklists"`,
    );
    await queryRunner.query(
      `INSERT INTO "checklist_phases" ("checklist_id", "name", "timeline", "icon", "sort_order") SELECT "id", NULL, '3–1 months before', NULL, 3 FROM "checklists"`,
    );
    await queryRunner.query(
      `INSERT INTO "checklist_phases" ("checklist_id", "name", "timeline", "icon", "sort_order") SELECT "id", NULL, 'Last 7 days', NULL, 4 FROM "checklists"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "checklists" DROP CONSTRAINT "FK_c78d42f169177d5a554e85f674d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_phases" DROP CONSTRAINT "FK_975aa8942f8c387aca7136f08fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "checklist_items" DROP CONSTRAINT "FK_ace3defad9aff7a59dfe916e809"`,
    );
    await queryRunner.query(`DROP TABLE "checklists"`);
    await queryRunner.query(`DROP INDEX "public"."idx_phases_checklist"`);
    await queryRunner.query(`DROP TABLE "checklist_phases"`);
    await queryRunner.query(`DROP INDEX "public"."idx_items_phase"`);
    await queryRunner.query(`DROP TABLE "checklist_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."checklist_items_priority_enum"`,
    );
  }
}
