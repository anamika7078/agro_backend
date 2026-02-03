const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validateCustomer } = require('../utils/validators');
const {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer
} = require('../controllers/customerController');

// All routes are protected
router.use(auth);

// Routes
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', validateCustomer, createCustomer);
router.put('/:id', validateCustomer, updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
