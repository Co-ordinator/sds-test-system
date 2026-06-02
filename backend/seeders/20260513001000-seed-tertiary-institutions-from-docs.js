"use strict";

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const SOURCE_FILE = path.resolve(__dirname, "../../docs/tertiary_institutions.json");
const VALID_REGIONS = new Set(["hhohho", "manzini", "lubombo", "shiselweni", "multiple"]);
const TERTIARY_TYPES = ["university", "college", "tvet", "vocational"];

const normalizeDisplayName = (name = "") => String(name)
  .replace(/\u2019/g, "'")
  .replace(/[\u2013\u2014]/g, "-")
  .replace(/\s+/g, " ")
  .trim();

const normalizeLookup = (name = "") => normalizeDisplayName(name).toLowerCase();

const loadTertiaryFromDocs = () => {
  const raw = fs.readFileSync(SOURCE_FILE, "utf8").replace(/^\uFEFF/, "");
  const parsed = JSON.parse(raw);
  const canonicalByName = new Map();

  for (const [regionKey, rows] of Object.entries(parsed || {})) {
    const fallbackRegion = String(regionKey || "").trim().toLowerCase();
    const region = VALID_REGIONS.has(fallbackRegion) ? fallbackRegion : "multiple";
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      if (!row || typeof row !== "object") continue;

      const name = normalizeDisplayName(row.name || "");
      if (!name) continue;

      const type = TERTIARY_TYPES.includes(String(row.type || "").toLowerCase())
        ? String(row.type).toLowerCase()
        : "college";
      const explicitRegion = String(row.region || "").trim().toLowerCase();
      const finalRegion = VALID_REGIONS.has(explicitRegion) ? explicitRegion : region;
      const aliases = Array.isArray(row.aliases)
        ? [...new Set(row.aliases.map((alias) => normalizeDisplayName(alias)).filter(Boolean))]
        : [];

      const key = normalizeLookup(name);
      if (!canonicalByName.has(key)) {
        canonicalByName.set(key, { name, type, region: finalRegion, aliases });
        continue;
      }

      const existing = canonicalByName.get(key);
      if (existing.region !== finalRegion) {
        existing.region = "multiple";
      }
      existing.aliases = [...new Set([...existing.aliases, ...aliases])];
    }
  }

  return Array.from(canonicalByName.values());
};

