const Election = require('../models/Election');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { isMongoConnected } = require('../utils/db');

const requireDb = (res) => {
    if (!isMongoConnected()) {
        res.status(503).json({ message: 'Database is not connected' });
        return false;
    }
    return true;
};

const addElection = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const { title, description, startDate, endDate, candidates } = req.body;
        if (!title || !startDate || !endDate) {
            return res.status(400).json({ message: 'title, startDate, and endDate are required' });
        }
        const lastElection = await Election.findOne().sort({ id: -1 }).lean();
        const election = await Election.create({
            id: (lastElection?.id || 0) + 1,
            title,
            description: description || '',
            startDate,
            endDate,
            status: 'upcoming',
            totalVotes: 0,
            candidates: candidates || []
        });
        return res.status(201).json(election);
    } catch (err) {
        return next(err);
    }
};

const getElections = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const all = await Election.find().sort({ id: 1 }).lean();
        return res.json(all);
    } catch (err) {
        return next(err);
    }
};

const getElectionById = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const id = Number(req.params.id);
        const election = await Election.findOne({ id }).lean();
        if (!election) return res.status(404).json({ message: 'Election not found' });
        return res.json(election);
    } catch (err) {
        return next(err);
    }
};

const updateElection = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const id = Number(req.params.id);
        const election = await Election.findOneAndUpdate({ id }, req.body, { new: true, runValidators: true }).lean();
        if (!election) return res.status(404).json({ message: 'Election not found' });
        return res.json(election);
    } catch (err) {
        return next(err);
    }
};

const deleteElection = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const id = Number(req.params.id);
        const deleted = await Election.findOneAndDelete({ id }).lean();
        if (!deleted) return res.status(404).json({ message: 'Election not found' });
        await Vote.deleteMany({ electionId: id });
        await User.updateMany({}, { $pull: { hasVoted: id } });
        return res.json({ message: 'Election deleted' });
    } catch (err) {
        return next(err);
    }
};

const getCandidatesofElection = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const id = Number(req.params.id);
        const election = await Election.findOne({ id }).lean();
        if (!election) return res.status(404).json({ message: 'Election not found' });
        return res.json(election.candidates);
    } catch (err) {
        return next(err);
    }
};

const getElectionofVoters = async (req, res, next) => {
    try {
        if (!requireDb(res)) return;
        const id = Number(req.params.id);
        const election = await Election.findOne({ id }).lean();
        if (!election) return res.status(404).json({ message: 'Election not found' });

        const votes = await Vote.find({ electionId: id }).lean();
        const voterIds = [...new Set(votes.map(v => v.userId))];
        const voters = voterIds.length
            ? await User.find({ id: { $in: voterIds } }, { password: 0, _id: 0, __v: 0 }).lean()
            : [];

        return res.json({ election, voters });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    addElection,
    getElections,
    getElectionById,
    updateElection,
    deleteElection,
    getCandidatesofElection,
    getElectionofVoters
};
