'use strict';

const mockFindAll = jest.fn();

jest.mock('../src/models', () => ({
  Occupation: {
    findAll: mockFindAll
  },
  sequelize: {
    transaction: jest.fn()
  }
}));

jest.mock('../src/validations/occupation.validation', () => ({
  occupationsArraySchema: {
    validate: jest.fn()
  }
}));

const { Op } = require('sequelize');
const occupationService = require('../src/services/occupation.service');

describe('occupation search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue([]);
  });

  test('uses Sequelize operators from the library', async () => {
    await expect(occupationService.searchOccupations('teacher')).resolves.toEqual([]);

    expect(mockFindAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: '%teacher%' } },
          { category: { [Op.iLike]: '%teacher%' } }
        ]
      },
      limit: 20
    }));
  });
});
