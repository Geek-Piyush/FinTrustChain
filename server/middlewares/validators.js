import { body, param, validationResult } from "express-validator";

/**
 * Middleware that checks for validation errors from express-validator
 * and returns a 400 response with all error messages.
 * Must be placed AFTER validation chains in the route middleware stack.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      success: false,
      message: messages.join(". "),
      errors: errors.array(),
    });
  }
  next();
};

// ─── Helper: validate MongoDB ObjectId in body field ───
const isMongoId = (field, label = field) =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label} is required.`)
    .isMongoId()
    .withMessage(`${label} must be a valid ID.`);

// ─── Helper: validate MongoDB ObjectId in URL param ───
const isParamMongoId = (field, label = field) =>
  param(field).isMongoId().withMessage(`${label} must be a valid ID.`);

// ═══════════════════════════════════════════════════════
// AUTH VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required."),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidationErrors,
];

export const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Please provide your email address.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  handleValidationErrors,
];

export const validateResetPassword = [
  body("password")
    .notEmpty()
    .withMessage("Please provide a new password.")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("Please confirm your new password."),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// LOAN BROCHURE VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateCreateBrochure = [
  body("amount")
    .notEmpty()
    .withMessage("Loan amount is required.")
    .isFloat({ min: 100, max: 50000 })
    .withMessage("Loan amount must be between ₹100 and ₹50,000.")
    .toFloat(),
  body("interestRate")
    .notEmpty()
    .withMessage("Interest rate is required.")
    .isFloat({ min: 0.1, max: 36 })
    .withMessage("Interest rate must be between 0.1% and 36%.")
    .toFloat(),
  body("tenorDays")
    .notEmpty()
    .withMessage("Tenor is required.")
    .isInt({ min: 7, max: 365 })
    .withMessage("Tenor must be between 7 and 365 days.")
    .toInt(),
  handleValidationErrors,
];

export const validateUpdateBrochure = [
  body("amount")
    .optional()
    .isFloat({ min: 100, max: 50000 })
    .withMessage("Loan amount must be between ₹100 and ₹50,000.")
    .toFloat(),
  body("interestRate")
    .optional()
    .isFloat({ min: 0.1, max: 36 })
    .withMessage("Interest rate must be between 0.1% and 36%.")
    .toFloat(),
  body("tenorDays")
    .optional()
    .isInt({ min: 7, max: 365 })
    .withMessage("Tenor must be between 7 and 365 days.")
    .toInt(),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// LOAN REQUEST VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateCreateLoanRequest = [
  body("brochureIds")
    .isArray({ min: 1, max: 3 })
    .withMessage("You must select between 1 and 3 brochures."),
  body("brochureIds.*")
    .isMongoId()
    .withMessage("Each brochure ID must be valid."),
  isMongoId("guarantorId", "Guarantor ID"),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// GUARANTOR REQUEST VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateCreateGuarantorRequest = [
  isMongoId("guarantorId", "Guarantor ID"),
  isMongoId("loanRequestId", "Loan request ID"),
  handleValidationErrors,
];

export const validateRespondGuarantorRequest = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required.")
    .isIn(["ACCEPTED", "DECLINED"])
    .withMessage("Status must be 'ACCEPTED' or 'DECLINED'."),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// ENDORSEMENT VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateCreateEndorsement = [
  isMongoId("receiverId", "Receiver ID"),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// USER VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateUpdateMe = [
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters."),
  body("upiId")
    .optional()
    .trim()
    .matches(/[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/)
    .withMessage("Please provide a valid UPI ID."),
  body("lenderCapital")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Capital must be a non-negative number.")
    .toFloat(),
  handleValidationErrors,
];

export const validateSubscribe = [
  body("plan")
    .trim()
    .notEmpty()
    .withMessage("Plan is required.")
    .isIn(["LENDER", "RECEIVER"])
    .withMessage("Plan must be 'LENDER' or 'RECEIVER'."),
  body("duration")
    .trim()
    .notEmpty()
    .withMessage("Duration is required.")
    .isIn(["BIMONTHLY", "ANNUAL"])
    .withMessage("Duration must be 'BIMONTHLY' or 'ANNUAL'."),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// PAYMENT VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateCreatePayment = [
  isMongoId("contractId", "Contract ID"),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// SUPPORT VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateSubmitTicket = [
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required.")
    .isLength({ min: 3, max: 200 })
    .withMessage("Subject must be between 3 and 200 characters."),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required.")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters."),
  body("contractId")
    .optional()
    .isMongoId()
    .withMessage("Contract ID must be a valid ID."),
  handleValidationErrors,
];

// ═══════════════════════════════════════════════════════
// ADMIN VALIDATORS
// ═══════════════════════════════════════════════════════

export const validateUpdateContractStatus = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required.")
    .isIn([
      "PENDING_SIGNATURES",
      "AWAITING_DISBURSAL",
      "AWAITING_RECEIPT_CONFIRMATION",
      "ACTIVE",
      "REPAID",
      "DEFAULT",
    ])
    .withMessage("Invalid contract status."),
  handleValidationErrors,
];
