"use strict";

/**
 * Adds columns required by the 2026 auth hardening pass:
 *   - refresh-token rotation with reuse detection
 *   - per-account login throttling/lockout
 *   - server-side OTP resend cooldown + daily cap
 *   - soft-delete (paranoid) for /me account deletion
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("users");

    const addIfMissing = async (name, definition) => {
      if (!table[name]) {
        await queryInterface.addColumn("users", name, definition);
      }
    };

    await addIfMissing("previous_refresh_token", {
      type: Sequelize.STRING,
      allowNull: true
    });
    await addIfMissing("previous_refresh_token_expires", {
      type: Sequelize.DATE,
      allowNull: true
    });

    await addIfMissing("failed_login_attempts", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await addIfMissing("lockout_until", {
      type: Sequelize.DATE,
      allowNull: true
    });

    await addIfMissing("email_verification_last_sent_at", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await addIfMissing("email_verification_resend_count", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await addIfMissing("email_verification_resend_window_started_at", {
      type: Sequelize.DATE,
      allowNull: true
    });

    await addIfMissing("deleted_at", {
      type: Sequelize.DATE,
      allowNull: true
    });
    await addIfMissing("pii_scrubbed_at", {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Helpful index for soft-delete-aware queries.
    const indexes = await queryInterface.showIndex("users").catch(() => []);
    const hasDeletedAtIdx = indexes.some((idx) => idx.name === "users_deleted_at_idx");
    if (!hasDeletedAtIdx) {
      await queryInterface.addIndex("users", ["deleted_at"], {
        name: "users_deleted_at_idx"
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("users");

    const indexes = await queryInterface.showIndex("users").catch(() => []);
    if (indexes.some((idx) => idx.name === "users_deleted_at_idx")) {
      await queryInterface.removeIndex("users", "users_deleted_at_idx");
    }

    const dropIfPresent = async (name) => {
      if (table[name]) {
        await queryInterface.removeColumn("users", name);
      }
    };

    await dropIfPresent("previous_refresh_token");
    await dropIfPresent("previous_refresh_token_expires");
    await dropIfPresent("failed_login_attempts");
    await dropIfPresent("lockout_until");
    await dropIfPresent("email_verification_last_sent_at");
    await dropIfPresent("email_verification_resend_count");
    await dropIfPresent("email_verification_resend_window_started_at");
    await dropIfPresent("deleted_at");
    await dropIfPresent("pii_scrubbed_at");
  }
};
