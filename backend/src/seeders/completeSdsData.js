// backend/src/seeders/completeSdsData.js
const { 
  Test, 
  TestSection, 
  Question,
  Occupation,
  Institution,
  Career 
} = require('../models');

// Complete SDS Test Seeding based on Ministry of Labour Career Interest Books
const seedCompleteSdsTest = async () => {
  try {
    console.log('🌱 Seeding complete SDS test from Ministry of Labour data...');
    
    // Create main SDS Test
    const test = await Test.create({
      name: 'Self-Directed Search (SDS)',
      nameSwati: 'Kuhlola Kwakho Ngekwakho (SDS)',
      description: 'Holland\'s Self-Directed Search career assessment based on the RIASEC model. Adopted from South African version produced by the Human Science Research Council.',
      descriptionSwati: 'Kuhlola kwemisebenzi ngekwakho ngekwendlela ye-RIASEC',
      version: '1.0',
      estimatedDuration: 45,
      instructions: 'This assessment will help you identify careers that match your interests and abilities. Answer all questions honestly based on your true preferences. The questionnaire contains sections on activities, competencies, occupations, and self-ratings.',
      instructionsSwati: 'Loku kuhlola kuyakusita kubone imisebenti lehambisana netintfwalo takho nemakhono akho. Phendvula yonkhe imibutso ngeliciniso.'
    });

    // SECTION 1: ACTIVITIES (66 questions - 11 per RIASEC category)
    const activitiesSection = await TestSection.create({
      testId: test.id,
      name: 'Activities',
      nameSwati: 'Tintfo Letitandvwako',
      sectionType: 'activities',
      description: 'Things I like to do',
      descriptionSwati: 'Tintfo letingitandvula kutenta',
      instructions: 'Shade YES for the activities you LIKE TO DO or think you WOULD LIKE TO DO. Shade NO for the activities you are INDIFFERENT TO, HAVE NEVER DONE, or DO NOT LIKE TO DO.',
      instructionsSwati: 'Khetha YEBO ngetintfo lotitandvulako. Khetha CHA ngetintfo longatitandvuli.',
      orderIndex: 1,
      isRequired: true
    });

    // Activities Questions - Realistic (R)
    const activitiesR = [
      'Fix electrical apparatus',
      'Repair motor cars',
      'Fix mechanical apparatus',
      'Build objects with wood',
      'Drive a truck or tractor',
      'Use metalwork or machine tools',
      'Work on a bicycle or motorcycle',
      'Take a technical course',
      'Take a course in mechanical drawing',
      'Take a woodworking course',
      'Take a motor mechanics course'
    ];

    // Activities Questions - Investigative (I)
    const activitiesI = [
      'Read scientific books or magazines',
      'Work in a laboratory',
      'Work on a research project',
      'Study a scientific theory',
      'Work with a chemistry set',
      'Read about a special subject on my own',
      'Apply mathematics to practical problems',
      'Take a physics course',
      'Take a chemistry course',
      'Take a mathematics course',
      'Take a biology course'
    ];

    // Activities Questions - Artistic (A)
    const activitiesA = [
      'Sketch, draw or paint',
      'Go to concerts, plays or lectures',
      'Design furniture, clothing, or posters',
      'Play a musical instrument',
      'Read fiction, plays or poetry',
      'Take photographs',
      'Write stories or poetry',
      'Express yourself creatively',
      'Attend orchestra, band, choral group or play in a group',
      'Read or write about art or music',
      'Take an art course'
    ];

    // Activities Questions - Social (S)
    const activitiesS = [
      'Write letters to friends',
      'Read articles or books on sociology',
      'Belong to social clubs',
      'Help others with their personal problems',
      'Take care of children',
      'Go to parties/social meetings',
      'Dance',
      'Read books on psychology',
      'Help handicapped people',
      'Go to sports events',
      'Teach in a school'
    ];

    // Activities Questions - Enterprising (E)
    const activitiesE = [
      'Convince other people',
      'Sell something',
      'Discuss politics',
      'Manage your own service or business',
      'Go to meetings',
      'Give talks',
      'Act as a leader of a group',
      'Supervise the work of others',
      'Meet important people',
      'Lead a group in accomplishing some goal',
      'Participate in a political campaign'
    ];

    // Activities Questions - Conventional (C)
    const activitiesC = [
      'Keep your own desk and room neat',
      'Type papers or letters',
      'Add, subtract, multiply, and divide numbers in a business, or bookkeeping',
      'Operate business machines of any kind',
      'Keep detailed records of expenses',
      'Take a typewriting course',
      'Take a business course',
      'Take an accounting course',
      'Take a commerce course',
      'File letters and records',
      'Write business letters'
    ];

    // Create all Activities questions
    let questionIndex = 1;
    
    for (const text of activitiesR) {
      await Question.create({
        sectionId: activitiesSection.id,
        questionText: text,
        riasecCategory: 'R',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of activitiesI) {
      await Question.create({
        sectionId: activitiesSection.id,
        questionText: text,
        riasecCategory: 'I',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of activitiesA) {
      await Question.create({
        sectionId: activitiesSection.id,
        questionText: text,
        riasecCategory: 'A',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of activitiesS) {
      await Question.create({
        sectionId: activitiesSection.id,
        questionText: text,
        riasecCategory: 'S',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of activitiesE) {
      await Question.create({
        sectionId: activitiesSection.id,
        questionText: text,
        riasecCategory: 'E',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of activitiesC) {
      await Question.create({
        sectionId: activitiesSection.id,
        questionText: text,
        riasecCategory: 'C',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    console.log(`✅ Created ${questionIndex - 1} Activities questions`);

    // SECTION 2: COMPETENCIES (66 questions - 11 per RIASEC category)
    const competenciesSection = await TestSection.create({
      testId: test.id,
      name: 'Competencies',
      nameSwati: 'Emakhono',
      sectionType: 'competencies',
      description: 'Things I can do well',
      descriptionSwati: 'Tintfo lengitenta kahle',
      instructions: 'Shade YES for those activities that you HAVE KNOWLEDGE of or that you CAN DO WELL or COMPETENTLY. Shade NO for those activities that you HAVE LITTLE or NO KNOWLEDGE of or that you HAVE NEVER PERFORMED or PERFORM POORLY.',
      instructionsSwati: 'Khetha YEBO ngetintfo lotitentako kahle. Khetha CHA ngetintfo longatitsatsi.',
      orderIndex: 2,
      isRequired: true
    });

    // Competencies Questions - Realistic (R)
    const competenciesR = [
      'I have used a woodworking tool such as a power saw, a lathe or a sander',
      'I know how to use a voltmeter',
      'I can change car oil or tyres',
      'I have operated tools such as a drill press or a grinder or a sewing machine',
      'I can refinish, varnish or stain furniture or woodwork',
      'I can read blueprints (building plans)',
      'I can make simple electrical repairs',
      'I can repair furniture',
      'I can do mechanical drawings',
      'I can do simple repairs to a TV set (or radio)',
      'I can do simple plumbing repairs'
    ];

    // Competencies Questions - Investigative (I)
    const competenciesI = [
      'I can use algebra to solve mathematical problems',
      'I have participated in a scientific contest',
      'I understand the "half-life" of a radioactive element',
      'I understand logarithmic tables',
      'I can use a slide rule/calculator to multiply or divide',
      'I can use a microscope',
      'I can program a computer to study a scientific problem',
      'I can describe the function of white blood cells',
      'I can interpret simple chemical formulas',
      'I understand why man-made satellites do not fall to the earth',
      'I can name three foods that are high in vitamins'
    ];

    // Competencies Questions - Artistic (A)
    const competenciesA = [
      'I can play a musical instrument',
      'I can participate in two or four-part choral singing',
      'I can perform as a musical soloist',
      'I can act in a play',
      'I can do interpretive reading',
      'I can sketch, draw or paint',
      'I can sculpt, carve or do ceramics',
      'I can design clothing, posters or furniture',
      'I can write stories, poetry or music',
      'I can arrange or compose music',
      'I can design sets for plays'
    ];

    // Competencies Questions - Social (S)
    const competenciesS = [
      'I find it easy to talk with all kinds of people',
      'I am good at explaining things to others',
      'I am competent at teaching or training others',
      'I can be a good host/hostess',
      'I can teach others easily',
      'I am a good conversationalist',
      'I can plan social entertainment, games or parties',
      'I have worked as a helper in a hospital or nursing home',
      'I am good at helping people who are upset or troubled',
      'I can plan social events for the school or the church',
      'I am a good judge of personality',
      'People seek me out to tell me their troubles'
    ];

    // Competencies Questions - Enterprising (E)
    const competenciesE = [
      'I have been a successful salesperson',
      'I know how to be a successful leader',
      'I am a good debater',
      'I could manage a small business or service',
      'I have been elected to office while at high school',
      'I have acted as a spokesperson for a group in person or in a letter to a person in authority',
      'I can supervise the work of others',
      'I am an ambitious and aspiring person',
      'I am good at getting people to do things my way',
      'I have good judgement when making business decisions',
      'I am a good salesperson',
      'I am a good leader'
    ];

    // Competencies Questions - Conventional (C)
    const competenciesC = [
      'I can type 40 words a minute',
      'I can operate a duplicating or adding machine',
      'I can take shorthand',
      'I can file correspondence and other papers',
      'I have held an office job',
      'I can use a bookkeeping/accounting machine',
      'I can do a lot of paper work in a short time',
      'I can use a pocket calculator',
      'I can operate simple data processing equipment such as keypunch, verifier or sorter',
      'I can post credits and debits',
      'I can keep accurate records of payments or sales'
    ];

    // Create all Competencies questions
    questionIndex = 1;
    
    for (const text of competenciesR) {
      await Question.create({
        sectionId: competenciesSection.id,
        questionText: text,
        riasecCategory: 'R',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of competenciesI) {
      await Question.create({
        sectionId: competenciesSection.id,
        questionText: text,
        riasecCategory: 'I',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of competenciesA) {
      await Question.create({
        sectionId: competenciesSection.id,
        questionText: text,
        riasecCategory: 'A',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of competenciesS) {
      await Question.create({
        sectionId: competenciesSection.id,
        questionText: text,
        riasecCategory: 'S',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of competenciesE) {
      await Question.create({
        sectionId: competenciesSection.id,
        questionText: text,
        riasecCategory: 'E',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of competenciesC) {
      await Question.create({
        sectionId: competenciesSection.id,
        questionText: text,
        riasecCategory: 'C',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    console.log(`✅ Created ${questionIndex - 1} Competencies questions`);

    // SECTION 3: OCCUPATIONS (84 occupations - 14 per RIASEC category)
    const occupationsSection = await TestSection.create({
      testId: test.id,
      name: 'Occupations',
      nameSwati: 'Imisebensti',
      sectionType: 'occupations',
      description: 'Careers that interest me',
      descriptionSwati: 'Imisebensi lengiyitandvulako',
      instructions: 'This section concerns your feelings and attitudes regarding many kinds of work. Show the occupations/jobs that INTEREST or APPEAL TO you by shading YES. Show the occupations/jobs that you DISLIKE or FIND UNINTERESTING by shading NO.',
      instructionsSwati: 'Khombisa imisebensi lekutfwelako nge-YEBO. Khombisa leyo longatitfweli nge-CHA.',
      orderIndex: 3,
      isRequired: true
    });

    // Occupations - Realistic (R)
    const occupationsR = [
      'Aeroplane mechanic - maintains aeroplanes',
      'Fish and wildlife specialist - studies natural animal resources',
      'Motor mechanic - maintains and repairs motor vehicles',
      'Carpenter/Joiner - does woodwork',
      'Power shovel operator - runs shovel and large building and road equipment',
      'Filling station worker - pumps fuel, changes/deposits oil in vehicles at filling stations',
      'Farmer - works on a farm where crops are grown or livestock is bred and raised',
      'Surveyor - measures distances for buildings and roads',
      'Construction inspector - inspects new buildings to see that they meet certain requirements',
      'Radio operator - sends and receives radio messages',
      'Long distance bus driver - transports people over long distances',
      'Engine driver - runs trains',
      'Tool designer - designs tools to do new jobs',
      'Electrician - maintains and repairs electric wires and machinery'
    ];

    // Occupations - Investigative (I)
    const occupationsI = [
      'Meteorologist - studies the weather',
      'Biologist - studies plants and animals',
      'Astronomer - studies the stars',
      'Medical laboratory technician - works in a medical laboratory and provides information to the medical doctor',
      'Anthropologist - studies the beliefs, the past and present behaviour and the physical characteristics of people',
      'Zoologist - studies animals',
      'Chemist - studies composition and characteristics of materials and the processes they undergo',
      'Research scientist - conducts scientific experiments',
      'Mathematician - develops new mathematical principles, methods and relationships',
      'Geologist - studies the earth\'s physical aspects and history',
      'Botanist - studies plant life',
      'Medical scientist - conducts research into illnesses and the human body',
      'Physicist - investigates matter, space, time, energy and the relationships between them',
      'Writer of scientific articles - writes articles on science for magazines, books or encyclopedias'
    ];

    // Occupations - Artistic (A)
    const occupationsA = [
      'Poet - writes poetry',
      'Symphony conductor - conducts musicians who play in an orchestra',
      'Musician - plays musical instruments or sings',
      'Writer - writes books, plays, poetry and newspaper articles',
      'Actor/actress - acts in a play',
      'Freelance writer - writes stories for magazines, newspapers on a part-time basis',
      'Musical arranger - writes music for words someone has written',
      'Journalist - writes for a newspaper/magazine',
      'Commercial artist - promotes the sale of products by means of pictures, paintings and pieces of sculpture',
      'Concert singer - sings on the stage',
      'Composer or lyricist - writes music or words to music',
      'Sculptor/sculptress - carves/moulds statues from marble, metal, clay or wood',
      'Playwright - writes plays',
      'Cartoonist - draws comic strips or humorous drawings on sports and news events'
    ];

    // Occupations - Social (S)
    const occupationsS = [
      'Sociologist - examines the ways in which individuals in groups and groups themselves interact',
      'High school teacher - teaches one or two subjects to pupils in Standards 6 to 10',
      'Playground director - organizes games for young people at a playground',
      'Speech therapist - helps people correct and solve their speech problems',
      'Marriage counsellor - helps husbands and wives who are not happy together',
      'School principal - head of a school',
      'Psychiatric nurse - someone who cares for psychiatric patients in a hospital',
      'Clinical psychologist - helps people who are unhappy with their lives',
      'Social science teacher - teaches for example, history and geography',
      'Director of a welfare agency - head of an organization that gives social support to families or individuals in distress',
      'Youth organizer - organizes activities and takes responsibility for young people',
      'Counselling psychologist - helps individuals to deal with the problems that occur in everyday life',
      'Social worker - helps people to cope satisfactorily in their family and community life',
      'Vocational counsellor - someone who helps others decide what kind of work they would like to do'
    ];

    // Occupations - Enterprising (E)
    const occupationsE = [
      'Speculator - someone who takes risks with buying and selling to make money',
      'Buyer - purchases merchandise from manufacturers and wholesalers',
      'Advertising executive - does advertising for a business',
      'Manufacturer\'s representative - a salesperson who sells a company\'s products',
      'Television producer - produces TV shows',
      'Hotel manager - manages a hotel',
      'Business executive - owner or manager of a business',
      'Restaurant manager - runs a restaurant, hires the waiters and waitresses, cashiers and cooks',
      'Advocate - conducts civil and criminal cases in various courts of law',
      'Salesperson - person who sells goods and services',
      'Real estate salesperson - sells houses and property',
      'Personnel manager - gives advice and sees to it that personnel policies are carried out',
      'Sports promoter - arranges and publicizes sports events',
      'Sales manager - ensures that goods and services are sold'
    ];

    // Occupations - Conventional (C)
    const occupationsC = [
      'Bookkeeper - keeps track of how money is earned and spent in a business',
      'Business teacher - teaches business subjects at school, e.g. bookkeeping, commerce',
      'Data typist - uses a special typewriter to process information for immediate or future use',
      'Chartered accountant - inspects the correctness and completeness of the financial states and books of organizations',
      'Credit controller - checks if clients have credit value',
      'Court stenographer - records everything on tape said during courtroom trials',
      'Bank teller - receives and pays out money at a bank',
      'Tax expert - advises people on tax matters',
      'Inventory controller - takes stock of goods in a store or business at a certain time',
      'Typist - types letters, reports, etc. on a typewriter',
      'Financial analyst - works out if a person or business is spending money wisely',
      'Cost estimator - determines how much it will cost to do certain jobs',
      'Payroll clerk - calculates how much money people should be paid for their jobs',
      'Bank inspector - checks on bank personnel to see if they carry out their work'
    ];

    // Create all Occupations questions
    questionIndex = 1;
    
    for (const text of occupationsR) {
      await Question.create({
        sectionId: occupationsSection.id,
        questionText: text,
        riasecCategory: 'R',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of occupationsI) {
      await Question.create({
        sectionId: occupationsSection.id,
        questionText: text,
        riasecCategory: 'I',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of occupationsA) {
      await Question.create({
        sectionId: occupationsSection.id,
        questionText: text,
        riasecCategory: 'A',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of occupationsS) {
      await Question.create({
        sectionId: occupationsSection.id,
        questionText: text,
        riasecCategory: 'S',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of occupationsE) {
      await Question.create({
        sectionId: occupationsSection.id,
        questionText: text,
        riasecCategory: 'E',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    for (const text of occupationsC) {
      await Question.create({
        sectionId: occupationsSection.id,
        questionText: text,
        riasecCategory: 'C',
        questionType: 'yes_no',
        orderIndex: questionIndex++
      });
    }

    console.log(`✅ Created ${questionIndex - 1} Occupations questions`);

    // SECTION 4: SELF-ESTIMATES (12 ratings - 2 per RIASEC category)
    const selfEstimatesSection = await TestSection.create({
      testId: test.id,
      name: 'Self-Estimates',
      nameSwati: 'Kucabanga Ngesabelo Sakho',
      sectionType: 'self_estimates',
      description: 'How I rate my abilities',
      descriptionSwati: 'Kutsi ngibona kanjani emakhono ami',
      instructions: 'Rate yourself on a scale of 1 to 6 on each of these abilities or skills. Rate yourself as you really think you are when compared with other persons of your own age. Give the most accurate estimate of how you see yourself. Avoid giving yourself the same rating for each ability/skill.',
      instructionsSwati: 'Linganisa emakhono akho kusukela ku-1 kuya ku-7 (1=Kabi kakhulu, 6=Kuhle kakhulu).',
      orderIndex: 4,
      isRequired: true
    });

    // Self-Estimates Questions (Rating scale 1-6)
    const selfEstimatesQuestions = [
      { text: 'I rate my mechanical ability (fixing things, using tools and machines) as:', category: 'R', group: 1 },
      { text: 'I rate my manual skills as:', category: 'R', group: 2 },
      { text: 'I rate my scientific ability (biology, chemistry and problem solving) as:', category: 'I', group: 1 },
      { text: 'I rate my mathematical ability as:', category: 'I', group: 2 },
      { text: 'I rate my artistic ability (music, art and drama) as:', category: 'A', group: 1 },
      { text: 'I rate my musical ability as:', category: 'A', group: 2 },
      { text: 'I rate my teaching ability (helping others learn) as:', category: 'S', group: 1 },
      { text: 'I rate my friendliness as:', category: 'S', group: 2 },
      { text: 'I rate my sales ability (selling or managing) as:', category: 'E', group: 1 },
      { text: 'I rate my managerial skills as:', category: 'E', group: 2 },
      { text: 'I rate my clerical ability (numbers, spelling and filing papers) as:', category: 'C', group: 1 },
      { text: 'I rate my office skills as:', category: 'C', group: 2 }
    ];

    questionIndex = 1;
    for (const q of selfEstimatesQuestions) {
      await Question.create({
        sectionId: selfEstimatesSection.id,
        questionText: q.text,
        riasecCategory: q.category,
        questionType: 'rating_scale',
        scaleMin: 1,
        scaleMax: 6,
        scaleLabels: {
          1: 'Very Low',
          2: 'Low',
          3: 'Low Average',
          4: 'High Average',
          5: 'High',
          6: 'Very High'
        },
        orderIndex: questionIndex++,
        metadata: { group: q.group }
      });
    }

    console.log(`✅ Created ${questionIndex - 1} Self-Estimates questions`);
    console.log(`✅ Total SDS test created with ${(66 + 66 + 84 + 12)} questions across 4 sections`);
    
    return test;
    
  } catch (error) {
    console.error('❌ Error seeding complete SDS test:', error);
    throw error;
  }
};

module.exports = {
  seedCompleteSdsTest
};