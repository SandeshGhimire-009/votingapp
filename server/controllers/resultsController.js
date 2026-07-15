const Election = require('../models/Election');
const { isMongoConnected } = require('../utils/db');

const requireDb = (res) => {
    if (!isMongoConnected()) {
        res.status(503).json({ message: 'Database is not connected' });
        return false;
    }
    return true;
};

const getResults = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const electionDocs = await Election.find().sort({ id: 1 }).lean();
        const results = electionDocs.map(election => ({
            id: election.id,
            title: election.title,
            resultsPublished: election.resultsPublished,
            totalVotes: election.totalVotes,
            candidates: election.candidates.map(c => ({
                id: c.id,
                name: c.name,
                position: c.position,
                votes: c.votes,
                percentage: election.totalVotes > 0 ? ((c.votes / election.totalVotes) * 100).toFixed(2) : 0
            }))
        }));
        return res.json(results);
    } catch (err) {
        return next(err);
    }
};

module.exports = { getResults };
