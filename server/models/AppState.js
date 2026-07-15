const { Schema, model } = require('mongoose');

const appStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = model('AppState', appStateSchema);
