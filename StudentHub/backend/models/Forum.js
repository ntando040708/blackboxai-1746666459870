const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  university: { type: String, required: true },
  faculty: { type: String, required: true },
  course: { type: String, required: true },
  threads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
}, { timestamps: true });

const Forum = mongoose.model('Forum', forumSchema);

module.exports = Forum;
