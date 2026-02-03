const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { validateProduct } = require('../utils/validators');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    updateStock
} = require('../controllers/productController');

// All routes are protected
router.use(auth);

// Routes
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProduct);
router.post('/', validateProduct, createProduct);
router.put('/:id', validateProduct, updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', updateStock);

module.exports = router;
