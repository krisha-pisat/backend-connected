/**
 * Script to fix database indexes for RetentionRule collection
 * This removes the problematic 'dataType' index that prevents multiple rules
 * Usage: node scripts/fixDatabaseIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const RetentionRule = require('../models/RetentionRule');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/glitchguard';

async function fixDatabaseIndexes() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the RetentionRule collection to remove all bad indexes
    console.log('🗑️  Dropping RetentionRule collection...');
    await mongoose.connection.db.collection('retentionrules').drop().catch(err => {
      if (err.code === 26) {
        console.log('ℹ️  Collection does not exist, nothing to drop');
      } else {
        throw err;
      }
    });

    // Now recreate the collection with proper schema
    console.log('🔄 Recreating collection with proper indexes...');
    await RetentionRule.createIndexes();
    console.log('✅ Collection recreated with proper indexes');

    // List all indexes
    const indexes = await RetentionRule.collection.getIndexes();
    console.log('\n📋 Current indexes:');
    console.log(JSON.stringify(indexes, null, 2));

    console.log('\n✨ Database fixed successfully!');
    console.log('🚀 You can now create multiple retention rules');
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

fixDatabaseIndexes();

