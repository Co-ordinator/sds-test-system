'use strict';

const { v4: uuidv4 } = require('uuid');

const terms = [
  {
    term: 'Host/hostess',
    definition: 'A person who welcomes guests, visitors, or customers and helps them feel comfortable at an event, office, hotel, or other place.',
    section: 'competencies',
    example: 'A host or hostess greets guests and directs them where to go.',
  },
  {
    term: 'Handicapped',
    definition: 'An older term used for a person with a disability or a person facing a physical, sensory, or other limitation. Modern respectful wording is person with a disability.',
    section: 'activities',
    example: 'Helping people with disabilities access services or move safely.',
  },
  {
    term: 'Shorthand',
    definition: 'A fast writing system that uses symbols or abbreviations to record spoken words quickly.',
    section: 'competencies',
    example: 'A secretary may use shorthand to take notes during a meeting.',
  },
  {
    term: 'Humorous',
    definition: 'Funny, amusing, or able to make people laugh.',
    section: 'activities',
    example: 'A humorous drawing uses comedy to entertain readers.',
  },
  {
    term: 'Logarithmic table',
    definition: 'A printed table used to look up logarithm values for mathematical calculations, especially before calculators became common.',
    section: 'competencies',
    example: 'A student can use a logarithmic table to solve mathematics problems.',
  },
  {
    term: 'Keypunch',
    definition: 'An older data-processing machine or keyboard used to enter information by punching holes into cards.',
    section: 'competencies',
    example: 'A keypunch was used to prepare data cards for early computers.',
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    for (const term of terms) {
      const [existing] = await queryInterface.sequelize.query(
        `
          SELECT id
          FROM glossary_terms
          WHERE LOWER(term) = LOWER(:term)
            AND section = :section
          LIMIT 1
        `,
        {
          replacements: {
            term: term.term,
            section: term.section,
          },
        }
      );

      if (existing.length > 0) {
        await queryInterface.sequelize.query(
          `
            UPDATE glossary_terms
            SET definition = :definition,
                example = :example,
                is_active = true,
                updated_at = :now
            WHERE id = :id
          `,
          {
            replacements: {
              id: existing[0].id,
              definition: term.definition,
              example: term.example,
              now,
            },
          }
        );
        continue;
      }

      await queryInterface.sequelize.query(
        `
          INSERT INTO glossary_terms
            (id, term, definition, section, example, is_active, created_at, updated_at)
          VALUES
            (:id, :term, :definition, :section, :example, true, :now, :now)
        `,
        {
          replacements: {
            id: uuidv4(),
            term: term.term,
            definition: term.definition,
            section: term.section,
            example: term.example,
            now,
          },
        }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('glossary_terms', {
      term: terms.map((term) => term.term),
    }, {});
  },
};
