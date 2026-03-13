'use strict';

const { v4: uuidv4 } = require('uuid');
const now = new Date();

/**
 * Granular Permissions Seeder
 * Seeds all permissions and assigns full permissions to existing admin users.
 * Default permissions for test_administrator role are also assigned.
 */

const PERMISSIONS = [
  // Users
  { code: 'users.view', name: 'View Users', description: 'View all users list', module: 'users' },
  { code: 'users.create', name: 'Create Users', description: 'Create new user accounts', module: 'users' },
  { code: 'users.update', name: 'Update Users', description: 'Edit user details and roles', module: 'users' },
  { code: 'users.delete', name: 'Delete Users', description: 'Delete user accounts', module: 'users' },
  { code: 'users.export', name: 'Export Users', description: 'Export user data to CSV', module: 'users' },

  // Institutions
  { code: 'institutions.view', name: 'View Institutions', description: 'View institution list', module: 'institutions' },
  { code: 'institutions.create', name: 'Create Institutions', description: 'Add new institutions', module: 'institutions' },
  { code: 'institutions.update', name: 'Update Institutions', description: 'Edit institution details', module: 'institutions' },
  { code: 'institutions.delete', name: 'Delete Institutions', description: 'Remove institutions', module: 'institutions' },
  { code: 'institutions.export', name: 'Export Institutions', description: 'Export institution data', module: 'institutions' },
  { code: 'institutions.import', name: 'Import Institutions', description: 'Bulk import institutions', module: 'institutions' },

  // Questions
  { code: 'questions.view', name: 'View Questions', description: 'View question bank', module: 'questions' },
  { code: 'questions.create', name: 'Create Questions', description: 'Add new questions', module: 'questions' },
  { code: 'questions.update', name: 'Update Questions', description: 'Edit questions', module: 'questions' },
  { code: 'questions.delete', name: 'Delete Questions', description: 'Remove questions', module: 'questions' },
  { code: 'questions.export', name: 'Export Questions', description: 'Export questions to CSV', module: 'questions' },
  { code: 'questions.import', name: 'Import Questions', description: 'Bulk import questions', module: 'questions' },

  // Occupations
  { code: 'occupations.view', name: 'View Occupations', description: 'View occupation list', module: 'occupations' },
  { code: 'occupations.create', name: 'Create Occupations', description: 'Add new occupations', module: 'occupations' },
  { code: 'occupations.update', name: 'Update Occupations', description: 'Edit occupation details', module: 'occupations' },
  { code: 'occupations.delete', name: 'Delete Occupations', description: 'Remove occupations', module: 'occupations' },
  { code: 'occupations.export', name: 'Export Occupations', description: 'Export occupations to CSV', module: 'occupations' },
  { code: 'occupations.import', name: 'Import Occupations', description: 'Bulk import occupations', module: 'occupations' },

  // Subjects
  { code: 'subjects.view', name: 'View Subjects', description: 'View subjects list', module: 'subjects' },
  { code: 'subjects.create', name: 'Create Subjects', description: 'Add new subjects', module: 'subjects' },
  { code: 'subjects.update', name: 'Update Subjects', description: 'Edit subjects', module: 'subjects' },
  { code: 'subjects.delete', name: 'Delete Subjects', description: 'Remove subjects', module: 'subjects' },
  { code: 'subjects.export', name: 'Export Subjects', description: 'Export subjects data', module: 'subjects' },
  { code: 'subjects.import', name: 'Import Subjects', description: 'Bulk import subjects', module: 'subjects' },

  // Courses
  { code: 'courses.view', name: 'View Courses', description: 'View courses and programmes', module: 'courses' },
  { code: 'courses.create', name: 'Create Courses', description: 'Add new courses', module: 'courses' },
  { code: 'courses.update', name: 'Update Courses', description: 'Edit course details', module: 'courses' },
  { code: 'courses.delete', name: 'Delete Courses', description: 'Remove courses', module: 'courses' },
  { code: 'courses.export', name: 'Export Courses', description: 'Export courses data', module: 'courses' },
  { code: 'courses.import', name: 'Import Courses', description: 'Bulk import courses', module: 'courses' },

  // Assessments
  { code: 'assessments.view', name: 'View Assessments', description: 'View all assessments', module: 'assessments' },
  { code: 'assessments.export', name: 'Export Assessments', description: 'Export assessment data', module: 'assessments' },

  // Results
  { code: 'results.view', name: 'View Results', description: 'View test results', module: 'results' },
  { code: 'results.export', name: 'Export Results', description: 'Export results data', module: 'results' },
  { code: 'results.download_pdf', name: 'Download PDF Results', description: 'Download PDF reports', module: 'results' },

  // Analytics
  { code: 'analytics.view', name: 'View Analytics', description: 'Access analytics dashboards', module: 'analytics' },
  { code: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data', module: 'analytics' },

  // Audit
  { code: 'audit.view', name: 'View Audit Logs', description: 'View system audit trail', module: 'audit' },

  // Notifications
  { code: 'notifications.view', name: 'View Notifications', description: 'View notifications', module: 'notifications' },
  { code: 'notifications.manage', name: 'Manage Notifications', description: 'Mark notifications as read', module: 'notifications' },

  // Certificates
  { code: 'certificates.view', name: 'View Certificates', description: 'View certificates list', module: 'certificates' },
  { code: 'certificates.generate', name: 'Generate Certificates', description: 'Generate new certificates', module: 'certificates' },
  { code: 'certificates.download', name: 'Download Certificates', description: 'Download certificates', module: 'certificates' },

  // Permissions (meta)
  { code: 'permissions.view', name: 'View Permissions', description: 'View permissions list', module: 'permissions' },
  { code: 'permissions.manage', name: 'Manage Permissions', description: 'Assign/revoke user permissions', module: 'permissions' },

  // Test Takers (counselor-level management)
  { code: 'test_takers.view', name: 'View Test Takers', description: 'View test taker list', module: 'test_takers' },
  { code: 'test_takers.create', name: 'Create Test Takers', description: 'Create test taker accounts', module: 'test_takers' },
  { code: 'test_takers.import', name: 'Import Test Takers', description: 'Bulk import test takers via CSV', module: 'test_takers' },
  { code: 'test_takers.manage', name: 'Manage Test Takers', description: 'Edit and manage test taker data', module: 'test_takers' },
  { code: 'test_takers.login_cards', name: 'Generate Login Cards', description: 'Generate PDF login cards for test takers', module: 'test_takers' },
];

// Permissions granted to test_administrator role by default
const TEST_ADMIN_DEFAULT_CODES = [
  'users.view',
  'test_takers.view', 'test_takers.create', 'test_takers.import', 'test_takers.manage', 'test_takers.login_cards',
  'results.view', 'results.export', 'results.download_pdf',
  'assessments.view',
  'institutions.view',
  'analytics.view',
  'notifications.view', 'notifications.manage',
  'certificates.view', 'certificates.download',
  'courses.view',
];

module.exports = {
  async up(queryInterface) {
    // 1. Insert all permissions
    const permRows = PERMISSIONS.map(p => ({
      id: uuidv4(),
      code: p.code,
      name: p.name,
      description: p.description,
      module: p.module,
      created_at: now,
      updated_at: now
    }));

    await queryInterface.bulkInsert('permissions', permRows, { ignoreDuplicates: true });
    console.log(`Seeded ${permRows.length} permissions.`);

    // 2. Load permission IDs from DB
    const [dbPerms] = await queryInterface.sequelize.query('SELECT id, code FROM permissions');
    const permMap = {};
    dbPerms.forEach(p => { permMap[p.code] = p.id; });

    // 3. Assign ALL permissions to admin users
    const [admins] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE role = 'System Administrator'"
    );

    if (admins.length > 0) {
      const adminPermRows = [];
      for (const admin of admins) {
        for (const perm of dbPerms) {
          adminPermRows.push({
            id: uuidv4(),
            user_id: admin.id,
            permission_id: perm.id,
            created_at: now,
            updated_at: now
          });
        }
      }
      await queryInterface.bulkInsert('user_permissions', adminPermRows, { ignoreDuplicates: true });
      console.log(`Assigned ${dbPerms.length} permissions to ${admins.length} admin user(s).`);
    }

    // 4. Assign default permissions to test_administrator users
    const [testAdmins] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE role = 'Test Administrator'"
    );

    if (testAdmins.length > 0) {
      const taPermRows = [];
      for (const ta of testAdmins) {
        for (const code of TEST_ADMIN_DEFAULT_CODES) {
          if (permMap[code]) {
            taPermRows.push({
              id: uuidv4(),
              user_id: ta.id,
              permission_id: permMap[code],
              created_at: now,
              updated_at: now
            });
          }
        }
      }
      if (taPermRows.length > 0) {
        await queryInterface.bulkInsert('user_permissions', taPermRows, { ignoreDuplicates: true });
        console.log(`Assigned ${TEST_ADMIN_DEFAULT_CODES.length} permissions to ${testAdmins.length} test administrator(s).`);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
