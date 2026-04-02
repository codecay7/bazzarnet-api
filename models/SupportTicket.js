import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['customer', 'vendor', 'admin', 'guest'], default: 'guest' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Resolved', 'Closed'], default: 'Open' },
  adminNotes: { type: String }, // For admin to add notes
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
}, {
  timestamps: true,
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;