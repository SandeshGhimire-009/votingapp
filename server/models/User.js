const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    studentId: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    profilePicture: { type: String, default: null },
    document: { type: Schema.Types.Mixed, default: null },
    hasVoted: { type: [Number], default: [] },
    isAdmin: { type: Boolean, default: false },
    accountStatus: { type: String, enum: ['pending', 'approved', 'suspended'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
