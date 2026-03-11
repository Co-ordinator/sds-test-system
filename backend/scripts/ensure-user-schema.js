require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const sequelize = require('../src/config/database.config');
const { Sequelize } = require('sequelize');

const USER_TYPE_VALUES = ['school_student', 'university_student', 'professional', 'counselor', 'admin'];

const hasIndex = async (queryInterface, tableName, indexName) => {
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some(index => index.name === indexName);
};

async function ensureUserSchema() {
  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();

  try {
    const table = await queryInterface.describeTable('users');

    if (!table.user_type) {
      await queryInterface.sequelize.query(
        `DO $$ BEGIN
           CREATE TYPE "enum_users_user_type" AS ENUM ('school_student', 'university_student', 'professional', 'counselor', 'admin');
         EXCEPTION WHEN duplicate_object THEN NULL;
         END $$;`,
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'user_type',
        {
          type: Sequelize.ENUM(...USER_TYPE_VALUES),
          allowNull: true
        },
        { transaction }
      );
    }

    if (!table.student_number) {
      await queryInterface.addColumn(
        'users',
        'student_number',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      );
    }

    if (!table.class_name) {
      await queryInterface.addColumn(
        'users',
        'class_name',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      );
    }

    if (!table.student_code) {
      await queryInterface.addColumn(
        'users',
        'student_code',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      );
    }

    if (!table.degree_program) {
      await queryInterface.addColumn(
        'users',
        'degree_program',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      );
    }

    if (!table.year_of_study) {
      await queryInterface.addColumn(
        'users',
        'year_of_study',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      );
    }

    if (!table.years_experience) {
      await queryInterface.addColumn(
        'users',
        'years_experience',
        {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        { transaction }
      );
    }

    await transaction.commit();

    if (!(await hasIndex(queryInterface, 'users', 'users_student_number_unique'))) {
      await queryInterface.addIndex('users', ['student_number'], {
        name: 'users_student_number_unique',
        unique: true,
        where: { student_number: { [Sequelize.Op.ne]: null } }
      });
    }

    if (!(await hasIndex(queryInterface, 'users', 'users_student_code_unique'))) {
      await queryInterface.addIndex('users', ['student_code'], {
        name: 'users_student_code_unique',
        unique: true,
        where: { student_code: { [Sequelize.Op.ne]: null } }
      });
    }

    if (!(await hasIndex(queryInterface, 'users', 'users_user_type_idx'))) {
      await queryInterface.addIndex('users', ['user_type'], {
        name: 'users_user_type_idx'
      });
    }

    console.log('✅ User schema is up to date.');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Failed to ensure user schema:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

ensureUserSchema();
