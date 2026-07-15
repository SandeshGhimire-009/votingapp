require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { users } = require('../utils/data');

const HASH_ROUNDS = 10;

const normalizeSeedUser = async (seedUser) => ({
  ...seedUser,
  email: String(seedUser.email || '').toLowerCase().trim(),
  password: String(seedUser.password || '').startsWith('$2')
    ? seedUser.password
    : await bcrypt.hash(String(seedUser.password || ''), HASH_ROUNDS),
  accountStatus: seedUser.accountStatus || (seedUser.isAdmin ? 'approved' : 'pending'),
});

const run = async () => {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error('MONGO_URL is required');
  }

  await mongoose.connect(mongoUrl);

  for (const seedUser of users) {
    const normalized = await normalizeSeedUser(seedUser);
    await User.deleteMany({ email: normalized.email });
    await User.create(normalized);
    console.log(`Seeded user: ${normalized.email}`);
  }

  await mongoose.connection.close();
  console.log('User reseed complete');
};

run().catch(async (error) => {
  console.error('User reseed failed:', error.message);
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(1);
});
