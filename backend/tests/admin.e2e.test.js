const request = require('supertest');
const jwt = require('jsonwebtoken');
require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

const app = require('../src/app');
const { sequelize, Question, Occupation, User, Permission } = require('../src/models');
const { ROLES } = require('../src/constants/roles');

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const ADMIN_TOKEN = () => jwt.sign({ id: ADMIN_ID, role: ROLES.SYSTEM_ADMIN }, process.env.JWT_SECRET || 'testsecret');
const authHeader = () => ({ Authorization: `Bearer ${ADMIN_TOKEN()}` });

const REQUIRED_PERMISSION_CODES = [
  'questions.view',
  'questions.create',
  'questions.update',
  'questions.import',
  'questions.export',
  'occupations.view',
  'occupations.create',
  'occupations.update',
  'occupations.import',
  'occupations.export'
];

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL is required for tests');
  }
  await sequelize.sync({ force: true });
  const admin = await User.create({
    id: ADMIN_ID,
    username: 'admin',
    email: 'admin@example.com',
    password: 'Password123!',
    role: ROLES.SYSTEM_ADMIN,
    userType: ROLES.SYSTEM_ADMIN,
    isActive: true,
    isEmailVerified: true
  });
  const permissions = await Permission.bulkCreate(REQUIRED_PERMISSION_CODES.map((code) => ({
    code,
    name: code,
    module: code.split('.')[0]
  })));
  await admin.addPermissions(permissions);
});

afterEach(async () => {
  await Question.destroy({ where: {} });
  await Occupation.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Admin Questions', () => {
  test('CRUD flow', async () => {
    const createRes = await request(app)
      .post('/api/v1/admin/questions')
      .set(authHeader())
      .send({ text: 'Q1', section: 'activities', riasecType: 'R', order: 1 });
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.question.id;

    const listRes = await request(app).get('/api/v1/admin/questions').set(authHeader());
    expect(listRes.status).toBe(200);
    expect(listRes.body.results).toBe(1);

    const patchRes = await request(app)
      .patch(`/api/v1/admin/questions/${id}`)
      .set(authHeader())
      .send({ text: 'Q1 updated' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.question.text).toBe('Q1 updated');
  });

  test('JSON import happy path', async () => {
    const res = await request(app)
      .post('/api/v1/admin/questions/import')
      .set(authHeader())
      .send({
        questions: [
          { text: 'A', section: 'activities', riasecType: 'R', order: 1 },
          { text: 'B', section: 'activities', riasecType: 'I', order: 2 }
        ]
      });
    expect(res.status).toBe(201);
    expect(res.body.data.imported + res.body.data.updated).toBe(2);
  });

  test('CSV import error on missing headers', async () => {
    const res = await request(app)
      .post('/api/v1/admin/questions/import')
      .set(authHeader())
      .set('Content-Type', 'text/csv')
      .send('text,section\nonly two columns');
    expect(res.status).toBe(400);
  });

  test('Duplicate detection', async () => {
    const res = await request(app)
      .post('/api/v1/admin/questions/import')
      .set(authHeader())
      .send({
        questions: [
          { text: 'A', section: 'activities', riasecType: 'R', order: 1 },
          { text: 'B', section: 'activities', riasecType: 'I', order: 1 }
        ]
      });
    expect(res.status).toBe(400);
  });

  test('Export JSON and CSV', async () => {
    await Question.create({ text: 'A', section: 'activities', riasecType: 'R', order: 1 });
    const jsonRes = await request(app).get('/api/v1/admin/questions/export').set(authHeader());
    expect(jsonRes.status).toBe(200);
    expect(jsonRes.body.results).toBe(1);

    const csvRes = await request(app).get('/api/v1/admin/questions/export?format=csv').set(authHeader());
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toMatch(/text\/csv/);
  });
});

describe('Admin Occupations', () => {
  test('CRUD flow', async () => {
    const createRes = await request(app)
      .post('/api/v1/admin/occupations')
      .set(authHeader())
      .send({ code: 'RIA', name: 'Occupation A' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.occupation.id;

    const listRes = await request(app).get('/api/v1/admin/occupations').set(authHeader());
    expect(listRes.status).toBe(200);
    expect(listRes.body.results).toBe(1);

    const patchRes = await request(app)
      .patch(`/api/v1/admin/occupations/${id}`)
      .set(authHeader())
      .send({ name: 'Updated Occupation' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.occupation.name).toBe('Updated Occupation');
  });

  test('JSON import happy path', async () => {
    const res = await request(app)
      .post('/api/v1/admin/occupations/import')
      .set(authHeader())
      .send({
        occupations: [
          { code: 'RIA', name: 'Occ1' },
          { code: 'SIA', name: 'Occ2' }
        ]
      });
    expect(res.status).toBe(201);
    expect(res.body.data.imported + res.body.data.updated).toBe(2);
  });

  test('CSV import error on missing headers', async () => {
    const res = await request(app)
      .post('/api/v1/admin/occupations/import')
      .set(authHeader())
      .set('Content-Type', 'text/csv')
      .send('code\nRIA');
    expect(res.status).toBe(400);
  });

  test('Duplicate detection', async () => {
    const res = await request(app)
      .post('/api/v1/admin/occupations/import')
      .set(authHeader())
      .send({
        occupations: [
          { code: 'RIA', name: 'Occ1' },
          { code: 'RIA', name: 'Occ2' }
        ]
      });
    expect(res.status).toBe(400);
  });

  test('Export JSON and CSV', async () => {
    await Occupation.create({ code: 'RIA', name: 'Occ1' });
    const jsonRes = await request(app).get('/api/v1/admin/occupations/export').set(authHeader());
    expect(jsonRes.status).toBe(200);
    expect(jsonRes.body.results).toBe(1);

    const csvRes = await request(app).get('/api/v1/admin/occupations/export?format=csv').set(authHeader());
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toMatch(/text\/csv/);
  });
});
