jest.mock('../src/models', () => ({
  User: { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
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
  beforeEach(() => {
    jest.clearAllMocks();
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
    User.findByPk.mockResolvedValue({
      id: 'ta-1',
      role: 'Test Administrator',
      institutionId: 'inst-own'
    });
    Institution.findByPk.mockResolvedValue({ id: 'inst-own', name: 'School' });
    User.findAll.mockResolvedValue([{ id: 'student-1' }]);

    await counselorService.getLoginCardsData('ta-1', null, null);

    expect(User.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: [expect.objectContaining({
        attributes: expect.arrayContaining(['id', 'studentNumber', 'grade', 'className', 'loginCardPrinted'])
      })]
    }));
  });
});
