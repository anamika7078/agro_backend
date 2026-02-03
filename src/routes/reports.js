const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    getDailySalesReport,
    getMonthlySalesReport,
    getGSTReport,
    getCustomerSalesHistory,
    getProductSalesReport
} = require('../controllers/reportController');

// All routes are protected
router.use(auth);

// Routes
router.get('/daily-sales', getDailySalesReport);
router.get('/monthly-sales', getMonthlySalesReport);
router.get('/gst', getGSTReport);
router.get('/customer-sales', getCustomerSalesHistory);
router.get('/product-sales', getProductSalesReport);

module.exports = router;
