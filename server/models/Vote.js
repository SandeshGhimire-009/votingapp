const { Schema, model } = require('mongoose');

const voteSchema = new Schema(
  {
    electionId: { type: Number, required: true, index: true },
    candidateId: { type: Number, required: true, index: true },
    userId: { type: Number, required: true, index: true },
    algorithm: { type: String, default: 'plurality' },
    confidenceScore: { type: Number, default: null },
  },
  { timestamps: true }
);

voteSchema.index({ electionId: 1, userId: 1 }, { unique: true });

module.exports = model('Vote', voteSchema);
