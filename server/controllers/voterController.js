///register new voters
//POST:api/voters/register
///UNPROTECTED
const User = require('../models/User');
const { isMongoConnected } = require('../utils/db');
const bcrypt = require('bcryptjs');

const PASSWORD_HASH_ROUNDS = 10;

const isBcryptHash = (value) => typeof value === 'string' && value.startsWith('$2');

const requireDb = (res) => {
    if (!isMongoConnected()) {
        res.status(503).json({ message: 'Database is not connected' });
        return false;
    }
    return true;
};

const registerVoter = async(req, res, next) => {
    try {
        if (!requireDb(res)) return;
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Invalid request body' });
        }

        const { email, password, name, phoneNumber, profilePicture, document, role } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'name, email and password are required' });
        }

        if (typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
            return res.status(400).json({ message: 'Invalid input type for name, email or password' });
        }

        if (profilePicture !== undefined && profilePicture !== null && typeof profilePicture !== 'string') {
            return res.status(400).json({ message: 'Invalid profile picture format' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedName = name.trim();

        if (!normalizedEmail || !normalizedName || password.length < 6) {
            return res.status(400).json({ message: 'Invalid registration details' });
        }

        const exists = await User.findOne({ email: normalizedEmail }).lean();
        if (exists) return res.status(409).json({ message: 'User already exists' });

        const lastUser = await User.findOne().sort({ id: -1 }).lean();
        const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
        const isAdmin = role === 'admin';
        const user = await User.create({
            id: (lastUser?.id || 0) + 1,
            email: normalizedEmail,
            password: passwordHash,
            name: normalizedName,
            phoneNumber: phoneNumber || '',
            profilePicture: profilePicture || null,
            document: document || null,
            hasVoted: [],
            isAdmin,
            accountStatus: 'pending',
        });

        const { password: _pw, ...safeUser } = user.toObject();
        return res.status(201).json(safeUser);
    } catch (err) {
        if (err?.code === 11000) {
            return res.status(409).json({ message: 'User already exists' });
        }
        if (err?.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        return next(err);
    }
}

///register new voters
//POST:api/voters/lOGIN
///UNPROTECTED
const loginVoter = async(req, res, next) => {
    try {
        if (!requireDb(res)) return;
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Invalid request body' });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        let isValidPassword = false;
        if (isBcryptHash(user.password)) {
            isValidPassword = await bcrypt.compare(password, user.password);
        } else {
            isValidPassword = user.password === password;
            if (isValidPassword) {
                user.password = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
                await user.save();
            }
        }

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.isAdmin && user.accountStatus !== 'approved') {
            return res.status(403).json({ message: 'Admin account is pending approval' });
        }

        const { password: _pw, ...safeUser } = user.toObject();
        return res.json({ success: true, user: safeUser });
    } catch (err) {
        return next(err);
    }
}

const getVoterByid = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const id = Number(req.params.id);
        const user = await User.findOne({ id }).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { password: _pw, ...safeUser } = user;
        return res.json(safeUser);
    } catch (err) {
        return next(err);
    }
}

const updateVoterProfile = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;

        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!req.user.isAdmin && Number(req.user.id) !== id) {
            return res.status(403).json({ message: 'You can only update your own profile' });
        }

        const { name, email, phoneNumber, profilePicture } = req.body || {};
        const updates = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({ message: 'Invalid name' });
            }
            updates.name = name.trim();
        }

        if (email !== undefined) {
            if (typeof email !== 'string' || !email.trim()) {
                return res.status(400).json({ message: 'Invalid email' });
            }
            const normalizedEmail = email.toLowerCase().trim();
            const existing = await User.findOne({ email: normalizedEmail }).lean();
            if (existing && Number(existing.id) !== id) {
                return res.status(409).json({ message: 'Email already exists' });
            }
            updates.email = normalizedEmail;
        }

        if (phoneNumber !== undefined) {
            updates.phoneNumber = typeof phoneNumber === 'string' ? phoneNumber : '';
        }

        if (profilePicture !== undefined) {
            if (profilePicture !== null && typeof profilePicture !== 'string') {
                return res.status(400).json({ message: 'Invalid profile picture format' });
            }
            updates.profilePicture = profilePicture || null;
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: 'No valid profile fields provided' });
        }

        const updatedUser = await User.findOneAndUpdate({ id }, updates, { new: true, runValidators: true }).lean();
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password: _pw, __v: _v, _id: _id, ...safeUser } = updatedUser;
        return res.json(safeUser);
    } catch (err) {
        return next(err);
    }
}

const getVoters = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const users = await User.find({}, { password: 0, __v: 0, _id: 0 }).sort({ id: 1 }).lean();
        return res.json(users);
    } catch (err) {
        return next(err);
    }
}

const updateVoterStatusByAdmin = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;

        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        const { accountStatus } = req.body || {};
        const allowedStatuses = new Set(['pending', 'approved', 'suspended']);
        if (!allowedStatuses.has(accountStatus)) {
            return res.status(400).json({ message: 'Invalid account status' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { id },
            { accountStatus },
            { new: true }
        ).lean();

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password: _pw, __v: _v, _id: _id, ...safeUser } = updatedUser;
        return res.json(safeUser);
    } catch (err) {
        return next(err);
    }
}

module.exports = { registerVoter, loginVoter, getVoterByid, updateVoterProfile, getVoters, updateVoterStatusByAdmin };
