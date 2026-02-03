const { prisma } = require('../config/database');
const amountToWords = require('../utils/amountToWords');

// Generate invoice number
const generateInvoiceNumber = async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    // Count invoices for this month
    const count = await prisma.invoice.count({
        where: {
            date: {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1)
            }
        }
    });

    const serial = String(count + 1).padStart(4, '0');
    return `INV/${year}/${month}/${serial}`;
};

// Get all invoices
const getInvoices = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, startDate, endDate } = req.query;
        const skip = (page - 1) * limit;

        let where = {};

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { customer: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { date: 'desc' },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            mobile: true
                        }
                    },
                    _count: {
                        select: { items: true }
                    }
                }
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({
            invoices,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Server error fetching invoices' });
    }
};

// Get single invoice
const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({ invoice });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Server error fetching invoice' });
    }
};

// Create invoice
const createInvoice = async (req, res) => {
    try {
        const { customerId, items, freight = 0, discount = 0 } = req.body;

        // Validate customer exists
        const customer = await prisma.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Calculate totals and validate stock
        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        const invoiceItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId }
            });

            if (!product) {
                return res.status(404).json({ error: `Product not found: ${item.productId}` });
            }

            if (product.stockQuantity < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Required: ${item.quantity}`
                });
            }

            const amount = product.sellingPrice * item.quantity;
            const gstAmount = amount * (product.gstPercentage / 100);
            const cgst = gstAmount / 2;
            const sgst = gstAmount / 2;
            const totalAmount = amount + gstAmount;

            subtotal += amount;
            totalCgst += cgst;
            totalSgst += sgst;

            invoiceItems.push({
                productId: product.id,
                quantity: item.quantity,
                rate: product.sellingPrice,
                amount,
                gstPercentage: product.gstPercentage,
                cgst,
                sgst,
                totalAmount
            });
        }

        const totalGst = totalCgst + totalSgst;
        const grandTotal = subtotal + totalGst + parseFloat(freight) - parseFloat(discount);

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber();

        // Create invoice with items in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create invoice
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    customerId,
                    subtotal,
                    cgst: totalCgst,
                    sgst: totalSgst,
                    totalGst,
                    freight: parseFloat(freight),
                    discount: parseFloat(discount),
                    grandTotal,
                    amountInWords: amountToWords(grandTotal)
                }
            });

            // Create invoice items
            for (const item of invoiceItems) {
                await tx.invoiceItem.create({
                    data: {
                        invoiceId: invoice.id,
                        ...item
                    }
                });

                // Update product stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity
                        }
                    }
                });
            }

            return invoice;
        });

        // Fetch complete invoice with relations
        const completeInvoice = await prisma.invoice.findUnique({
            where: { id: result.id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.status(201).json({
            message: 'Invoice created successfully',
            invoice: completeInvoice
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Server error creating invoice' });
    }
};

// Update invoice (limited updates - only freight, discount, status)
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { freight, discount, status } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Recalculate totals if freight or discount changed
        const newFreight = freight !== undefined ? parseFloat(freight) : invoice.freight;
        const newDiscount = discount !== undefined ? parseFloat(discount) : invoice.discount;
        const newGrandTotal = invoice.subtotal + invoice.totalGst + newFreight - newDiscount;

        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: {
                freight: newFreight,
                discount: newDiscount,
                grandTotal: newGrandTotal,
                amountInWords: amountToWords(newGrandTotal),
                status: status || invoice.status
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        res.json({
            message: 'Invoice updated successfully',
            invoice: updatedInvoice
        });
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ error: 'Server error updating invoice' });
    }
};

// Delete invoice (with stock restoration)
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Delete invoice and restore stock in a transaction
        await prisma.$transaction(async (tx) => {
            // Restore stock for each item
            for (const item of invoice.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            increment: item.quantity
                        }
                    }
                });
            }

            // Delete invoice items first (foreign key constraint)
            await tx.invoiceItem.deleteMany({
                where: { invoiceId: id }
            });

            // Delete invoice
            await tx.invoice.delete({
                where: { id }
            });
        });

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ error: 'Server error deleting invoice' });
    }
};

module.exports = {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice
};
