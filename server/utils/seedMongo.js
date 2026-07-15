const User = require('../models/User');
const Election = require('../models/Election');
const { users, elections } = require('./data');
const bcrypt = require('bcryptjs');

const isBcryptHash = (value) => typeof value === 'string' && value.startsWith('$2');
const HASH_ROUNDS = 10;

const buildSeedUser = async (seedUser) => ({
  ...seedUser,
  password: isBcryptHash(seedUser.password) ? seedUser.password : await bcrypt.hash(seedUser.password, HASH_ROUNDS),
  accountStatus: seedUser.accountStatus || (seedUser.isAdmin ? 'approved' : 'pending'),
});

const repairLegacyPlaintextUsers = async () => {
  const allUsers = await User.find({}).lean();

  for (const currentUser of allUsers) {
    if (isBcryptHash(currentUser.password)) continue;

    const replacement = {
      ...currentUser,
      password: await bcrypt.hash(String(currentUser.password || ''), HASH_ROUNDS),
    };

    const { _id, __v, ...safeReplacement } = replacement;
    await User.findByIdAndUpdate(_id, safeReplacement, { runValidators: true });
  }
};

const replacePlaintextSeedUsers = async () => {
  for (const seedUser of users) {
    const existing = await User.findOne({ email: seedUser.email.toLowerCase().trim() }).lean();
    if (!existing || isBcryptHash(existing.password)) continue;

    await User.deleteOne({ _id: existing._id });
    const prepared = await buildSeedUser(seedUser);
    await User.create(prepared);
  }
};

const seedMongoIfEmpty = async () => {
  const [userCount, electionCount] = await Promise.all([
    User.countDocuments(),
    Election.countDocuments(),
  ]);

  if (userCount === 0 && users.length > 0) {
    const preparedUsers = await Promise.all(users.map((user) => buildSeedUser(user)));
    await User.insertMany(preparedUsers);
  } else {
    await replacePlaintextSeedUsers();
    await repairLegacyPlaintextUsers();
  }

  if (electionCount === 0 && elections.length > 0) {
    await Election.insertMany(elections);
  }
};

module.exports = { seedMongoIfEmpty };
