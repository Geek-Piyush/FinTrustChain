import multer from "multer";
import { sendSupportEmail } from "../utils/email.js";

// ── Multer: in-memory storage for attachments ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

export const uploadAttachments = upload.array("attachments", 3);

// POST /api/v1/support
export const submitTicket = async (req, res, next) => {
  try {
    const { subject, description, contractId } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: "Subject and description are required.",
      });
    }

    const supportAddr =
      process.env.SUPPORT_EMAIL || process.env.GMAIL_USER || "support@fintrustchain.example";

    await sendSupportEmail(supportAddr, {
      userName: req.user.name,
      userEmail: req.user.email,
      subject,
      description,
      contractId: contractId || null,
      attachments: req.files || [],
    });

    res.status(200).json({
      success: true,
      message: "Support ticket submitted. We'll get back to you soon.",
    });
  } catch (error) {
    next(error);
  }
};
