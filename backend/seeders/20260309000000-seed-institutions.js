"use strict";

const { v4: uuidv4 } = require('uuid');
const now = new Date();

/** Convert a JS array to a PostgreSQL array literal string e.g. {"a","b"} */
const pgArray = (arr) => {
  if (!arr || !arr.length) return null;
  const escaped = arr.map(s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `{${escaped.join(',')}}`;
};

const institutions = [
  // Universities
  {
    id: uuidv4(),
    name: 'University of Eswatini',
    name_swati: 'INyunivesithi yaseSwatini',
    acronym: 'UNESWA',
    type: 'university',
    region: 'hhohho',
    district: 'Kwaluseni',
    description: 'The national university of the Kingdom of Eswatini, offering undergraduate and postgraduate programmes across science, humanities, commerce, health sciences, agriculture and education.',
    phone_number: '+268 2517 0000',
    email: 'registrar@uniswa.sz',
    website: 'https://www.uniswa.sz',
    accredited: true,
    bursaries_available: true,
    programs: JSON.stringify([
      { name: 'Faculty of Science', code: 'SCI', duration: 4, riasecCodes: ['IRS', 'IRC'] },
      { name: 'Faculty of Commerce', code: 'COM', duration: 3, riasecCodes: ['CEI', 'ESC'] },
      { name: 'Faculty of Education', code: 'EDU', duration: 4, riasecCodes: ['SAE', 'SAI'] },
      { name: 'Faculty of Health Sciences', code: 'HSC', duration: 4, riasecCodes: ['ISA', 'SIA'] },
      { name: 'Faculty of Agriculture', code: 'AGR', duration: 4, riasecCodes: ['RIS', 'RIA'] }
    ]),
    facilities: pgArray(['Library', 'Computer Labs', 'Science Laboratories', 'Student Centre', 'Sports Fields', 'Cafeteria', 'Clinic']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Southern Africa Nazarene University',
    name_swati: 'INyunivesithi yaseNazareni',
    acronym: 'SANU',
    type: 'university',
    region: 'manzini',
    district: 'Manzini',
    description: 'A private Christian university offering programmes in education, social sciences, business and arts, committed to academic excellence and community service.',
    phone_number: '+268 2505 4000',
    email: 'info@sanu.ac.sz',
    website: 'https://www.sanu.ac.sz',
    accredited: true,
    bursaries_available: true,
    programs: JSON.stringify([
      { name: 'School of Education', code: 'EDU', duration: 4, riasecCodes: ['SAE', 'SAI'] },
      { name: 'School of Business', code: 'BUS', duration: 3, riasecCodes: ['ESC', 'CEI'] },
      { name: 'School of Social Sciences', code: 'SSC', duration: 3, riasecCodes: ['SAI', 'SEA'] }
    ]),
    facilities: pgArray(['Library', 'Computer Labs', 'Chapel', 'Student Dorms', 'Sports Court', 'Cafeteria']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Limkokwing University',
    name_swati: null,
    acronym: 'LU',
    type: 'university',
    region: 'hhohho',
    district: 'Mbabane',
    description: 'International university specialising in creative arts, technology, business and communication, with campuses across Africa and Asia.',
    phone_number: '+268 2404 0000',
    email: 'info.sz@limkokwing.edu.my',
    website: 'https://www.limkokwing.net',
    accredited: true,
    bursaries_available: false,
    programs: JSON.stringify([
      { name: 'Faculty of Design Innovation', code: 'DES', duration: 3, riasecCodes: ['AES', 'AIE'] },
      { name: 'Faculty of Technology', code: 'TEC', duration: 3, riasecCodes: ['IRS', 'IRC'] },
      { name: 'Faculty of Business', code: 'BUS', duration: 3, riasecCodes: ['ESC', 'ECR'] }
    ]),
    facilities: pgArray(['Design Studios', 'Computer Labs', 'Media Production Suite', 'Library', 'Cafeteria']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Eswatini Medical Christian University',
    name_swati: null,
    acronym: 'EMCU',
    type: 'university',
    region: 'lubombo',
    district: 'Siteki',
    description: 'A faith-based university dedicated to health sciences education, training doctors, nurses, pharmacists and allied health professionals to serve Eswatini and the region.',
    phone_number: '+268 2343 4000',
    email: 'admissions@emcu.ac.sz',
    website: 'https://www.emcu.ac.sz',
    accredited: true,
    bursaries_available: true,
    programs: JSON.stringify([
      { name: 'Faculty of Medicine', code: 'MED', duration: 6, riasecCodes: ['ISA', 'IRS'] },
      { name: 'Faculty of Nursing', code: 'NUR', duration: 4, riasecCodes: ['SIA', 'ISA'] },
      { name: 'Faculty of Pharmacy', code: 'PHA', duration: 4, riasecCodes: ['ICS', 'ISC'] }
    ]),
    facilities: pgArray(['Teaching Hospital', 'Clinical Labs', 'Library', 'Simulation Centre', 'Student Hostel']),
    created_at: now,
    updated_at: now
  },

  // TVET / Vocational Institutions
  {
    id: uuidv4(),
    name: 'Gwamile VOCTIM',
    name_swati: null,
    acronym: 'VOCTIM',
    type: 'tvet',
    region: 'hhohho',
    district: 'Matsapha',
    description: 'Vocational, Commercial and Training Institute of Matsapha offering practical skills training in trades, hospitality, business and technical programmes.',
    phone_number: '+268 2518 4000',
    email: 'info@voctim.sz',
    website: null,
    accredited: true,
    bursaries_available: false,
    programs: JSON.stringify([
      { name: 'Construction Trades', code: 'CON', duration: 2, riasecCodes: ['RCE'] },
      { name: 'Automotive Engineering', code: 'AUT', duration: 2, riasecCodes: ['RIC'] },
      { name: 'Hospitality', code: 'HOS', duration: 1, riasecCodes: ['ESC'] }
    ]),
    facilities: pgArray(['Workshops', 'Training Kitchen', 'Computer Lab', 'Library']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Eswatini College of Technology',
    name_swati: null,
    acronym: 'ECOT',
    type: 'college',
    region: 'manzini',
    district: 'Matsapha',
    description: 'A technical college offering diploma and certificate programmes in engineering, information technology, business and applied sciences.',
    phone_number: '+268 2518 5000',
    email: 'info@ecot.ac.sz',
    website: null,
    accredited: true,
    bursaries_available: false,
    programs: JSON.stringify([
      { name: 'Engineering Division', code: 'ENG', duration: 3, riasecCodes: ['RIE', 'RIC'] },
      { name: 'Business Division', code: 'BUS', duration: 2, riasecCodes: ['CEI', 'ESC'] },
      { name: 'ICT Division', code: 'ICT', duration: 2, riasecCodes: ['IRC', 'ICS'] }
    ]),
    facilities: pgArray(['Engineering Labs', 'Computer Lab', 'Library', 'Workshop']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Ngwane Teacher Training College',
    name_swati: null,
    acronym: 'NTTC',
    type: 'college',
    region: 'shiselweni',
    district: 'Nhlangano',
    description: 'A teacher training institution preparing qualified primary and secondary school educators for the Kingdom of Eswatini.',
    phone_number: '+268 2207 8000',
    email: 'info@nttc.edu.sz',
    website: null,
    accredited: true,
    bursaries_available: true,
    programs: JSON.stringify([
      { name: 'Primary Education', code: 'PRI', duration: 3, riasecCodes: ['SAE'] },
      { name: 'Secondary Education', code: 'SEC', duration: 3, riasecCodes: ['SAI'] }
    ]),
    facilities: pgArray(['Library', 'Classrooms', 'Teaching Practice Schools', 'Student Hostel']),
    created_at: now,
    updated_at: now
  },

  // Secondary Schools (for school_students)
  {
    id: uuidv4(),
    name: 'Mbabane Government High School',
    name_swati: null,
    acronym: 'MGHS',
    type: 'school',
    region: 'hhohho',
    district: 'Mbabane',
    description: 'A government secondary school in the capital city offering IGCSE and SGCSE programmes.',
    phone_number: '+268 2404 2000',
    email: 'principal@mghs.edu.sz',
    website: null,
    accredited: true,
    bursaries_available: false,
    programs: null,
    facilities: pgArray(['Library', 'Science Labs', 'Computer Lab', 'Sports Fields']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Manzini Central High School',
    name_swati: null,
    acronym: 'MCHS',
    type: 'school',
    region: 'manzini',
    district: 'Manzini',
    description: 'A government secondary school in the commercial capital of Eswatini, offering SGCSE programmes.',
    phone_number: '+268 2505 3000',
    email: 'principal@mchs.edu.sz',
    website: null,
    accredited: true,
    bursaries_available: false,
    programs: null,
    facilities: pgArray(['Library', 'Science Labs', 'Sports Fields', 'Computer Lab']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Siteki High School',
    name_swati: null,
    acronym: 'SHS',
    type: 'school',
    region: 'lubombo',
    district: 'Siteki',
    description: 'A secondary school in the Lubombo region serving communities in the eastern part of Eswatini.',
    phone_number: '+268 2343 2000',
    email: 'principal@shs.edu.sz',
    website: null,
    accredited: true,
    bursaries_available: false,
    programs: null,
    facilities: pgArray(['Library', 'Science Labs', 'Sports Grounds']),
    created_at: now,
    updated_at: now
  },
  {
    id: uuidv4(),
    name: 'Hlatikulu High School',
    name_swati: null,
    acronym: 'HHS',
    type: 'school',
    region: 'shiselweni',
    district: 'Hlatikulu',
    description: 'A government secondary school in the Shiselweni region offering both IGCSE and SGCSE programmes.',
    phone_number: '+268 2217 1000',
    email: 'principal@hhs.edu.sz',
    website: null,
    accredited: true,
    bursaries_available: false,
    programs: null,
    facilities: pgArray(['Library', 'Sports Grounds', 'Computer Lab']),
    created_at: now,
    updated_at: now
  }
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('institutions', institutions, { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    const names = institutions.map(i => i.name);
    await queryInterface.bulkDelete('institutions', {
      name: names
    }, {});
  }
};
