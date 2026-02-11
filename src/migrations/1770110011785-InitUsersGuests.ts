import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUsersGuests1770110011785 implements MigrationInterface {
  name = 'InitUsersGuests1770110011785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "Users" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "id" SERIAL NOT NULL,
                "login" character varying NOT NULL,
                "passwordHash" character varying NOT NULL,
                CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "Guests" (
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), 
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "guest_name" character varying NOT NULL,
                "preferred_drinks" text array NOT NULL,
                "other_preferences" character varying,
                CONSTRAINT "PK_3a0fee9819ab35f614faa7e01b3" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "Guests"
            ADD CONSTRAINT "FK_b8fe49cf982612a99ac1e26b0d1" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "Guests" DROP CONSTRAINT "FK_b8fe49cf982612a99ac1e26b0d1"
        `);
    await queryRunner.query(`
            DROP TABLE "Guests"
        `);
    await queryRunner.query(`
            DROP TABLE "Users"
        `);
  }
}
