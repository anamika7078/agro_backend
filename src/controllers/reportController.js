const { prisma } = require('../config/database');

// Daily sales report
const getDailySalesReport = async (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0] } = req.query;

        const startDate = new Date(date + 'T00:00:00');
        const endDate = new Date(date + 'T23:59:59');

        const invoices = await prisma.invoice.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        mobile: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                batchNo: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        const summary = {
            totalInvoices: invoices.length,
            totalSales: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
            totalGST: invoices.reduce((sum, inv) => sum + inv.totalGst, 0),
            totalCGST: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
            totalSGST: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
            totalDiscount: invoices.reduce((sum, inv) => sum + inv.discount, 0),
            totalFreight: invoices.reduce((sum, inv) => sum + inv.freight, 0)
        };

        res.json({
            date,
            summary,
            invoices
        });
    } catch (error) {
        console.error('Daily sales report error:', error);
        res.status(500).json({ error: 'Server error generating daily sales report' });
    }
};

// Monthly sales report
const getMonthlySalesReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        const currentDate = new Date();
        const reportMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
        const reportYear = year ? parseInt(year) : currentDate.getFullYear();

        const startDate = new Date(reportYear, reportMonth, 1);
        const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59);

        const invoices = await prisma.invoice.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        mobile: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                batchNo: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Group by day
        const dailyData = {};
        invoices.forEach(invoice => {
            const day = invoice.date.getDate();
            if (!dailyData[day]) {
                dailyData[day] = {
                    date: `${reportYear}-${String(reportMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                    invoices: [],
                    totalSales: 0,
                    totalGST: 0,
                    count: 0
                };
            }
            dailyData[day].invoices.push(invoice);
            dailyData[day].totalSales += invoice.grandTotal;
            dailyData[day].totalGST += invoice.totalGst;
            dailyData[day].count += 1;
        });

        const summary = {
            month: reportMonth + 1,
            year: reportYear,
            totalInvoices: invoices.length,
            totalSales: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
            totalGST: invoices.reduce((sum, inv) => sum + inv.totalGst, 0),
            totalCGST: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
            totalSGST: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
            totalDiscount: invoices.reduce((sum, inv) => sum + inv.discount, 0),
            totalFreight: invoices.reduce((sum, inv) => sum + inv.freight, 0),
            averageSale: invoices.length > 0 ? invoices.reduce((sum, inv) => sum + inv.grandTotal, 0) / invoices.length : 0
        };

        res.json({
            summary,
            dailyData: Object.values(dailyData)
        });
    } catch (error) {
        console.error('Monthly sales report error:', error);
        res.status(500).json({ error: 'Server error generating monthly sales report' });
    }
};

// GST report
const getGSTReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let where = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                customer: {
                    select: {
                        name: true,
                        gstNumber: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                hsnCode: true,
                                gstPercentage: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Group by GST percentage
        const gstSummary = {};
        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                const gstRate = item.product.gstPercentage;
                if (!gstSummary[gstRate]) {
                    gstSummary[gstRate] = {
                        gstRate,
                        taxableAmount: 0,
                        cgst: 0,
                        sgst: 0,
                        totalGST: 0
                    };
                }
                gstSummary[gstRate].taxableAmount += item.amount;
                gstSummary[gstRate].cgst += item.cgst;
                gstSummary[gstRate].sgst += item.sgst;
                gstSummary[gstRate].totalGST += item.cgst + item.sgst;
            });
        });

        const summary = {
            totalTaxableAmount: Object.values(gstSummary).reduce((sum, item) => sum + item.taxableAmount, 0),
            totalCGST: Object.values(gstSummary).reduce((sum, item) => sum + item.cgst, 0),
            totalSGST: Object.values(gstSummary).reduce((sum, item) => sum + item.sgst, 0),
            totalGST: Object.values(gstSummary).reduce((sum, item) => sum + item.totalGST, 0)
        };

        res.json({
            period: { startDate, endDate },
            summary,
            gstBreakup: Object.values(gstSummary),
            invoices
        });
    } catch (error) {
        console.error('GST report error:', error);
        res.status(500).json({ error: 'Server error generating GST report' });
    }
};

// Customer-wise sales history
const getCustomerSalesHistory = async (req, res) => {
    try {
        const { customerId, startDate, endDate } = req.query;

        let where = {};
        if (customerId) {
            where.customerId = parseInt(customerId);
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                customer: true,
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                batchNo: true
                            }
                        }
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // Group by customer
        const customerData = {};
        invoices.forEach(invoice => {
            const customerId = invoice.customerId;
            if (!customerData[customerId]) {
                customerData[customerId] = {
                    customer: invoice.customer,
                    invoices: [],
                    totalSales: 0,
                    totalInvoices: 0,
                    totalGST: 0
                };
            }
            customerData[customerId].invoices.push(invoice);
            customerData[customerId].totalSales += invoice.grandTotal;
            customerData[customerId].totalInvoices += 1;
            customerData[customerId].totalGST += invoice.totalGst;
        });

        res.json({
            customers: Object.values(customerData),
            summary: {
                totalCustomers: Object.keys(customerData).length,
                totalSales: Object.values(customerData).reduce((sum, cust) => sum + cust.totalSales, 0),
                totalInvoices: Object.values(customerData).reduce((sum, cust) => sum + cust.totalInvoices, 0)
            }
        });
    } catch (error) {
        console.error('Customer sales history error:', error);
        res.status(500).json({ error: 'Server error generating customer sales history' });
    }
};

// Product-wise sales report
const getProductSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let where = {};
        if (startDate || endDate) {
            where.invoice = {
                date: {}
            };
            if (startDate) where.invoice.date.gte = new Date(startDate);
            if (endDate) where.invoice.date.lte = new Date(endDate + 'T23:59:59');
        }

        const invoiceItems = await prisma.invoiceItem.findMany({
            where,
            include: {
                product: true,
                invoice: {
                    select: {
                        date: true,
                        invoiceNumber: true,
                        customer: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Group by product
        const productData = {};
        invoiceItems.forEach(item => {
            const productId = item.productId;
            if (!productData[productId]) {
                productData[productId] = {
                    product: item.product,
                    totalQuantity: 0,
                    totalAmount: 0,
                    totalGST: 0,
                    invoices: []
                };
            }
            productData[productId].totalQuantity += item.quantity;
            productData[productId].totalAmount += item.amount;
            productData[productId].totalGST += item.cgst + item.sgst;
            productData[productId].invoices.push({
                invoiceNumber: item.invoice.invoiceNumber,
                date: item.invoice.date,
                customerName: item.invoice.customer.name,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount
            });
        });

        res.json({
            products: Object.values(productData).sort((a, b) => b.totalAmount - a.totalAmount),
            summary: {
                totalProducts: Object.keys(productData).length,
                totalQuantity: Object.values(productData).reduce((sum, prod) => sum + prod.totalQuantity, 0),
                totalAmount: Object.values(productData).reduce((sum, prod) => sum + prod.totalAmount, 0),
                totalGST: Object.values(productData).reduce((sum, prod) => sum + prod.totalGST, 0)
            }
        });
    } catch (error) {
        console.error('Product sales report error:', error);
        res.status(500).json({ error: 'Server error generating product sales report' });
    }
};

module.exports = {
    getDailySalesReport,
    getMonthlySalesReport,
    getGSTReport,
    getCustomerSalesHistory,
    getProductSalesReport
};
