"use strict";

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "holland_occupations_book.json");

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const rows = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
    const payload = JSON.stringify(rows);

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `
        CREATE TEMP TABLE holland_occupation_import ON COMMIT DROP AS
        SELECT *
        FROM jsonb_to_recordset(CAST(:payload AS jsonb)) AS x(
          name text,
          code text,
          "hollandCodes" text[],
          "primaryRiasec" text,
          "secondaryRiasec" text,
          category text,
          source text,
          "sourceCode" text,
          "consistencyScore" integer
        );
        `,
        { replacements: { payload }, transaction }
      );

      await sequelize.query(
        `
        UPDATE occupations o
        SET
          holland_codes = (
            SELECT ARRAY(
              SELECT DISTINCT code_value
              FROM unnest(
                COALESCE(o.holland_codes, ARRAY[]::text[])
                || COALESCE(i."hollandCodes", ARRAY[]::text[])
                || ARRAY[i.code]
              ) AS code_value
              WHERE code_value IS NOT NULL AND code_value <> ''
              ORDER BY code_value
            )
          ),
          code = CASE
            WHEN o.code IS NULL OR o.code = '' THEN i.code
            ELSE o.code
          END,
          primary_riasec = CASE
            WHEN o.primary_riasec IS NULL OR o.primary_riasec = '' THEN i."primaryRiasec"
            ELSE o.primary_riasec
          END,
          secondary_riasec = CASE
            WHEN o.secondary_riasec IS NULL OR o.secondary_riasec = '' THEN i."secondaryRiasec"
            ELSE o.secondary_riasec
          END,
          category = CASE
            WHEN o.category IS NULL OR o.category IN ('R', 'I', 'A', 'S', 'E', 'C') THEN i.category
            ELSE o.category
          END,
          source = COALESCE(o.source, i.source),
          source_code = COALESCE(o.source_code, i."sourceCode"),
          consistency_score = GREATEST(
            COALESCE(o.consistency_score, 0),
            COALESCE(i."consistencyScore", 0)
          ),
          updated_at = NOW()
        FROM holland_occupation_import i
        WHERE LOWER(o.name) = LOWER(i.name);
        `,
        { transaction }
      );

      await sequelize.query(
        `
        INSERT INTO occupations (
          id,
          code,
          name,
          holland_codes,
          primary_riasec,
          secondary_riasec,
          description,
          category,
          education_level,
          education_required,
          demand_level,
          available_in_eswatini,
          local_demand,
          skills,
          source,
          source_code,
          consistency_score,
          status,
          submitted_by,
          created_at,
          updated_at
        )
        SELECT
          uuid_generate_v4(),
          i.code,
          i.name,
          i."hollandCodes",
          i."primaryRiasec",
          i."secondaryRiasec",
          NULL,
          i.category,
          NULL,
          NULL,
          NULL,
          FALSE,
          NULL,
          NULL,
          i.source,
          i."sourceCode",
          i."consistencyScore",
          'approved',
          NULL,
          NOW(),
          NOW()
        FROM holland_occupation_import i
        WHERE NOT EXISTS (
          SELECT 1
          FROM occupations o
          WHERE LOWER(o.name) = LOWER(i.name)
        );
        `,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM occupations
      WHERE source LIKE 'Dictionary of Holland Occupational Codes (%'
        AND available_in_eswatini = FALSE
        AND submitted_by IS NULL;
    `);
  }
};
