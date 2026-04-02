import asyncHandler from '../middleware/asyncHandler.js';
import { sendEmail } from '../services/emailService.js';
import env from '../config/env.js';
import SupportTicket from '../models/SupportTicket.js'; // Import new model

// @desc    Submit a support request
// @route   POST /api/support/submit
// @access  Public
const submitSupportRequest = asyncHandler(async (req, res) => {
  const { name, email, role, subject, message } = req.body;

  // Save the support request to the database
  const newTicket = await SupportTicket.create({
    name,
    email,
    role,
    subject,
    message,
    status: 'Open', // Default status
  });

  // Construct the email content for the admin
  const adminEmailHtml = `
    <p>Dear Admin,</p>
    <p>A new support request has been submitted:</p>
    <ul>
      <li><strong>Ticket ID:</strong> ${newTicket._id}</li>
      <li><strong>From:</strong> ${name} (${email})</li>
      <li><strong>Role:</strong> ${role}</li>
      <li><strong>Subject:</strong> ${subject}</li>
      <li><strong>Message:</strong></li>
    </ul>
    <p style="white-space: pre-wrap; border: 1px solid #eee; padding: 10px; background-color: #f9f9f9;">${message}</p>
    <p>Please investigate and respond to the user as soon as possible.</p>
    <p>BazzarNet Support System</p>
  `;

  try {
    // Send email to the admin
    await sendEmail(
      env.ADMIN_EMAIL, // Admin's email address from environment variables
      `New Support Request: ${subject} (from ${name})`,
      `New support request from ${name} (${email}) regarding: ${subject}`,
      adminEmailHtml
    );
    res.status(200).json({ message: 'Your support request has been submitted successfully. We will get back to you shortly.', ticketId: newTicket._id });
  } catch (error) {
    console.error('Error sending support email to admin:', error);
    // Even if email fails, the ticket is saved in DB.
    res.status(500);
    throw new Error('Failed to send support request. Please try again later.');
  }
});

// @desc    Get all support requests (Admin only)
// @route   GET /api/support/admin
// @access  Private/Admin
const getAllSupportRequests = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  let query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } },
    ];
  }

  const tickets = await SupportTicket.find(query)
    .sort({ createdAt: -1 }); // Latest first

  res.json(tickets);
});

// @desc    Update support ticket status (Admin only)
// @route   PUT /api/support/admin/:id/status
// @access  Private/Admin
const updateSupportTicketStatus = asyncHandler(async (req, res) => {
  const { id: ticketId } = req.params;
  const { status, adminNotes } = req.body;

  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    res.status(404);
    throw new Error('Support ticket not found.');
  }

  ticket.status = status || ticket.status;
  ticket.adminNotes = adminNotes || ticket.adminNotes;

  if (status === 'Resolved' && !ticket.resolvedAt) {
    ticket.resolvedAt = Date.now();
    ticket.resolvedBy = req.user._id; // Admin who resolved it
  } else if (status !== 'Resolved') {
    ticket.resolvedAt = undefined;
    ticket.resolvedBy = undefined;
  }

  const updatedTicket = await ticket.save();

  res.json({ message: `Ticket ${ticketId} status updated to ${updatedTicket.status}.`, ticket: updatedTicket });
});

export { submitSupportRequest, getAllSupportRequests, updateSupportTicketStatus };