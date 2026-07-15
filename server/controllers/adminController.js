const Election = require('../models/Election');
const User = require('../models/User');
const { isMongoConnected } = require('../utils/db');

const requireDb = (res) => {
    if (!isMongoConnected()) {
        res.status(503).json({ message: 'Database is not connected' });
        return false;
    }
    return true;
};

const getSummary = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const [electionDocs, userDocs] = await Promise.all([
            Election.find().sort({ id: 1 }).lean(),
            User.find().lean(),
        ]);

        const summary = {
            totalElections: electionDocs.length,
            totalUsers: userDocs.length,
            totalVotes: electionDocs.reduce((sum, e) => sum + e.totalVotes, 0),
            elections: electionDocs.map(e => ({
                id: e.id,
                title: e.title,
                totalVotes: e.totalVotes,
                candidateCount: e.candidates.length
            }))
        };
        return res.json(summary);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getSummary };
