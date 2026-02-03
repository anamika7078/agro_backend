const { prisma } = require('../config/database');

// Get all products
const getProducts = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, lowStock = false } = req.query;
        const skip = (page - 1) * limit;

        let where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
                { batchNo: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (lowStock === 'true') {
            where.stockQuantity = { lte: 10 };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Server error fetching products' });
    }
};

// Get single product
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error fetching product' });
    }
};

// Create product
const createProduct = async (req, res) => {
    try {
        const {
            name,
            companyName,
            batchNo,
            expiryDate,
            packing,
            hsnCode,
            gstPercentage,
            purchasePrice,
            sellingPrice,
            stockQuantity
        } = req.body;

        // Check if batch number already exists
        const existingProduct = await prisma.product.findUnique({
            where: { batchNo }
        });

        if (existingProduct) {
            return res.status(400).json({ error: 'Batch number already exists' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                companyName,
                batchNo,
                expiryDate: new Date(expiryDate),
                packing,
                hsnCode,
                gstPercentage: parseFloat(gstPercentage),
                purchasePrice: parseFloat(purchasePrice),
                sellingPrice: parseFloat(sellingPrice),
                stockQuantity: parseInt(stockQuantity)
            }
        });

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Server error creating product' });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            companyName,
            batchNo,
            expiryDate,
            packing,
            hsnCode,
            gstPercentage,
            purchasePrice,
            sellingPrice,
            stockQuantity
        } = req.body;

        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if batch number is being changed and if it already exists
        if (batchNo !== existingProduct.batchNo) {
            const batchExists = await prisma.product.findUnique({
                where: { batchNo }
            });

            if (batchExists) {
                return res.status(400).json({ error: 'Batch number already exists' });
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                companyName,
                batchNo,
                expiryDate: new Date(expiryDate),
                packing,
                hsnCode,
                gstPercentage: parseFloat(gstPercentage),
                purchasePrice: parseFloat(purchasePrice),
                sellingPrice: parseFloat(sellingPrice),
                stockQuantity: parseInt(stockQuantity)
            }
        });

        res.json({
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Server error updating product' });
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product has invoice items
        const invoiceItemCount = await prisma.invoiceItem.count({
            where: { productId: id }
        });

        if (invoiceItemCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete product with existing invoice items'
            });
        }

        await prisma.product.delete({
            where: { id }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error deleting product' });
    }
};

// Get low stock products
const getLowStockProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                stockQuantity: {
                    lte: 10
                }
            },
            orderBy: {
                stockQuantity: 'asc'
            }
        });

        res.json({ products });
    } catch (error) {
        console.error('Get low stock products error:', error);
        res.status(500).json({ error: 'Server error fetching low stock products' });
    }
};

// Update stock
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, operation } = req.body; // operation: 'add' or 'subtract'

        const product = await prisma.product.findUnique({
            where: { id }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let newStock;
        if (operation === 'add') {
            newStock = product.stockQuantity + parseInt(quantity);
        } else if (operation === 'subtract') {
            newStock = product.stockQuantity - parseInt(quantity);
            if (newStock < 0) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid operation' });
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { stockQuantity: newStock }
        });

        res.json({
            message: 'Stock updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Server error updating stock' });
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getLowStockProducts,
    updateStock
};
