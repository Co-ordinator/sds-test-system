"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `
        DROP TABLE IF EXISTS course_dedupe_map;

        CREATE TEMP TABLE course_dedupe_map ON COMMIT DROP AS
        WITH related_counts AS (
          SELECT
            c.id,
            c.name,
            c.created_at,
            c.updated_at,
            COALESCE(cr.cnt, 0) AS requirement_count,
            COALESCE(ci.cnt, 0) AS institution_count,
            COALESCE(oc.cnt, 0) AS occupation_count
          FROM courses c
          LEFT JOIN (
            SELECT course_id, COUNT(*) AS cnt
            FROM course_requirements
            GROUP BY course_id
          ) cr ON cr.course_id = c.id
          LEFT JOIN (
            SELECT course_id, COUNT(*) AS cnt
            FROM course_institutions
            GROUP BY course_id
          ) ci ON ci.course_id = c.id
          LEFT JOIN (
            SELECT course_id, COUNT(*) AS cnt
            FROM occupation_courses
            GROUP BY course_id
          ) oc ON oc.course_id = c.id
        ),
        ranked AS (
          SELECT
            *,
            FIRST_VALUE(id) OVER (
              PARTITION BY name
              ORDER BY
                (requirement_count + institution_count + occupation_count) DESC,
                updated_at DESC NULLS LAST,
                created_at ASC,
                id ASC
            ) AS keep_id
          FROM related_counts
        )
        SELECT id AS duplicate_id, keep_id
        FROM ranked
        WHERE id <> keep_id;
        `,
        { transaction }
      );

      await sequelize.query(
        `
        UPDATE courses keep
        SET
          name_swati = COALESCE((
            SELECT x.name_swati
            FROM courses x
            WHERE x.name = keep.name AND NULLIF(x.name_swati, '') IS NOT NULL
            ORDER BY x.updated_at DESC NULLS LAST, x.created_at DESC
            LIMIT 1
          ), keep.name_swati),
          qualification_type = COALESCE((
            SELECT x.qualification_type
            FROM courses x
            WHERE x.name = keep.name
            ORDER BY x.updated_at DESC NULLS LAST, x.created_at DESC
            LIMIT 1
          ), keep.qualification_type),
          duration_years = COALESCE((
            SELECT x.duration_years
            FROM courses x
            WHERE x.name = keep.name AND x.duration_years IS NOT NULL
            ORDER BY x.updated_at DESC NULLS LAST, x.created_at DESC
            LIMIT 1
          ), keep.duration_years),
          description = COALESCE((
            SELECT x.description
            FROM courses x
            WHERE x.name = keep.name AND NULLIF(x.description, '') IS NOT NULL
            ORDER BY x.updated_at DESC NULLS LAST, x.created_at DESC
            LIMIT 1
          ), keep.description),
          riasec_codes = COALESCE((
            SELECT x.riasec_codes
            FROM courses x
            WHERE x.name = keep.name AND array_length(x.riasec_codes, 1) IS NOT NULL
            ORDER BY x.updated_at DESC NULLS LAST, x.created_at DESC
            LIMIT 1
          ), keep.riasec_codes),
          suggested_subjects = COALESCE((
            SELECT x.suggested_subjects
            FROM courses x
            WHERE x.name = keep.name AND array_length(x.suggested_subjects, 1) IS NOT NULL
            ORDER BY x.updated_at DESC NULLS LAST, x.created_at DESC
            LIMIT 1
          ), keep.suggested_subjects),
          field_of_study = COALESCE((
            SELECT x.field_of_study
            FROM courses x
            WHERE x.name = keep.name AND NULLIF(x.field_of_study, '') IS NOT NULL
            ORDER BY x.updated_at DESC NULLS LAST, x.created_at DESC
            LIMIT 1
          ), keep.field_of_study),
          funding_priority = (
            SELECT BOOL_OR(x.funding_priority)
            FROM courses x
            WHERE x.name = keep.name
          ),
          is_active = (
            SELECT BOOL_OR(x.is_active)
            FROM courses x
            WHERE x.name = keep.name
          ),
          updated_at = NOW()
        WHERE keep.id IN (SELECT keep_id FROM course_dedupe_map);
        `,
        { transaction }
      );

      await sequelize.query(
        `
        WITH source_requirements AS (
          SELECT DISTINCT ON (m.keep_id, cr.subject)
            m.keep_id,
            cr.subject,
            cr.minimum_grade,
            cr.is_mandatory,
            cr.created_at
          FROM course_requirements cr
          JOIN course_dedupe_map m ON m.duplicate_id = cr.course_id
          WHERE NOT EXISTS (
            SELECT 1
            FROM course_requirements existing
            WHERE existing.course_id = m.keep_id
              AND existing.subject = cr.subject
          )
          ORDER BY
            m.keep_id,
            cr.subject,
            cr.is_mandatory DESC,
            cr.updated_at DESC NULLS LAST,
            cr.created_at ASC
        )
        INSERT INTO course_requirements (
          id,
          course_id,
          subject,
          minimum_grade,
          is_mandatory,
          created_at,
          updated_at
        )
        SELECT
          uuid_generate_v4(),
          keep_id,
          subject,
          minimum_grade,
          is_mandatory,
          created_at,
          NOW()
        FROM source_requirements;
        `,
        { transaction }
      );

      await sequelize.query(
        `
        WITH source_institutions AS (
          SELECT DISTINCT ON (m.keep_id, ci.institution_id)
            m.keep_id,
            ci.institution_id,
            ci.custom_requirements,
            ci.application_url,
            ci.is_active,
            ci.created_at
          FROM course_institutions ci
          JOIN course_dedupe_map m ON m.duplicate_id = ci.course_id
          WHERE NOT EXISTS (
            SELECT 1
            FROM course_institutions existing
            WHERE existing.course_id = m.keep_id
              AND existing.institution_id = ci.institution_id
          )
          ORDER BY
            m.keep_id,
            ci.institution_id,
            ci.is_active DESC,
            ci.updated_at DESC NULLS LAST,
            ci.created_at ASC
        )
        INSERT INTO course_institutions (
          id,
          course_id,
          institution_id,
          custom_requirements,
          application_url,
          is_active,
          created_at,
          updated_at
        )
        SELECT
          uuid_generate_v4(),
          keep_id,
          institution_id,
          custom_requirements,
          application_url,
          is_active,
          created_at,
          NOW()
        FROM source_institutions;
        `,
        { transaction }
      );

      await sequelize.query(
        `
        WITH source_occupations AS (
          SELECT DISTINCT ON (m.keep_id, oc.occupation_id)
            m.keep_id,
            oc.occupation_id,
            oc.relevance_score,
            oc.is_primary_pathway,
            oc.notes,
            oc.created_at
          FROM occupation_courses oc
          JOIN course_dedupe_map m ON m.duplicate_id = oc.course_id
          WHERE NOT EXISTS (
            SELECT 1
            FROM occupation_courses existing
            WHERE existing.course_id = m.keep_id
              AND existing.occupation_id = oc.occupation_id
          )
          ORDER BY
            m.keep_id,
            oc.occupation_id,
            oc.is_primary_pathway DESC,
            oc.relevance_score DESC NULLS LAST,
            oc.updated_at DESC NULLS LAST,
            oc.created_at ASC
        )
        INSERT INTO occupation_courses (
          id,
          occupation_id,
          course_id,
          relevance_score,
          is_primary_pathway,
          notes,
          created_at,
          updated_at
        )
        SELECT
          uuid_generate_v4(),
          occupation_id,
          keep_id,
          relevance_score,
          is_primary_pathway,
          notes,
          created_at,
          NOW()
        FROM source_occupations;
        `,
        { transaction }
      );

      await sequelize.query(
        `
        DELETE FROM course_requirements
        WHERE course_id IN (SELECT duplicate_id FROM course_dedupe_map);

        DELETE FROM course_institutions
        WHERE course_id IN (SELECT duplicate_id FROM course_dedupe_map);

        DELETE FROM occupation_courses
        WHERE course_id IN (SELECT duplicate_id FROM course_dedupe_map);

        DELETE FROM courses
        WHERE id IN (SELECT duplicate_id FROM course_dedupe_map);
        `,
        { transaction }
      );

      await sequelize.query(
        `
        DELETE FROM course_requirements cr
        USING course_requirements older
        WHERE cr.course_id = older.course_id
          AND cr.subject = older.subject
          AND cr.id <> older.id
          AND (
            cr.created_at > older.created_at
            OR (cr.created_at = older.created_at AND cr.id::text > older.id::text)
          );
        `,
        { transaction }
      );

      await sequelize.query(
        `
        CREATE UNIQUE INDEX IF NOT EXISTS courses_name_unique
          ON courses (name);

        CREATE UNIQUE INDEX IF NOT EXISTS course_requirements_course_subject_unique
          ON course_requirements (course_id, subject);
        `,
        { transaction }
      );
    });
  },

  async down() {
    // Data cleanup is intentionally irreversible. The unique indexes are part of
    // the intended schema, so this migration does not remove them on rollback.
  }
};
