# Agro Billing System Backend

Node.js API server for the Agro Product/Medicine Billing System with MongoDB database.

## Features

- JWT Authentication
- Customer Management
- Product Inventory
- Invoice Generation
- GST Calculations
- Comprehensive Reports
- Stock Management
- Data Validation

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB configuration

# Set up database
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

## Environment Variables

```env
DATABASE_URL="mongodb://localhost:27017/agro_billing"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000

# Shop Details
SHOP_NAME="Agro Medical Store"
SHOP_ADDRESS="123 Main Road, City - 123456"
SHOP_GST="29AAAPL1234C1ZV"
SHOP_PHONE="+91 9876543210"

# Bank Details
BANK_NAME="State Bank of India"
BANK_ACCOUNT="1234567890123456"
BANK_IFSC="SBIN0001234"
```

## API Documentation

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/setup-admin` - Create default admin

### Customers
- `GET /api/customers` - List customers with pagination and search
- `POST /api/customers` - Create new customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - List products with pagination and search
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products
- `PATCH /api/products/:id/stock` - Update product stock

### Invoices
- `GET /api/invoices` - List invoices with pagination and filters
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Reports
- `GET /api/reports/daily-sales` - Daily sales report
- `GET /api/reports/monthly-sales` - Monthly sales report
- `GET /api/reports/gst` - GST report
- `GET /api/reports/customer-sales` - Customer sales report
- `GET /api/reports/product-sales` - Product sales report

## Database Schema

### Collections (MongoDB)
- **users**: Authentication with ObjectId
- **customers**: Customer data with ObjectId references
- **products**: Product inventory with ObjectId
- **invoices**: Invoice headers with ObjectId references
- **invoice_items**: Invoice line items with ObjectId

### Key Changes from MySQL
- All IDs are now MongoDB ObjectIds
- Foreign key references use ObjectId strings
- No auto-increment integers
- Relationships handled at application level

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio

**Note**: For MongoDB, use `npx prisma db push` instead of migrate commands.

## Security Features

- JWT token authentication
- Password hashing with bcryptjs
- Input validation with express-validator
- Rate limiting
- CORS configuration
- Helmet security headers

## Error Handling

- Centralized error handling middleware
- Proper HTTP status codes
- Detailed error messages in development
- Sanitized error messages in production

## Validation

All inputs are validated using express-validator:
- Customer data validation
- Product data validation
- Invoice data validation
- GST number format validation
- Mobile number validation
