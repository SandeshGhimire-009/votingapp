const AppState = require('../models/AppState');
const { isMongoConnected } = require('../utils/db');

const ALLOWED_KEYS = new Set([
  'reality-voting-users',
  'reality-voting-contests',
  'reality-voting-contestants',
  'reality-voting-contestant-requests',
  'reality-voting-documents',
  'reality-voting-votes',
  'reality-voting-user-votes',
  'reality-voting-notifications',
  'reality-voting-announcements',
  'reality-voting-requests',
  'reality-voting-settings',
  'reality-voting-badges',
  'reality-voting-logs',
]);

const ensureDb = (res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return false;
  }
  return true;
};

const validateKey = (res, key) => {
  if (!ALLOWED_KEYS.has(key)) {
    res.status(400).json({ message: 'Unsupported state key' });
    return false;
  }
  return true;
};

const getState = async (req, res, next) => {
  try {
    if (!ensureDb(res)) return;

    const { key } = req.params;
    if (!validateKey(res, key)) return;

    const state = await AppState.findOne({ key }).lean();
    if (!state) {
      return res.json({ key, found: false, value: null });
    }

    return res.json({ key, found: true, value: state.value });
  } catch (err) {
    return next(err);
  }
};

const setState = async (req, res, next) => {
  try {
    if (!ensureDb(res)) return;

    const { key } = req.params;
    if (!validateKey(res, key)) return;

    const { value } = req.body;

    const updated = await AppState.findOneAndUpdate(
      { key },
      { key, value },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ key: updated.key, value: updated.value });
  } catch (err) {
    return next(err);
  }
};

const getStates = async (req, res, next) => {
  try {
    if (!ensureDb(res)) return;

    const keys = Array.isArray(req.body?.keys) ? req.body.keys : [];
    const validKeys = keys.filter((key) => ALLOWED_KEYS.has(key));

    const docs = await AppState.find({ key: { $in: validKeys } }).lean();
    const byKey = {};
    docs.forEach((doc) => {
      byKey[doc.key] = doc.value;
    });

    const response = validKeys.map((key) => ({
      key,
      found: Object.prototype.hasOwnProperty.call(byKey, key),
      value: Object.prototype.hasOwnProperty.call(byKey, key) ? byKey[key] : null,
    }));

    return res.json({ items: response });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getState, setState, getStates };
