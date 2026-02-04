const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// User validation
const validateUser = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
];

// Customer validation
const validateCustomer = [
    body('name')
        .notEmpty()
        .withMessage('Customer name is required'),
    body('mobile')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Please provide a valid 10-digit mobile number'),
    body('gstNumber')
        .optional({ checkFalsy: true })
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage('Please provide a valid GST number'),
    handleValidationErrors
];

// Product validation
const validateProduct = [
    body('name')
        .notEmpty()
        .withMessage('Product name is required'),
    body('companyName')
        .notEmpty()
        .withMessage('Company name is required'),
    body('batchNo')
        .notEmpty()
        .withMessage('Batch number is required'),
    body('expiryDate')
        .isISO8601()
        .withMessage('Please provide a valid expiry date'),
    body('packing')
        .notEmpty()
        .withMessage('Packing details are required'),
    body('hsnCode')
        .notEmpty()
        .withMessage('HSN code is required'),
    body('gstPercentage')
        .isFloat({ min: 0, max: 100 })
        .withMessage('GST percentage must be between 0 and 100'),
    body('purchasePrice')
        .isFloat({ min: 0 })
        .withMessage('Purchase price must be a positive number'),
    body('sellingPrice')
        .isFloat({ min: 0 })
        .withMessage('Selling price must be a positive number'),
    body('stockQuantity')
        .isInt({ min: 0 })
        .withMessage('Stock quantity must be a non-negative integer'),
    handleValidationErrors
];

// Invoice validation
const validateInvoice = [
    body('customerId')
        .notEmpty()
        .isUUID()
        .withMessage('Valid customer ID is required'),
    body('items')
        .isArray({ min: 1 })
        .withMessage('At least one item is required'),
    body('items.*.productId')
        .notEmpty()
        .isUUID()
        .withMessage('Valid product ID is required for each item'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1 for each item'),
    body('freight')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Freight must be a positive number'),
    body('discount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount must be a positive number'),
    handleValidationErrors
];

module.exports = {
    validateUser,
    validateCustomer,
    validateProduct,
    validateInvoice,
    handleValidationErrors
};
