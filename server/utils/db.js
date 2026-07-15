const mongoose = require('mongoose');

const isMongoConnected = () => mongoose.connection.readyState === 1;

module.exports = { isMongoConnected };
