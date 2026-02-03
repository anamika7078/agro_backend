const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validateInvoice } = require('../utils/validators');
const {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice
} = require('../controllers/invoiceController');

// All routes are protected
router.use(auth);

// Routes
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', validateInvoice, createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
