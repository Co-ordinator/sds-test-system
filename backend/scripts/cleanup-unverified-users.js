/**
 * cleanup-unverified-users.js
 *
 * Deletes self-registered Test Taker accounts that never completed email
 * verification within the retention window. Intended to be run on a daily
 * cron. Defaults to a 7-day retention.
 *
 * Usage:
 *   node scripts/cleanup-unverified-users.js                # delete now
 *   UNVERIFIED_RETENTION_DAYS=14 node scripts/cleanup-unverified-users.js
 *   node scripts/cleanup-unverified-users.js --dry-run      # log only
 *
 * Cron example (daily at 03:15):
 *   15 3 * * * cd /path/to/backend && node scripts/cleanup-unverified-users.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Op } = require('sequelize');
const sequelize = require('../src/config/database.config');

const parseRetentionDays = () => {
  const raw = Number.parseInt(process.env.UNVERIFIED_RETENTION_DAYS, 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 7;
};

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  const retentionDays = parseRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   SDS TEST SYSTEM — UNVERIFIED CLEANUP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`Retention: ${retentionDays} day(s)`);
  console.log(`Cutoff (UTC): ${cutoff.toISOString()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no deletes)' : 'DELETE'}\n`);

  // Use console for the human-readable run log; pipe everything through the
  // structured app logger as well so cron output is searchable in the
  // unified log stream (and in the audit_logs table via the DB transport).
  let logger;
  try { logger = require('../src/utils/logger'); }
  catch (_) { logger = null; }

  const auditLogger = (level, message, details = {}) => {
    if (!logger) return;
    try {
      logger.log({
        level,
        actionType: 'SYSTEM',
        message,
        details
      });
    } catch (_) {}
  };

  try {
    await sequelize.authenticate();

    // Load models (also wires associations so destroy cascades work).
    require('../src/models');
    const { User } = require('../src/models');

    const where = {
      isEmailVerified: false,
      createdByTestAdministrator: false,
      email: { [Op.ne]: null },
      createdAt: { [Op.lt]: cutoff }
    };

    const targets = await User.findAll({
      where,
      attributes: ['id', 'email', 'createdAt'],
      order: [['createdAt', 'ASC']]
    });

    if (targets.length === 0) {
      console.log('✅ No stale unverified accounts found.\n');
      auditLogger('info', 'Unverified-account cleanup: nothing to do', { retentionDays, cutoff: cutoff.toISOString(), dryRun });
      return;
    }

    console.log(`Found ${targets.length} stale unverified account(s):`);
    for (const u of targets) {
      console.log(`  • ${u.email} (id=${u.id}, registered=${u.createdAt.toISOString()})`);
    }
    console.log('');

    if (dryRun) {
      console.log('Dry run complete — no rows deleted.\n');
      auditLogger('info', 'Unverified-account cleanup: dry run', {
        retentionDays,
        cutoff: cutoff.toISOString(),
        candidateCount: targets.length
      });
      return;
    }

    // `force: true` hard-deletes the row even though the model is paranoid —
    // stale unverified accounts never proved they're a real person and
    // there's no PII retention value in keeping them.
    const deleted = await User.destroy({ where, force: true });
    console.log(`🗑️  Deleted ${deleted} stale unverified account(s).\n`);
    auditLogger('info', 'Unverified-account cleanup: deleted stale accounts', {
      retentionDays,
      cutoff: cutoff.toISOString(),
      deletedCount: deleted
    });
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    console.error(err.stack);
    auditLogger('error', 'Unverified-account cleanup failed', {
      retentionDays,
      cutoff: cutoff.toISOString(),
      error: err.message
    });
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

run();
