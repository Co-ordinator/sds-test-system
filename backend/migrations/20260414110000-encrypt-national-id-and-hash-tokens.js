"use strict";

const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getKey = () => {
  const raw = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
  return crypto.createHash("sha256").update(raw).digest();
};

const hashValue = (value) => {
  if (!value) return null;
  return crypto.createHash("sha256").update(String(value)).digest("hex");
};

const encryptValue = (value) => {
  if (!value) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable("users");
    if (!tableDefinition.national_id_hash) {
      await queryInterface.addColumn("users", "national_id_hash", {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    const existingIndexes = await queryInterface.showIndex("users");
    const hasNationalHashIndex = existingIndexes.some((idx) => idx.name === "users_national_id_hash_unique");
    if (!hasNationalHashIndex) {
      await queryInterface.addIndex("users", ["national_id_hash"], {
        unique: true,
        name: "users_national_id_hash_unique"
      });
    }

    await queryInterface.sequelize.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_national_id_key");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS users_national_id_key");
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS users_national_id_hash_key");

    const [users] = await queryInterface.sequelize.query(
      "SELECT id, national_id, refresh_token, password_reset_token, email_verification_token FROM users"
    );

    for (const user of users) {
      const updates = {};
      if (user.national_id && !String(user.national_id).includes(":")) {
        updates.national_id = encryptValue(user.national_id);
        updates.national_id_hash = hashValue(user.national_id);
      } else if (user.national_id && !user.national_id_hash) {
        updates.national_id_hash = hashValue(user.national_id);
      }

      if (user.refresh_token && user.refresh_token.length < 64) {
        updates.refresh_token = hashValue(user.refresh_token);
      }

      if (user.password_reset_token && user.password_reset_token.length < 64) {
        updates.password_reset_token = hashValue(user.password_reset_token);
      }

      if (user.email_verification_token && user.email_verification_token.length < 64) {
        updates.email_verification_token = hashValue(user.email_verification_token);
      }

      if (Object.keys(updates).length > 0) {
        await queryInterface.bulkUpdate("users", updates, { id: user.id });
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("users", "users_national_id_hash_unique");
    await queryInterface.removeColumn("users", "national_id_hash");
    await queryInterface.addIndex("users", ["national_id"], {
      unique: true,
      name: "users_national_id_key"
    });
  }
};
