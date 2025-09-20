const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bidder Proposal Generation API',
      version: '1.0.0',
      description: 'AI-powered tender bidding and proposal generation platform API using Google Gemini',
      contact: {
        name: 'Civilytix',
        email: 'support@civilytix.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.civilytix.com' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            userType: {
              type: 'string',
              enum: ['bidder', 'admin'],
              description: 'Type of user'
            },
            profile: {
              type: 'object',
              description: 'User profile information'
            },
            subscription: {
              type: 'object',
              description: 'User subscription details'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Tender: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Tender ID'
            },
            title: {
              type: 'string',
              description: 'Tender title'
            },
            description: {
              type: 'string',
              description: 'Tender description'
            },
            category: {
              type: 'string',
              description: 'Tender category'
            },
            location: {
              type: 'string',
              description: 'Tender location'
            },
            budget: {
              type: 'number',
              description: 'Tender budget'
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              description: 'Submission deadline'
            },
            status: {
              type: 'string',
              enum: ['open', 'closed', 'awarded'],
              description: 'Tender status'
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tender requirements'
            },
            documents: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Tender documents'
            },
            source: {
              type: 'string',
              description: 'Source website where tender was found'
            },
            scrapedAt: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Proposal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Proposal ID'
            },
            tenderId: {
              type: 'string',
              description: 'Associated tender ID'
            },
            userId: {
              type: 'string',
              description: 'Bidder user ID'
            },
            content: {
              type: 'object',
              description: 'AI-generated proposal content'
            },
            status: {
              type: 'string',
              enum: ['draft', 'submitted', 'reviewed', 'accepted', 'rejected'],
              description: 'Proposal status'
            },
            aiConfidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'AI confidence score for the proposal'
            },
            customizations: {
              type: 'object',
              description: 'User customizations to the AI proposal'
            },
            submittedAt: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to the API files
};

module.exports = swaggerOptions;
