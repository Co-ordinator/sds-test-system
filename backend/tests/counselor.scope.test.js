jest.mock('../src/models', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    sequelize: { transaction: jest.fn() }
  },
  Assessment: {},
  Institution: { findByPk: jest.fn() },
  SchoolStudent: { update: jest.fn() }
}));

jest.mock('../src/services/studentImport.service', () => ({
  bulkCreateStudents: jest.fn()
}));

const counselorService = require('../src/services/counselor.service');
const { User, Institution, SchoolStudent } = require('../src/models');
const { bulkCreateStudents } = require('../src/services/studentImport.service');

describe('Counselor institution scoping', () => {
  const originalLoginCardSecret = process.env.LOGIN_CARD_PASSWORD_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LOGIN_CARD_PASSWORD_SECRET = 'test-login-card-secret-with-at-least-32-characters';
    User.sequelize.transaction.mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn()
    });
  });

  afterAll(() => {
    if (originalLoginCardSecret === undefined) {
      delete process.env.LOGIN_CARD_PASSWORD_SECRET;
    } else {
      process.env.LOGIN_CARD_PASSWORD_SECRET = originalLoginCardSecret;
    }
  });

  test('scopes test administrator imports to own institution', async () => {
    User.findByPk.mockResolvedValue({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    });
    bulkCreateStudents.mockResolvedValue({ importedCount: 1, students: [] });

    await counselorService.importStudents('ta-1', 'student_number,first_name,last_name,national_id,institution\n1,A,B,1234567890123,X', 'inst-other');

    expect(bulkCreateStudents).toHaveBeenCalledWith(expect.any(String), 'inst-own');
  });

  test('blocks an unassigned test administrator from reading all students', async () => {
    User.findByPk.mockResolvedValue({
      id: 'ta-unassigned',
      role: 'Test Administrator',
      institutionId: null
    });

    await expect(counselorService.getMyStudents('ta-unassigned', null))
      .rejects.toMatchObject({ code: 'TEST_ADMIN_INSTITUTION_REQUIRED', status: 403 });
    expect(User.findAll).not.toHaveBeenCalled();
  });

  test('allows system admin to import for requested institution', async () => {
    User.findByPk.mockResolvedValue({
      id: 'sa-1',
      role: 'System Administrator',
      institutionId: null
    });
    bulkCreateStudents.mockResolvedValue({ importedCount: 1, students: [] });

    await counselorService.importStudents('sa-1', 'student_number,first_name,last_name,national_id,institution\n1,A,B,1234567890123,X', 'inst-target');

    expect(bulkCreateStudents).toHaveBeenCalledWith(expect.any(String), 'inst-target');
  });

  test('prevents test administrator from updating student institution', async () => {
    const update = jest.fn();
    User.findByPk.mockResolvedValue({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    });
    User.findOne.mockResolvedValue({ id: 'student-1', institutionId: 'inst-own', update });
    User.findByPk.mockResolvedValueOnce({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    }).mockResolvedValueOnce({ id: 'student-1' });

    await counselorService.updateStudent('ta-1', 'student-1', { institutionId: 'inst-other', firstName: 'A' });

    expect(update).toHaveBeenCalledWith({ firstName: 'A' });
  });

  test('scopes delete to actor institution', async () => {
    const destroy = jest.fn();
    User.findByPk.mockResolvedValue({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    });
    User.findOne.mockResolvedValue({ id: 'student-1', destroy });

    await counselorService.deleteStudent('ta-1', 'student-1');

    expect(User.findOne).toHaveBeenCalledWith({
      where: { id: 'student-1', role: 'Test Taker', institutionId: 'inst-own' }
    });
    expect(destroy).toHaveBeenCalled();
  });

  test('scopes student results to the test administrator institution', async () => {
    User.findByPk.mockResolvedValue({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    });
    User.findOne.mockResolvedValue(null);

    await expect(counselorService.getStudentResults('ta-1', 'student-other'))
      .rejects.toMatchObject({ code: 'STUDENT_NOT_FOUND' });
    expect(User.findOne).toHaveBeenCalledWith({
      where: { id: 'student-other', role: 'Test Taker', institutionId: 'inst-own' }
    });
  });

  test('marks printed cards when schoolStudent ids are present', async () => {
    SchoolStudent.update.mockResolvedValue([1]);

    await counselorService.markLoginCardsPrinted([
      { schoolStudent: { id: 's1' } },
      { schoolStudent: { id: null } },
      { schoolStudent: { id: 's2' } }
    ]);

    expect(SchoolStudent.update).toHaveBeenCalledWith(
      { loginCardPrinted: true, loginCardPrintedAt: expect.any(Date) },
      { where: { id: ['s1', 's2'] } }
    );
  });

  test('login card data includes school student id', async () => {
    let issuedPassword = null;
    const student = {
      id: 'student-1',
      mustChangePassword: false,
      loginCardCredentialNonce: null,
      update: jest.fn(async (updates) => {
        issuedPassword = updates.password;
        student.mustChangePassword = updates.mustChangePassword;
        student.loginCardCredentialNonce = updates.loginCardCredentialNonce;
      }),
      comparePassword: jest.fn(async (candidate) => candidate === issuedPassword),
      setDataValue: jest.fn()
    };
    User.findByPk.mockResolvedValue({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    });
    Institution.findByPk.mockResolvedValue({ id: 'inst-own', name: 'School' });
    User.findAll.mockResolvedValue([student]);

    await counselorService.getLoginCardsData('ta-1', null, null);

    expect(student.update).toHaveBeenCalledWith(
      expect.objectContaining({
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        loginCardCredentialNonce: expect.any(String)
      }),
      expect.objectContaining({ transaction: expect.any(Object) })
    );
    expect(student.comparePassword).toHaveBeenCalledWith(issuedPassword);
    expect(student.setDataValue).toHaveBeenCalledWith('loginCardPassword', issuedPassword);
    expect(User.findAll).toHaveBeenCalledWith(expect.objectContaining({
      attributes: expect.arrayContaining(['password', 'mustChangePassword', 'loginCardCredentialNonce']),
      include: [expect.objectContaining({
        attributes: expect.arrayContaining(['id', 'studentNumber', 'grade', 'className', 'loginCardPrinted'])
      })]
    }));
  });

  test('reprints an active login-card credential without changing the password', async () => {
    const student = {
      id: 'student-1',
      mustChangePassword: true,
      loginCardCredentialNonce: 'existing-nonce',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      update: jest.fn(),
      comparePassword: jest.fn().mockResolvedValue(true),
      setDataValue: jest.fn()
    };
    User.findByPk.mockResolvedValue({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    });
    Institution.findByPk.mockResolvedValue({ id: 'inst-own', name: 'School' });
    User.findAll.mockResolvedValue([student]);

    await counselorService.getLoginCardsData('ta-1', null, null);

    expect(student.update).not.toHaveBeenCalled();
    expect(student.setDataValue).toHaveBeenCalledWith(
      'loginCardPassword',
      expect.stringMatching(/^[A-HJ-KM-NP-Zabcdefghjkmnpqrstuvwxyz2-9]{12}$/)
    );
  });
});
