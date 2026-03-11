/**
 * Backfill script to generate studentCode for existing users
 * Run with: node backend/scripts/backfill-student-codes.js
 */

const { User } = require('../src/models');
const { generateStudentCode } = require('../src/utils/generateStudentCode');

const backfillStudentCodes = async () => {
  try {
    console.log('Starting studentCode backfill...');

    // Find all users without a studentCode
    const usersWithoutCode = await User.findAll({
      where: {
        studentCode: null
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'role']
    });

    console.log(`Found ${usersWithoutCode.length} users without studentCode`);

    if (usersWithoutCode.length === 0) {
      console.log('No users need backfilling. All done!');
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const user of usersWithoutCode) {
      try {
        const studentCode = await generateStudentCode();
        await user.update({ studentCode });
        updated++;
        console.log(`✓ Generated ${studentCode} for ${user.firstName} ${user.lastName} (${user.email || user.username || user.id})`);
      } catch (error) {
        failed++;
        console.error(`✗ Failed for user ${user.id}: ${error.message}`);
      }
    }

    console.log('\n=== Backfill Complete ===');
    console.log(`Total users processed: ${usersWithoutCode.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);

    process.exit(0);
  } catch (error) {
    console.error('Backfill script failed:', error);
    process.exit(1);
  }
};

backfillStudentCodes();
