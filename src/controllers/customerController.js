const { prisma } = require('../config/database');

// Get all customers
const getCustomers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const where = search ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search, mode: 'insensitive' } }
            ]
        } : {};

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { invoices: true }
                    }
                }
            }),
            prisma.customer.count({ where })
        ]);

        res.json({
            customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);

        // If it's a transaction error, return empty customers for now
        if (error.code === 'P2031') {
            return res.json({
                customers: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0
                }
            });
        }

        res.status(500).json({ error: 'Server error fetching customers' });
    }
};

// Get single customer
const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                invoices: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        date: true,
                        grandTotal: true,
                        status: true
                    },
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Server error fetching customer' });
    }
};

// Create customer
const createCustomer = async (req, res) => {
    try {
        const { name, address, mobile, gstNumber } = req.body;

        // Check if mobile number already exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { mobile }
        });

        if (existingCustomer) {
            return res.status(400).json({ error: 'Mobile number already exists' });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                address,
                mobile,
                gstNumber
            }
        });

        res.status(201).json({
            message: 'Customer created successfully',
            customer
        });
    } catch (error) {
        console.error('Create customer error:', error);

        res.status(500).json({ error: 'Server error creating customer' });
    }
};

// Update customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, mobile, gstNumber } = req.body;

        // Check if customer exists
        const existingCustomer = await prisma.customer.findUnique({
            where: { id }
        });

        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Check if mobile number is being changed and if it already exists
        if (mobile !== existingCustomer.mobile) {
            const mobileExists = await prisma.customer.findUnique({
                where: { mobile }
            });

            if (mobileExists) {
                return res.status(400).json({ error: 'Mobile number already exists' });
            }
        }

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                address,
                mobile,
                gstNumber
            }
        });

        res.json({
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Server error updating customer' });
    }
};

// Delete customer
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if customer has invoices
        const invoiceCount = await prisma.invoice.count({
            where: { customerId: id }
        });

        if (invoiceCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete customer with existing invoices'
            });
        }

        await prisma.customer.delete({
            where: { id }
        });

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Server error deleting customer' });
    }
};

module.exports = {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
