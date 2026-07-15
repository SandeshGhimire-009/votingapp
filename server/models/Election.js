const { Schema, model } = require('mongoose');

const candidateSchema = new Schema(
  {
    id: { type: Number, required: true, index: true },
    name: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    party: { type: String, default: '' },
    bio: { type: String, default: '' },
    image: { type: String, default: '' },
    votes: { type: Number, default: 0 },
  },
  { _id: false }
);

const electionSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, default: 'upcoming' },
    resultsPublished: { type: Boolean, default: false },
    totalVotes: { type: Number, default: 0 },
    candidates: { type: [candidateSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = model('Election', electionSchema);
