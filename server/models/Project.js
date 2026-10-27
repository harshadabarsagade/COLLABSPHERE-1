const mongoose = require('mongoose');
const crypto = require('crypto');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isPublic: { type: Boolean, default: false },
    publicId: { type: String, unique: true, sparse: true },
    readme: { type: String, default: '' },
  },
  { timestamps: true }
);

projectSchema.methods.generatePublicId = function () {
  this.publicId = crypto.randomBytes(8).toString('hex');
};

module.exports = mongoose.model('Project', projectSchema);
