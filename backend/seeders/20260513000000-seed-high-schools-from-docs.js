"use strict";

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const SOURCE_FILE = path.resolve(__dirname, "../../docs/high_schools_by_region.json");
const REGIONS = ["hhohho", "manzini", "lubombo", "shiselweni"];

const normalizeName = (name = "") => String(name)
  .replace(/\u2019/g, "'")
  .replace(/\s+/g, " ")
  .trim();

const loadSchoolsFromDocs = () => {
  const raw = fs.readFileSync(SOURCE_FILE, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(raw);

  const schools = [];
  const seen = new Set();

  for (const region of REGIONS) {
    const regionSchools = Array.isArray(parsed[region]) ? parsed[region] : [];
    for (const entry of regionSchools) {
      const name = normalizeName(entry);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      schools.push({ name, region });
    }
  }

  return schools;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const schools = loadSchoolsFromDocs();
    const schoolNames = schools.map((school) => school.name);
    const expectedSchoolNameSet = new Set(schoolNames.map((name) => name.toLowerCase()));
    const transaction = await queryInterface.sequelize.transaction();

    try {
      let archivedDuplicateRows = 0;

      for (const school of schools) {
        const existingSchool = await queryInterface.sequelize.query(
          "SELECT id FROM institutions WHERE LOWER(name) = LOWER(:name) LIMIT 1",
          {
            type: Sequelize.QueryTypes.SELECT,
            replacements: {
              name: school.name
            },
            transaction
          }
        );

        if (existingSchool.length > 0) {
          await queryInterface.bulkUpdate(
            "institutions",
            {
              name: school.name,
              type: "school",
              region: school.region,
              status: "approved",
              updated_at: now
            },
            { id: existingSchool[0].id },
            { transaction }
          );
        } else {
          await queryInterface.bulkInsert(
            "institutions",
            [{
              id: uuidv4(),
              name: school.name,
              type: "school",
              region: school.region,
              status: "approved",
              accredited: true,
              bursaries_available: false,
              created_at: now,
              updated_at: now
            }],
            { transaction }
          );
        }
      }

      const duplicateGroups = await queryInterface.sequelize.query(
        `
          SELECT LOWER(name) AS normalized_name, ARRAY_AGG(id ORDER BY created_at ASC) AS ids
          FROM institutions
          WHERE type = 'school'
          GROUP BY LOWER(name)
          HAVING COUNT(*) > 1
        `,
        {
          type: Sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      for (const group of duplicateGroups) {
        const ids = Array.isArray(group.ids) ? group.ids : [];
        if (ids.length < 2) continue;

        const keepId = ids[0];
        const duplicateIds = ids.slice(1);
        archivedDuplicateRows += duplicateIds.length;

        await queryInterface.bulkUpdate(
          "users",
          { institution_id: keepId },
          { institution_id: { [Sequelize.Op.in]: duplicateIds } },
          { transaction }
        );

        await queryInterface.bulkUpdate(
          "users",
          { workplace_institution_id: keepId },
          { workplace_institution_id: { [Sequelize.Op.in]: duplicateIds } },
          { transaction }
        );

        await queryInterface.bulkUpdate(
          "school_students",
          { institution_id: keepId },
          { institution_id: { [Sequelize.Op.in]: duplicateIds } },
          { transaction }
        );

        await queryInterface.bulkUpdate(
          "institutions",
          { type: "other", region: null, updated_at: now },
          { id: { [Sequelize.Op.in]: duplicateIds } },
          { transaction }
        );
      }

      const [currentSchools] = await queryInterface.sequelize.query(
        "SELECT id, name FROM institutions WHERE type = 'school'",
        { transaction }
      );

      const obsoleteSchoolIds = currentSchools
        .filter((school) => !expectedSchoolNameSet.has(String(school.name || "").toLowerCase()))
        .map((school) => school.id);

      if (obsoleteSchoolIds.length > 0) {
        await queryInterface.bulkUpdate(
          "institutions",
          { type: "other", region: null, updated_at: now },
          { id: { [Sequelize.Op.in]: obsoleteSchoolIds } },
          { transaction }
        );
      }

      console.log(
        `Seeded ${schools.length} high schools from docs, archived ${archivedDuplicateRows} duplicate school rows, and archived ${obsoleteSchoolIds.length} obsolete school placeholders.`
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const schools = loadSchoolsFromDocs();
    const schoolNames = schools.map((school) => school.name);

    await queryInterface.bulkUpdate(
      "institutions",
      { type: "other", region: null, updated_at: new Date() },
      { name: { [Sequelize.Op.in]: schoolNames }, type: "school" }
    );
  }
};
