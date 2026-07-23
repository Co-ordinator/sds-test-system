'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

describe('result email template', () => {
  test('renders a fluid, mobile-safe HTML result without horizontal-width forcing', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../src/templates/emails/test-results.hbs'),
      'utf8'
    );
    const html = Handlebars.compile(source)({
      firstName: 'Learner',
      currentYear: 2026,
      hollandCode: 'S C A/E',
      hollandLabel: 'Social - Conventional - Artistic - Enterprising',
      scores: [{ letter: 'S', label: 'Social', score: 100 }],
      recommendations: [{ title: 'Counsellor', matchPercentage: 92, field: 'Social' }]
    });

    expect(html).toContain('width="100%"');
    expect(html).toContain('max-width:560px');
    expect(html).toContain('S C A/E');
    expect(html).toContain('Counsellor');
    expect(html).not.toMatch(/min-width\s*:/i);
    expect(html).not.toContain('overflow-x');
  });
});
