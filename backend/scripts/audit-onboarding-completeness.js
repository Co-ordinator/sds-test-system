'use strict';

require('dotenv').config();

const { User, Institution } = require('../src/models');

const hasText = (value) => String(value ?? '').trim() !== '';
const hasNumber = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const getMissingFields = (user) => {
  const missing = [];

  if (!hasText(user.firstName) || !hasText(user.lastName)) missing.push('name');
  if (!user.gender) missing.push('gender');
  if (!user.userType) missing.push('userType');
  if (!user.region) missing.push('region');
  if (!hasText(user.district)) missing.push('district');
  if (!hasText(user.address)) missing.push('address');
  if (!user.preferredLanguage) missing.push('preferredLanguage');
  if (!hasText(user.gradeLevel)) missing.push('gradeLevel');

  if (user.userType === 'Professional') {
    if (!(hasText(user.workplaceName) || user.workplaceInstitutionId)) missing.push('workplace');
    if (!(hasText(user.currentOccupation) || user.currentOccupationId)) missing.push('occupation');
    if (!hasNumber(user.yearsExperience)) missing.push('yearsExperience');
  }

  if (user.userType === 'High School Student') {
    if (!(hasText(user.currentInstitution) || user.institutionId)) missing.push('institution');
  }

  if (user.userType === 'University Student') {
    if (!(hasText(user.currentInstitution) || user.institutionId)) missing.push('institution');
    if (!hasText(user.degreeProgram)) missing.push('degreeProgram');
    if (!hasNumber(user.yearOfStudy)) missing.push('yearOfStudy');
  }

  return missing;
};

async function main() {
  const users = await User.findAll({
    where: {
      role: 'Test Taker',
      onboardingCompleted: true,
    },
    attributes: [
      'id',
      'email',
      'studentCode',
      'firstName',
      'lastName',
      'gender',
      'userType',
      'region',
      'district',
      'address',
      'preferredLanguage',
      'gradeLevel',
      'currentInstitution',
      'institutionId',
      'degreeProgram',
      'yearOfStudy',
      'workplaceName',
      'workplaceInstitutionId',
      'currentOccupation',
      'currentOccupationId',
      'yearsExperience',
    ],
    include: [
      { model: Institution, as: 'institution', attributes: ['name'], required: false },
      { model: Institution, as: 'workplace', attributes: ['name'], required: false },
    ],
    order: [['updatedAt', 'DESC']],
  });

  const incomplete = users
    .map((user) => ({
      user,
      missing: getMissingFields(user),
    }))
    .filter((entry) => entry.missing.length > 0);

  const grouped = incomplete.reduce((acc, entry) => {
    const key = entry.user.userType || 'No user type';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(`Checked completed Test Taker profiles: ${users.length}`);
  console.log(`Incomplete completed profiles found: ${incomplete.length}`);

  if (Object.keys(grouped).length > 0) {
    console.log('\nBy user type:');
    Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([userType, count]) => {
        console.log(`- ${userType}: ${count}`);
      });
  }

  if (incomplete.length > 0) {
    console.log('\nIncomplete profiles:');
    incomplete.forEach(({ user, missing }) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'No name';
      const identifier = user.email || user.studentCode || user.id;
      const institution = user.institution?.name || user.currentInstitution || user.workplace?.name || user.workplaceName || 'No institution/workplace';
      console.log(`- ${name} <${identifier}> | ${user.userType || 'No user type'} | ${institution} | missing: ${missing.join(', ')}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
