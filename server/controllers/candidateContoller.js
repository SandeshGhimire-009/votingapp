const Election = require('../models/Election');
const User = require('../models/User');
const Vote = require('../models/Vote');
const { isMongoConnected } = require('../utils/db');

const requireDb = (res) => {
    if (!isMongoConnected()) {
        res.status(503).json({ message: 'Database is not connected' });
        return false;
    }
    return true;
};

const addCandidate = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const { electionId, name, position, party, bio, image } = req.body;
        if (!electionId || !name || !position) {
            return res.status(400).json({ message: 'electionId, name, and position are required' });
        }

        const election = await Election.findOne({ id: Number(electionId) });
        if (!election) return res.status(404).json({ message: 'Election not found' });

        // Candidate ids are global because vote/remove APIs target candidate id directly.
        const electionCandidates = await Election.find({}, { candidates: 1, _id: 0 }).lean();
        const maxId = electionCandidates.reduce((max, doc) => {
            const localMax = (doc.candidates || []).reduce((m, c) => Math.max(m, Number(c.id) || 0), 0);
            return Math.max(max, localMax);
        }, 0);

        const candidate = {
            id: maxId + 1,
            name,
            position,
            party: party || '',
            bio: bio || '',
            image: image || '',
            votes: 0
        };
        election.candidates.push(candidate);
        await election.save();
        return res.status(201).json(candidate);
    } catch (err) {
        return next(err);
    }
};

const getCandidate = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const id = Number(req.params.id);
        const election = await Election.findOne({ 'candidates.id': id }, { candidates: 1, _id: 0 }).lean();
        const candidate = election?.candidates?.find(c => c.id === id) || null;
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
        return res.json(candidate);
    } catch (err) {
        return next(err);
    }
};

const removeCandidate = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;

        const id = Number(req.params.id);
        const election = await Election.findOne({ 'candidates.id': id });

        if (!election) return res.status(404).json({ message: 'Candidate not found' });

        const beforeCount = election.candidates.length;
        
        election.candidates = election.candidates.filter(c => c.id !== id);

        if (election.candidates.length === beforeCount) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        await election.save();
        await Vote.deleteMany({ electionId: election.id, candidateId: id });
        return res.json({ message: 'Candidate removed' });
    } catch (err) {
        return next(err);
    }
};

const voteCandidate = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const candidateId = Number(req.params.id);
        const userId = req.user?.id || Number(req.body.userId);
        if (!userId) return res.status(400).json({ message: 'User is required to vote' });

        const election = await Election.findOne({ 'candidates.id': candidateId });
        if (!election) return res.status(404).json({ message: 'Candidate not found' });

        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        try {
            await Vote.create({

                electionId: election.id,
                candidateId,
                userId,
                algorithm: req.body.algorithm || 'plurality',

                confidenceScore: typeof req.body.confidenceScore === 'number' ? req.body.confidenceScore : null,


            });
        } catch (error) {
            if (error?.code === 11000) {
                return res.status(409).json({ message: 'You have already voted in this election' });
            }
            throw error;
        }

        await Election.updateOne(
            { id: election.id, 'candidates.id': candidateId },
            { $inc: { 'candidates.$.votes': 1, totalVotes: 1 } }
        );

        await User.updateOne({ id: userId }, { $addToSet: { hasVoted: election.id } });

        const refreshedElection = await Election.findOne({ id: election.id }).lean();
        const candidate = refreshedElection?.candidates?.find(c => c.id === candidateId);

        return res.json({ message: 'Vote recorded', candidate });
    } catch (err) {
        return next(err);
    }
};

module.exports = { addCandidate, getCandidate, removeCandidate, voteCandidate };
