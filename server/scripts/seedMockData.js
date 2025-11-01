/**
 * Script to seed the database with mock error data for testing
 * Usage: node scripts/seedMockData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ErrorLog = require('../models/ErrorLog');
const RetentionRule = require('../models/RetentionRule');
const { generateErrors, createRepeatedErrorScenario } = require('../utils/mockData');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/glitchguard';

async function seedData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await ErrorLog.deleteMany({});
    await RetentionRule.deleteMany({});
    console.log('✅ Cleared existing data');

    // Generate mock errors
    console.log('📝 Generating mock error logs...');
    const errors = generateErrors(20);
    
    // Add some repeated errors to test email alerts
    const repeatedErrors = createRepeatedErrorScenario(
      'notification-service',
      'Email service unavailable - SMTP connection refused',
      5
    );

    const allErrors = [...errors, ...repeatedErrors];
    
    // Add timestamps to make some errors older (for archival testing)
    const now = new Date();
    for (let i = 0; i < allErrors.length; i++) {
      if (i < 5) {
        // Make first 5 errors old (35 days ago) for archival testing
        allErrors[i].createdAt = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
        allErrors[i].updatedAt = allErrors[i].createdAt;
      } else {
        // Recent errors with slight time differences
        allErrors[i].createdAt = new Date(now.getTime() - i * 60 * 1000);
        allErrors[i].updatedAt = allErrors[i].createdAt;
      }
    }

    await ErrorLog.insertMany(allErrors);
    console.log(`✅ Created ${allErrors.length} error logs`);

    // Create sample retention rules
    console.log('📋 Creating retention rules...');
    const rules = [
      {
        name: 'Archive Low Severity Errors',
        description: 'Automatically archive low severity errors after 30 days',
        conditions: {
          severity: ['low'],
          service: [],
          errorType: []
        },
        retentionDuration: 30,
        retentionUnit: 'days',
        retentionDays: 30,
        autoArchive: true,
        isActive: true
      },
      {
        name: 'Archive Browser Errors',
        description: 'Archive browser errors after 90 days',
        conditions: {
          severity: ['low', 'medium'],
          service: ['frontend-app'],
          errorType: ['browser']
        },
        retentionDuration: 90,
        retentionUnit: 'days',
        retentionDays: 90,
        autoArchive: true,
        isActive: true
      },
      {
        name: 'Archive Critical Errors Quickly',
        description: 'Archive critical errors after 10 minutes (demo rule)',
        conditions: {
          severity: ['critical'],
          service: [],
          errorType: []
        },
        retentionDuration: 10,
        retentionUnit: 'minutes',
        retentionDays: 10 / (60 * 24),
        autoArchive: true,
        isActive: true
      },
      {
        name: 'Archive All Errors After 180 Days',
        description: 'Archive all errors regardless of severity after 180 days',
        conditions: {
          severity: [],
          service: [],
          errorType: []
        },
        retentionDuration: 180,
        retentionUnit: 'days',
        retentionDays: 180,
        autoArchive: true,
        isActive: true
      }
    ];

    await RetentionRule.insertMany(rules);
    console.log(`✅ Created ${rules.length} retention rules`);

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Error Logs: ${allErrors.length}`);
    console.log(`   - Retention Rules: ${rules.length}`);
    console.log('\n🚀 You can now start the server with: npm start');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedData();
