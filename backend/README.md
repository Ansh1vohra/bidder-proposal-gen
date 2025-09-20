# Bidder Proposal Generation Backend

AI-powered tender bidding and proposal generation platform backend API.

## 🚀 Features

- **AI Proposal Generation**: Automated proposal creation using Google Gemini AI
- **Tender Scraping**: Web scraping to collect tender data from multiple sources
- **Smart Recommendations**: AI-powered tender and bidder matching using vector embeddings
- **Payment Integration**: Subscription management with Stripe
- **User Management**: Comprehensive user profiles and authentication
- **API Documentation**: Auto-generated Swagger documentation

## 🛠️ Technology Stack

- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **AI/ML**: Google Gemini AI, Natural Language Processing, Simple Vector Embeddings
- **Web Scraping**: Puppeteer, Cheerio, Axios
- **Payment**: Stripe
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Database connection
│   │   └── swagger.js   # API documentation config
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   │   └── errorHandler.js
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── users.js     # User management routes
│   │   ├── tenders.js   # Tender routes
│   │   ├── proposals.js # Proposal generation routes
│   │   ├── payments.js  # Payment routes
│   │   ├── scraping.js  # Web scraping routes
│   │   └── recommendations.js # Recommendation routes
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
│       └── logger.js    # Logging utility
├── logs/                # Log files
├── uploads/             # File uploads
├── server.js            # Main server file
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
└── README.md           # This file
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (>=18.0.0)
- MongoDB (local or cloud)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   - Database connection string
   - JWT secrets
   - API keys (OpenAI, payment gateways)
   - Email configuration
   - Other service credentials

4. **Start MongoDB**
   Make sure MongoDB is running on your system or update the connection string for cloud MongoDB.

5. **Run the application**
   
   **Development mode** (with auto-reload):
   ```bash
   npm run dev
   ```
   
   **Production mode**:
   ```bash
   npm start
   ```

## 📊 API Documentation

Once the server is running in development mode, you can access:

- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 🔐 Environment Variables

Key environment variables to configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/bidder-proposal-db |
| `JWT_SECRET` | JWT signing secret | - |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |

See `.env.example` for complete list.

## 🏗️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Tenders
- `GET /api/tenders` - Get tenders with filtering
- `GET /api/tenders/:id` - Get tender details

### Proposals
- `POST /api/proposals/generate` - Generate AI proposal
- `GET /api/proposals` - Get user proposals
- `GET /api/proposals/:id` - Get proposal details
- `POST /api/proposals/:id/submit` - Submit proposal

### Payments
- `POST /api/payments/create-subscription` - Create subscription
- `GET /api/payments/subscription-status` - Get subscription status
- `POST /api/payments/webhook` - Payment webhook

### Scraping
- `POST /api/scraping/start` - Start scraping process
- `GET /api/scraping/status` - Get scraping status
- `GET /api/scraping/sources` - Get available sources

### Recommendations
- `GET /api/recommendations/tenders` - Get tender recommendations
- `GET /api/recommendations/bidders` - Get bidder recommendations
- `POST /api/recommendations/update-preferences` - Update preferences

## 🔍 Development

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Logging

The application uses Winston for structured logging:
- Console output in development
- File logging in `logs/` directory
- Different log levels (error, warn, info, debug)

### Error Handling

Global error handling middleware catches and processes:
- Mongoose validation errors
- JWT token errors
- File upload errors
- Payment processing errors
- Custom application errors

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up proper logging
4. Configure reverse proxy (nginx)
5. Set up SSL certificates
6. Configure monitoring

### Production Considerations
- Use PM2 for process management
- Set up database backups
- Configure log rotation
- Monitor API performance
- Set up health checks
- Configure load balancing if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Email: support@civilytix.com
- Documentation: /api-docs
- Issues: Create an issue in the repository

---

**Note**: This is the backend API for the Bidder Proposal Generation platform. Make sure to also set up the frontend application for the complete system.
