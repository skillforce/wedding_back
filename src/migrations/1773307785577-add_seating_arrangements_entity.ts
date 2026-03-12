import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSeatingArrangementsEntity1773307785577 implements MigrationInterface {
    name = 'AddSeatingArrangementsEntity1773307785577'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop old FK seating_tables.user_id -> Users
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP CONSTRAINT "FK_9bbd9bef65ff83addc02595676a"`);

        // 2. Create seating_arrangements table
        await queryRunner.query(`CREATE TABLE "seating_arrangements" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" integer NOT NULL, "shape" character varying(16) NOT NULL DEFAULT 'rect', "width" integer NOT NULL DEFAULT '1600', "height" integer NOT NULL DEFAULT '900', "max_tables_amount" integer NOT NULL DEFAULT '20', "max_seats_per_table_amount" integer NOT NULL DEFAULT '20', CONSTRAINT "UQ_f011196474ae7eb4ae8c9d783cb" UNIQUE ("user_id"), CONSTRAINT "CHK_b6f0cb605aa6e4f47ceb0ad6b9" CHECK ("max_seats_per_table_amount" >= 1 AND "max_seats_per_table_amount" <= 30), CONSTRAINT "CHK_1f0357539a5c363ed42b6987cd" CHECK ("max_tables_amount" >= 1 AND "max_tables_amount" <= 40), CONSTRAINT "PK_6c1213afdb978c4e0f4cbbe2713" PRIMARY KEY ("id"))`);

        // 3. Create a default arrangement for every existing user
        await queryRunner.query(`INSERT INTO "seating_arrangements" ("user_id") SELECT "id" FROM "Users"`);

        // 4. Add arrangement_id column as nullable first
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "arrangement_id" uuid`);

        // 5. Populate arrangement_id from the existing user_id via seating_arrangements
        await queryRunner.query(`UPDATE "seating_tables" st SET "arrangement_id" = sa."id" FROM "seating_arrangements" sa WHERE sa."user_id" = st."user_id"`);

        // 6. Make arrangement_id NOT NULL and drop the old user_id column
        await queryRunner.query(`ALTER TABLE "seating_tables" ALTER COLUMN "arrangement_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "user_id"`);

        // 7. Add FKs
        await queryRunner.query(`ALTER TABLE "seating_arrangements" ADD CONSTRAINT "FK_f011196474ae7eb4ae8c9d783cb" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD CONSTRAINT "FK_489cec0622501725a133acf533b" FOREIGN KEY ("arrangement_id") REFERENCES "seating_arrangements"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Drop FKs
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP CONSTRAINT "FK_489cec0622501725a133acf533b"`);
        await queryRunner.query(`ALTER TABLE "seating_arrangements" DROP CONSTRAINT "FK_f011196474ae7eb4ae8c9d783cb"`);

        // 2. Add user_id back as nullable first
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD "user_id" integer`);

        // 3. Restore user_id from seating_arrangements
        await queryRunner.query(`UPDATE "seating_tables" st SET "user_id" = sa."user_id" FROM "seating_arrangements" sa WHERE sa."id" = st."arrangement_id"`);

        // 4. Make user_id NOT NULL and drop arrangement_id
        await queryRunner.query(`ALTER TABLE "seating_tables" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "seating_tables" DROP COLUMN "arrangement_id"`);

        // 5. Drop seating_arrangements table
        await queryRunner.query(`DROP TABLE "seating_arrangements"`);

        // 6. Restore original FK
        await queryRunner.query(`ALTER TABLE "seating_tables" ADD CONSTRAINT "FK_9bbd9bef65ff83addc02595676a" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
