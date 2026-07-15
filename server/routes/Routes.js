const { Router } = require('express');
const { registerVoter, loginVoter, getVoterByid, updateVoterProfile, getVoters, updateVoterStatusByAdmin } = require('../controllers/voterController');
const { addElection, getElections, getElectionById, updateElection, 
          deleteElection,
     getCandidatesofElection,
     getElectionofVoters } = require('../controllers/electionController');

const { addCandidate, getCandidate, removeCandidate, voteCandidate } = require('../controllers/candidateContoller');    
const { getResults } = require('../controllers/resultsController');
const { getSummary } = require('../controllers/adminController');
const { getState, setState, getStates } = require('../controllers/stateController');
const { sendVerificationCode, verifyCode, getDebugCode } = require('../controllers/emailVerificationController');
const { attachUser, requireAdmin } = require('../middleware/authMiddleware');
const router = Router();

// Attach user (reads x-user-id header)
router.use(attachUser);

// Email verification routes
router.post('/send-verification-code', sendVerificationCode);
router.post('/verify-code', verifyCode);
router.get('/debug-code', getDebugCode); // Development only

router.post('/voters/register', registerVoter);
router.post('/voters/login', loginVoter);
router.get('/voters/:id', getVoterByid);
router.patch('/voters/:id', updateVoterProfile);

router.post('/elections', addElection);
router.get('/elections', getElections);
router.get('/elections/:id', getElectionById);
router.patch('/elections/:id', updateElection);
router.delete('/elections/:id', deleteElection);
router.get('/elections/:id/candidates', getCandidatesofElection);
router.get('/elections/:id/voters', getElectionofVoters);

router.post('/candidates', addCandidate);
router.get('/candidates/:id', getCandidate);
router.delete('/candidates/:id', removeCandidate);
router.post('/candidates/:id/vote', voteCandidate);

router.get('/', (req, res) => {
    res.json('this is connected....');
});

router.get('/results', getResults);

router.get('/state/:key', getState);
router.put('/state/:key', setState);
router.post('/state/bulk', getStates);

// Admin-only routes (requireAdmin)
router.post('/admin/elections', requireAdmin, addElection);
router.patch('/admin/elections/:id', requireAdmin, updateElection);
router.delete('/admin/elections/:id', requireAdmin, deleteElection);
router.post('/admin/candidates', requireAdmin, addCandidate);
router.delete('/admin/candidates/:id', requireAdmin, removeCandidate);
router.get('/admin/summary', requireAdmin, getSummary);
router.get('/admin/users', requireAdmin, getVoters);
router.patch('/admin/users/:id/status', requireAdmin, updateVoterStatusByAdmin);

module.exports = router;
