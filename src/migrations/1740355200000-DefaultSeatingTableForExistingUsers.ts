import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultSeatingTableForExistingUsers1740355200000 implements MigrationInterface {
  name = 'DefaultSeatingTableForExistingUsers1740355200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "seating_tables" ("user_id", "name", "position", "shape", "rotation")
      SELECT "id", 'Молодожены', '{"x":10,"y":0}'::jsonb, 'rect', 0
      FROM "Users"
      WHERE "id" NOT IN (SELECT "user_id" FROM "seating_tables")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "seating_tables"
      WHERE "name" = 'Молодожены'
        AND "position" = '{"x":10,"y":0}'::jsonb
        AND "shape" = 'rect'
    `);
  }
}