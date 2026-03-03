import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBudgetEntitySectionsSectionItems1772542019541 implements MigrationInterface {
    name = 'AddBudgetEntitySectionsSectionItems1772542019541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."budget_items_priority_enum" AS ENUM('must', 'want', 'maybe')`);
        await queryRunner.query(`CREATE TABLE "budget_items" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "sectionId" integer NOT NULL, "name" character varying(50) NOT NULL, "estimatedCost" integer NOT NULL DEFAULT '0', "actualCost" integer, "priority" "public"."budget_items_priority_enum" NOT NULL DEFAULT 'must', "paid" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_9eb705f406c83a1167ef575cd7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "budget_sections" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "budgetId" integer NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "UQ_bd742c3df28771d78d696762a33" UNIQUE ("budgetId", "name"), CONSTRAINT "PK_517fee6be43c04442d74b3cd615" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."budgets_currency_enum" AS ENUM('RUB', 'USD', 'BYN')`);
        await queryRunner.query(`CREATE TABLE "budgets" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "userId" integer NOT NULL, "budgetLimit" integer NOT NULL DEFAULT '0', "currency" "public"."budgets_currency_enum" NOT NULL DEFAULT 'RUB', CONSTRAINT "UQ_27e688ddf1ff3893b43065899f9" UNIQUE ("userId"), CONSTRAINT "REL_27e688ddf1ff3893b43065899f" UNIQUE ("userId"), CONSTRAINT "PK_9c8a51748f82387644b773da482" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "budget_items" ADD CONSTRAINT "FK_8a708ce350bfd459f14f322724d" FOREIGN KEY ("sectionId") REFERENCES "budget_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budget_sections" ADD CONSTRAINT "FK_0f2ee3c54b8774114dc809e3a1b" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_27e688ddf1ff3893b43065899f9" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`INSERT INTO "budgets" ("userId", "budgetLimit", "currency") SELECT "id", 0, 'RUB' FROM "Users"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_27e688ddf1ff3893b43065899f9"`);
        await queryRunner.query(`ALTER TABLE "budget_sections" DROP CONSTRAINT "FK_0f2ee3c54b8774114dc809e3a1b"`);
        await queryRunner.query(`ALTER TABLE "budget_items" DROP CONSTRAINT "FK_8a708ce350bfd459f14f322724d"`);
        await queryRunner.query(`DROP TABLE "budgets"`);
        await queryRunner.query(`DROP TYPE "public"."budgets_currency_enum"`);
        await queryRunner.query(`DROP TABLE "budget_sections"`);
        await queryRunner.query(`DROP TABLE "budget_items"`);
        await queryRunner.query(`DROP TYPE "public"."budget_items_priority_enum"`);
    }

}