const buildLookupMap = (rows = []) => {
  const map = new Map();
  for (const row of rows) {
    const key = normalizeLookup(row.name);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
};

const findExistingInstitution = (lookupMap, usedIds, entry) => {
  const keys = [...new Set([entry.name, ...(entry.aliases || [])]
    .map((item) => normalizeLookup(item))
    .filter(Boolean))];

  for (const key of keys) {
    const matches = lookupMap.get(key) || [];
    const candidate = matches.find((item) => !usedIds.has(item.id));
    if (candidate) return candidate;
  }
  return null;
};

const remapInstitutionReferences = async (queryInterface, Sequelize, fromIds, toId, transaction) => {
  if (!Array.isArray(fromIds) || fromIds.length === 0) return;

  await queryInterface.bulkUpdate(
    "users",
    { institution_id: toId },
    { institution_id: { [Sequelize.Op.in]: fromIds } },
    { transaction }
  );

  await queryInterface.bulkUpdate(
    "users",
    { workplace_institution_id: toId },
    { workplace_institution_id: { [Sequelize.Op.in]: fromIds } },
    { transaction }
  );

  await queryInterface.bulkUpdate(
    "school_students",
    { institution_id: toId },
    { institution_id: { [Sequelize.Op.in]: fromIds } },
    { transaction }
  );

  await queryInterface.sequelize.query(
    `
      DELETE FROM course_institutions ci
      USING course_institutions keep
      WHERE ci.course_id = keep.course_id
        AND keep.institution_id = :toId
        AND ci.institution_id IN (:fromIds)
    `,
    {
      replacements: { toId, fromIds },
      transaction
    }
  );

  await queryInterface.bulkUpdate(
    "course_institutions",
    { institution_id: toId, updated_at: new Date() },
    { institution_id: { [Sequelize.Op.in]: fromIds } },
    { transaction }
  );
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const entries = loadTertiaryFromDocs();
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [institutions] = await queryInterface.sequelize.query(
        "SELECT id, name, type, region, created_at FROM institutions ORDER BY created_at ASC",
        { transaction }
      );

      const lookupMap = buildLookupMap(institutions);
      const usedIds = new Set();
      const canonicalIds = new Set();
      let inserted = 0;
      let updated = 0;

      for (const entry of entries) {
        const existing = findExistingInstitution(lookupMap, usedIds, entry);

        if (existing) {
          await queryInterface.bulkUpdate(
            "institutions",
            {
              name: entry.name,
              type: entry.type,
              region: entry.region,
              status: "approved",
              updated_at: now
            },
            { id: existing.id },
            { transaction }
          );
          usedIds.add(existing.id);
          canonicalIds.add(existing.id);
          updated += 1;
        } else {
          const id = uuidv4();
          await queryInterface.bulkInsert(
            "institutions",
            [{
              id,
              name: entry.name,
              type: entry.type,
              region: entry.region,
              status: "approved",
              accredited: true,
              bursaries_available: false,
              created_at: now,
              updated_at: now
            }],
            { transaction }
          );
          canonicalIds.add(id);
          inserted += 1;
        }
      }

      const [duplicateGroups] = await queryInterface.sequelize.query(
        `
          SELECT LOWER(name) AS normalized_name, ARRAY_AGG(id ORDER BY created_at ASC) AS ids
          FROM institutions
          WHERE type IN (:types)
          GROUP BY LOWER(name)
          HAVING COUNT(*) > 1
        `,
        {
          replacements: { types: TERTIARY_TYPES },
          transaction
        }
      );

      let archivedDuplicates = 0;
      for (const group of duplicateGroups) {
        const ids = Array.isArray(group.ids) ? group.ids : [];
        if (ids.length < 2) continue;

        const keepId = ids.find((id) => canonicalIds.has(id)) || ids[0];
        const duplicateIds = ids.filter((id) => id !== keepId);
        if (duplicateIds.length === 0) continue;

        await remapInstitutionReferences(queryInterface, Sequelize, duplicateIds, keepId, transaction);
        await queryInterface.bulkUpdate(
          "institutions",
          { type: "other", region: null, updated_at: now },
          { id: { [Sequelize.Op.in]: duplicateIds } },
          { transaction }
        );
        archivedDuplicates += duplicateIds.length;
      }

      const [activeTertiaryRows] = await queryInterface.sequelize.query(
        "SELECT id FROM institutions WHERE type IN (:types)",
        {
          replacements: { types: TERTIARY_TYPES },
          transaction
        }
      );

      const obsoleteIds = activeTertiaryRows
        .map((row) => row.id)
        .filter((id) => !canonicalIds.has(id));

      if (obsoleteIds.length > 0) {
        await queryInterface.bulkUpdate(
          "institutions",
          { type: "other", region: null, updated_at: now },
          { id: { [Sequelize.Op.in]: obsoleteIds } },
          { transaction }
        );
      }

      console.log(
        `Seeded tertiary institutions from docs: ${entries.length} canonical rows (${updated} updated, ${inserted} inserted), archived ${archivedDuplicates} duplicates, archived ${obsoleteIds.length} obsolete tertiary placeholders.`
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const entries = loadTertiaryFromDocs();
    const names = entries.map((entry) => entry.name);
    await queryInterface.bulkUpdate(
      "institutions",
      { type: "other", region: null, updated_at: new Date() },
      { name: { [Sequelize.Op.in]: names }, type: { [Sequelize.Op.in]: TERTIARY_TYPES } }
    );
  }
};
