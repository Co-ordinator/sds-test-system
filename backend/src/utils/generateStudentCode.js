const { User } = require('../models');

/**
 * Generate a unique student code (universal login number)
 * Format: SDS + 6 random digits = SDS123456
 * This code is used by all user types (school, university, professional) for login
 */
const generateStudentCode = async (transaction = null) => {
  const prefix = 'SDS';
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate 6 random digits
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `${prefix}${randomDigits}`;
    
    // Check if code already exists
    const existing = await User.findOne({
      where: { studentCode: code },
      transaction
    });
    
    if (!existing) {
      return code;
    }
  }
  
  // Fallback: use timestamp-based code if random generation fails
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

module.exports = { generateStudentCode };
