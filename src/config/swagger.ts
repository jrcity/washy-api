/**
 * Swagger/OpenAPI Configuration
 * Complete API documentation for Washy Laundry API
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { CONFIGS } from '@/constants/configs.constant';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Washy Laundry API',
      version: '1.0.0',
      description: `
## Overview
Multi-branch laundry management system API with real-time order tracking, payment processing, and delivery management.

## Features
- 🔐 JWT-based authentication with role-based access control
- 📦 Complete order lifecycle management
- 💳 Paystack payment integration
- 🚚 Rider assignment and delivery tracking
- 🏢 Multi-branch support with coverage zones
- 📱 Push notification support

## Authentication
Most endpoints require authentication via Bearer token. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## User Roles
| Role | Description |
|------|-------------|
| \`customer\` | Regular customers who place orders |
| \`rider\` | Delivery personnel |
| \`staff\` | Branch staff managing orders |
| \`branch_manager\` | Branch managers with elevated permissions |
| \`admin\` | System administrators |
| \`super_admin\` | Full system access |
      `,
      contact: {
        name: 'Washy Support',
        email: 'support@washy.com.ng'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${CONFIGS.APP.PORT}/api/v1`,
        description: 'Development server'
      },
      {
        url: 'https://api.washy.com.ng/api/v1',
        description: 'Production server'
      }
    ],
    tags: [
      { name: 'Health', description: 'API health check' },
      { name: 'Auth', description: 'Authentication & user management' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Branches', description: 'Branch management' },
      { name: 'Services', description: 'Service & pricing management' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Notifications', description: 'User notifications' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: { 
              type: 'array', 
              items: { type: 'object' },
              description: 'Validation errors (if any)'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 }
          }
        },

        // Address schema
        Address: {
          type: 'object',
          required: ['street', 'area', 'city', 'state'],
          properties: {
            street: { type: 'string', example: '15 Ahmadu Bello Way' },
            area: { type: 'string', example: 'Central Business District' },
            city: { type: 'string', example: 'Kaduna' },
            state: { type: 'string', example: 'Kaduna' },
            landmark: { type: 'string', example: 'Near City Gate' },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 10.5105 },
                lng: { type: 'number', example: 7.4165 }
              }
            }
          }
        },

        // User schemas
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'phone', 'password'],
          properties: {
            name: { type: 'string', example: 'John Doe', minLength: 2 },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+2348012345678' },
            password: { type: 'string', minLength: 6, example: 'SecurePass123' },
            address: { $ref: '#/components/schemas/Address' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'customer@example.com' },
            password: { type: 'string', example: 'Customer@123' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            phone: { type: 'string', example: '+2348012345678' },
            role: { 
              type: 'string', 
              enum: ['customer', 'rider', 'staff', 'branch_manager', 'admin', 'super_admin'],
              example: 'customer'
            },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
              }
            }
          }
        },

        // Branch schemas
        Branch: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Washy Kaduna Main' },
            code: { type: 'string', example: 'KAD-001' },
            address: { $ref: '#/components/schemas/Address' },
            coverageZones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Sabon Gari' },
                  state: { type: 'string', example: 'Kaduna' }
                }
              }
            },
            contactPhone: { type: 'string', example: '+2348012345001' },
            contactEmail: { type: 'string', example: 'main@washy.com.ng' },
            isActive: { type: 'boolean', example: true }
          }
        },
        CreateBranchInput: {
          type: 'object',
          required: ['name', 'code', 'address', 'contactPhone', 'contactEmail'],
          properties: {
            name: { type: 'string', example: 'Washy New Branch' },
            code: { type: 'string', example: 'KAD-004' },
            address: { $ref: '#/components/schemas/Address' },
            contactPhone: { type: 'string', example: '+2348012345010' },
            contactEmail: { type: 'string', format: 'email', example: 'new@washy.com.ng' },
            coverageZones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  state: { type: 'string' }
                }
              }
            }
          }
        },

        // Service schemas
        ServicePricing: {
          type: 'object',
          properties: {
            garmentType: { 
              type: 'string', 
              enum: ['shirt', 'trouser', 'suit', 'dress', 'duvet', 'curtain', 'bedsheet', 'towel', 'skirt', 'underwear', 'blanket', 'jacket', 'native_attire', 'other'],
              example: 'shirt'
            },
            basePrice: { type: 'number', example: 200, description: 'Price in Naira' },
            expressMultiplier: { type: 'number', example: 1.5 }
          }
        },
        Service: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Wash & Fold' },
            slug: { type: 'string', example: 'wash-and-fold' },
            description: { type: 'string', example: 'Professional washing and folding service' },
            category: { 
              type: 'string', 
              enum: ['laundry', 'graphics_design', 'dry_cleaning', 'alteration', 'shoe_care', 'household'],
              example: 'laundry'
            },
            serviceType: { 
              type: 'string',
              enum: ['wash_and_fold', 'wash_and_iron', 'dry_clean', 'express', 'starch', 'iron_only'],
              example: 'wash_and_fold'
            },
            pricing: { 
              type: 'array', 
              items: { $ref: '#/components/schemas/ServicePricing' }
            },
            estimatedDuration: {
              type: 'object',
              properties: {
                standard: { type: 'number', example: 48, description: 'Hours' },
                express: { type: 'number', example: 24, description: 'Hours' }
              }
            },
            isExpressAvailable: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true }
          }
        },
        CreateServiceInput: {
          type: 'object',
          required: ['name', 'description', 'serviceType', 'pricing'],
          properties: {
            name: { type: 'string', example: 'Premium Wash' },
            description: { type: 'string', example: 'Premium washing service' },
            category: { type: 'string', example: 'laundry' },
            serviceType: { type: 'string', example: 'wash_and_fold' },
            pricing: { type: 'array', items: { $ref: '#/components/schemas/ServicePricing' } },
            isExpressAvailable: { type: 'boolean', example: true }
          }
        },
        CalculatePriceInput: {
          type: 'object',
          required: ['serviceId', 'items'],
          properties: {
            serviceId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  garmentType: { type: 'string', example: 'shirt' },
                  quantity: { type: 'integer', example: 5 },
                  isExpress: { type: 'boolean', example: false }
                }
              }
            }
          }
        },

        // Order schemas
        OrderItem: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            serviceType: { type: 'string', example: 'wash_and_fold' },
            garmentType: { type: 'string', example: 'shirt' },
            quantity: { type: 'integer', example: 3 },
            unitPrice: { type: 'number', example: 200 },
            subtotal: { type: 'number', example: 600 },
            isExpress: { type: 'boolean', example: false }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string', example: 'CF-20260103-0001' },
            customer: { $ref: '#/components/schemas/User' },
            branch: { $ref: '#/components/schemas/Branch' },
            items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            pickupDate: { type: 'string', format: 'date-time' },
            pickupTimeSlot: { type: 'string', example: '09:00-12:00' },
            expectedDeliveryDate: { type: 'string', format: 'date-time' },
            pickupAddress: { $ref: '#/components/schemas/Address' },
            deliveryAddress: { $ref: '#/components/schemas/Address' },
            subtotal: { type: 'number', example: 2500 },
            discount: { type: 'number', example: 0 },
            deliveryFee: { type: 'number', example: 500 },
            total: { type: 'number', example: 3000 },
            status: { 
              type: 'string',
              enum: ['pending', 'confirmed', 'picked_up', 'in_process', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
              example: 'pending'
            },
            isPaid: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateOrderInput: {
          type: 'object',
          required: ['branchId', 'items', 'pickupDate', 'pickupTimeSlot', 'pickupAddress', 'deliveryAddress'],
          properties: {
            branchId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['serviceId', 'garmentType', 'quantity'],
                properties: {
                  serviceId: { type: 'string' },
                  garmentType: { type: 'string', example: 'shirt' },
                  quantity: { type: 'integer', minimum: 1, example: 3 },
                  isExpress: { type: 'boolean', example: false },
                  notes: { type: 'string', example: 'Handle with care' }
                }
              }
            },
            pickupDate: { type: 'string', format: 'date-time', example: '2026-01-04T09:00:00Z' },
            pickupTimeSlot: { type: 'string', example: '09:00-12:00' },
            pickupAddress: { $ref: '#/components/schemas/Address' },
            deliveryAddress: { $ref: '#/components/schemas/Address' },
            customerNotes: { type: 'string', example: 'Please call before pickup' },
            discountCode: { type: 'string', example: 'SAVE10' }
          }
        },
        UpdateOrderStatusInput: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { 
              type: 'string',
              enum: ['pending', 'confirmed', 'picked_up', 'in_process', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
              example: 'confirmed'
            },
            notes: { type: 'string', example: 'Order confirmed and scheduled for pickup' }
          }
        },
        AssignRiderInput: {
          type: 'object',
          required: ['riderId', 'type'],
          properties: {
            riderId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            type: { type: 'string', enum: ['pickup', 'delivery'], example: 'pickup' }
          }
        },

        // Payment schemas
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            order: { type: 'string' },
            customer: { type: 'string' },
            amount: { type: 'number', example: 3000 },
            currency: { type: 'string', example: 'NGN' },
            method: { 
              type: 'string',
              enum: ['card', 'bank_transfer', 'ussd', 'cash'],
              example: 'card'
            },
            status: { 
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
              example: 'pending'
            },
            paystackReference: { type: 'string', example: 'CF_abc123_XYZ' },
            paystackAuthorizationUrl: { type: 'string', example: 'https://checkout.paystack.com/...' }
          }
        },
        InitializePaymentInput: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            method: { 
              type: 'string',
              enum: ['card', 'bank_transfer', 'ussd'],
              example: 'card'
            },
            callbackUrl: { type: 'string', example: 'https://yourapp.com/payment/callback' }
          }
        },

        // Notification schema
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recipient: { type: 'string' },
            title: { type: 'string', example: 'Order Confirmed' },
            message: { type: 'string', example: 'Your order CF-20260103-0001 has been confirmed' },
            type: { 
              type: 'string',
              enum: ['order_status', 'payment', 'promotion', 'system'],
              example: 'order_status'
            },
            isRead: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or invalid token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Authentication required. Please login.'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'You do not have permission to perform this action'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'email', message: 'Invalid email format' }]
              }
            }
          }
        }
      }
    },
    paths: {
      // Health Check
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'API Health Check',
          description: 'Check if the API is running and healthy',
          responses: {
            200: {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' },
                      service: { type: 'string', example: 'Washy API v1' }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // ==================== AUTH ROUTES ====================
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new customer',
          description: 'Create a new customer account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterInput' }
              }
            }
          },
          responses: {
            201: {
              description: 'Registration successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' }
                }
              }
            },
            400: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          description: 'Authenticate user and get JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginInput' }
              }
            }
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' }
                }
              }
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  example: { success: false, message: 'Invalid email or password' }
                }
              }
            }
          }
        }
      },
      '/auth/profile': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          description: 'Get the profile of the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            401: { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },

      // ==================== ORDER ROUTES ====================
      '/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Create a new order',
          description: 'Create a new laundry order. Requires authentication.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateOrderInput' }
              }
            }
          },
          responses: {
            201: {
              description: 'Order created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Order created successfully' },
                      data: { $ref: '#/components/schemas/Order' }
                    }
                  }
                }
              }
            },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { $ref: '#/components/responses/UnauthorizedError' }
          }
        },
        get: {
          tags: ['Orders'],
          summary: 'Get all orders (Admin)',
          description: 'Get all orders with filtering options. Requires staff/admin/manager role.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'confirmed', 'picked_up', 'in_process', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'] } },
            { name: 'branchId', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
          ],
          responses: {
            200: {
              description: 'List of orders',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                          pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { $ref: '#/components/responses/UnauthorizedError' },
            403: { $ref: '#/components/responses/ForbiddenError' }
          }
        }
      },
      '/orders/my-orders': {
        get: {
          tags: ['Orders'],
          summary: 'Get my orders',
          description: 'Get orders for the authenticated customer',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'Customer orders',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                          pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/orders/{id}': {
        get: {
          tags: ['Orders'],
          summary: 'Get order by ID',
          description: 'Get detailed information about a specific order',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Order ID' }
          ],
          responses: {
            200: {
              description: 'Order details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Order' }
                    }
                  }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFoundError' }
          }
        }
      },
      '/orders/{id}/status': {
        patch: {
          tags: ['Orders'],
          summary: 'Update order status',
          description: 'Update the status of an order. Requires UPDATE_ORDER_STATUS permission.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateOrderStatusInput' }
              }
            }
          },
          responses: {
            200: {
              description: 'Status updated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string', example: 'Order status updated to confirmed' },
                      data: { $ref: '#/components/schemas/Order' }
                    }
                  }
                }
              }
            },
            403: { $ref: '#/components/responses/ForbiddenError' }
          }
        }
      },
      '/orders/{id}/assign-rider': {
        post: {
          tags: ['Orders'],
          summary: 'Assign rider to order',
          description: 'Assign a rider for pickup or delivery. Requires MANAGE_PICKUP_DELIVERY permission.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AssignRiderInput' }
              }
            }
          },
          responses: {
            200: { description: 'Rider assigned successfully' },
            403: { $ref: '#/components/responses/ForbiddenError' }
          }
        }
      },
      '/orders/{id}/generate-otp': {
        post: {
          tags: ['Orders'],
          summary: 'Generate delivery OTP',
          description: 'Generate a one-time password for delivery verification',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OTP generated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          otp: { type: 'string', example: '123456' },
                          expiresAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/orders/{id}/verify-delivery': {
        post: {
          tags: ['Orders'],
          summary: 'Verify delivery (Rider)',
          description: 'Verify delivery with OTP or photo proof. Rider role required.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { type: 'string', enum: ['photo', 'otp_code', 'signature'] },
                    otpCode: { type: 'string', example: '123456' },
                    photoUrl: { type: 'string', example: 'https://cloudinary.com/...' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Delivery verified successfully' }
          }
        }
      },
      '/orders/{id}/rate': {
        post: {
          tags: ['Orders'],
          summary: 'Rate an order',
          description: 'Submit rating and feedback for a completed order',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rating'],
                  properties: {
                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                    feedback: { type: 'string', example: 'Excellent service!' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Rating submitted' }
          }
        }
      },
      '/orders/{id}/cancel': {
        post: {
          tags: ['Orders'],
          summary: 'Cancel an order',
          description: 'Cancel an order (only if not yet picked up)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reason'],
                  properties: {
                    reason: { type: 'string', example: 'Changed my mind' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Order cancelled' }
          }
        }
      },
      '/orders/stats/overview': {
        get: {
          tags: ['Orders'],
          summary: 'Get order statistics',
          description: 'Get order statistics and metrics. Admin/Manager role required.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'branchId', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
          ],
          responses: {
            200: {
              description: 'Order statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          totalOrders: { type: 'integer' },
                          pendingOrders: { type: 'integer' },
                          completedOrders: { type: 'integer' },
                          totalRevenue: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },

      // ==================== BRANCH ROUTES ====================
      '/branches': {
        get: {
          tags: ['Branches'],
          summary: 'Get all branches',
          description: 'Get list of all branches with optional filtering',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'city', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'List of branches',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          branches: { type: 'array', items: { $ref: '#/components/schemas/Branch' } },
                          pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Branches'],
          summary: 'Create a new branch',
          description: 'Create a new branch. Admin/Super Admin role required.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateBranchInput' }
              }
            }
          },
          responses: {
            201: { description: 'Branch created successfully' },
            403: { $ref: '#/components/responses/ForbiddenError' }
          }
        }
      },
      '/branches/find-by-zone': {
        get: {
          tags: ['Branches'],
          summary: 'Find branch by zone',
          description: 'Find branches that serve a specific zone/area',
          parameters: [
            { name: 'zone', in: 'query', required: true, schema: { type: 'string' }, description: 'Zone/Area name (e.g., "Sabon Gari")' },
            { name: 'state', in: 'query', schema: { type: 'string' }, description: 'State name (e.g., "Kaduna")' }
          ],
          responses: {
            200: {
              description: 'Branches serving the zone',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Branch' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/branches/{id}': {
        get: {
          tags: ['Branches'],
          summary: 'Get branch by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Branch details' },
            404: { $ref: '#/components/responses/NotFoundError' }
          }
        },
        patch: {
          tags: ['Branches'],
          summary: 'Update branch',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateBranchInput' }
              }
            }
          },
          responses: {
            200: { description: 'Branch updated' },
            403: { $ref: '#/components/responses/ForbiddenError' }
          }
        },
        delete: {
          tags: ['Branches'],
          summary: 'Delete branch',
          description: 'Delete a branch. Super Admin role required.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Branch deleted' },
            403: { $ref: '#/components/responses/ForbiddenError' }
          }
        }
      },
      '/branches/{id}/assign-manager': {
        post: {
          tags: ['Branches'],
          summary: 'Assign manager to branch',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['managerId'],
                  properties: {
                    managerId: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Manager assigned' }
          }
        }
      },
      '/branches/{id}/coverage-zones': {
        post: {
          tags: ['Branches'],
          summary: 'Add coverage zones to branch',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['zones'],
                  properties: {
                    zones: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string', example: 'New Zone' },
                          state: { type: 'string', example: 'Kaduna' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Coverage zones added' }
          }
        }
      },
      '/branches/{id}/assign-staff': {
        post: {
          tags: ['Branches'],
          summary: 'Assign staff to branch',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['staffId'],
                  properties: {
                    staffId: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Staff assigned' }
          }
        }
      },
      '/branches/{id}/stats': {
        get: {
          tags: ['Branches'],
          summary: 'Get branch statistics',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Branch statistics' }
          }
        }
      },

      // ==================== SERVICE ROUTES ====================
      '/services': {
        get: {
          tags: ['Services'],
          summary: 'Get all services',
          description: 'Get list of all services with optional filtering',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string', enum: ['laundry', 'graphics_design', 'dry_cleaning', 'alteration', 'shoe_care', 'household'] } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } }
          ],
          responses: {
            200: {
              description: 'List of services',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Service' } }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Services'],
          summary: 'Create a new service',
          description: 'Create a new service. Requires MANAGE_SERVICES permission.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateServiceInput' }
              }
            }
          },
          responses: {
            201: { description: 'Service created' },
            403: { $ref: '#/components/responses/ForbiddenError' }
          }
        }
      },
      '/services/catalog': {
        get: {
          tags: ['Services'],
          summary: 'Get price catalog',
          description: 'Get complete pricing catalog for all services',
          responses: {
            200: {
              description: 'Price catalog',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Service' } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/services/active': {
        get: {
          tags: ['Services'],
          summary: 'Get active services',
          description: 'Get only active services',
          responses: {
            200: { description: 'Active services' }
          }
        }
      },
      '/services/slug/{slug}': {
        get: {
          tags: ['Services'],
          summary: 'Get service by slug',
          parameters: [
            { name: 'slug', in: 'path', required: true, schema: { type: 'string' }, example: 'wash-and-fold' }
          ],
          responses: {
            200: { description: 'Service details' },
            404: { $ref: '#/components/responses/NotFoundError' }
          }
        }
      },
      '/services/calculate-price': {
        post: {
          tags: ['Services'],
          summary: 'Calculate order price',
          description: 'Calculate the total price for items before placing an order',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CalculatePriceInput' }
              }
            }
          },
          responses: {
            200: {
              description: 'Calculated price',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          items: { type: 'array', items: { type: 'object' } },
                          subtotal: { type: 'number', example: 2500 },
                          deliveryFee: { type: 'number', example: 500 },
                          total: { type: 'number', example: 3000 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/services/{id}': {
        get: {
          tags: ['Services'],
          summary: 'Get service by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Service details' }
          }
        },
        patch: {
          tags: ['Services'],
          summary: 'Update service',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Service updated' }
          }
        },
        delete: {
          tags: ['Services'],
          summary: 'Delete service',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Service deleted' }
          }
        }
      },
      '/services/{id}/pricing': {
        patch: {
          tags: ['Services'],
          summary: 'Update service pricing',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    pricing: { type: 'array', items: { $ref: '#/components/schemas/ServicePricing' } }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Pricing updated' }
          }
        }
      },
      '/services/seed': {
        post: {
          tags: ['Services'],
          summary: 'Seed default services',
          description: 'Seed the database with default services. Super Admin only.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Services seeded' }
          }
        }
      },

      // ==================== PAYMENT ROUTES ====================
      '/payments/webhook': {
        post: {
          tags: ['Payments'],
          summary: 'Paystack webhook',
          description: 'Webhook endpoint for Paystack payment notifications. No authentication required, but signature is verified.',
          responses: {
            200: { description: 'Webhook processed' }
          }
        }
      },
      '/payments/verify/{reference}': {
        get: {
          tags: ['Payments'],
          summary: 'Verify payment',
          description: 'Verify a payment by reference (can be used as callback URL)',
          parameters: [
            { name: 'reference', in: 'path', required: true, schema: { type: 'string' }, description: 'Paystack payment reference' }
          ],
          responses: {
            200: {
              description: 'Payment status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Payment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/payments/initialize': {
        post: {
          tags: ['Payments'],
          summary: 'Initialize payment',
          description: 'Initialize a new payment for an order',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/InitializePaymentInput' }
              }
            }
          },
          responses: {
            200: {
              description: 'Payment initialized',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          payment: { $ref: '#/components/schemas/Payment' },
                          authorizationUrl: { type: 'string', example: 'https://checkout.paystack.com/xyz123' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/payments/{id}': {
        get: {
          tags: ['Payments'],
          summary: 'Get payment by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Payment details' }
          }
        }
      },
      '/payments': {
        get: {
          tags: ['Payments'],
          summary: 'Get all payments (Admin)',
          description: 'Get all payments with filtering. Admin/Manager role required.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'refunded'] } },
            { name: 'method', in: 'query', schema: { type: 'string', enum: ['card', 'bank_transfer', 'ussd', 'cash'] } }
          ],
          responses: {
            200: { description: 'List of payments' }
          }
        }
      },
      '/payments/cash': {
        post: {
          tags: ['Payments'],
          summary: 'Record cash payment',
          description: 'Record a cash payment for an order. Staff/Manager role required.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['orderId', 'amount'],
                  properties: {
                    orderId: { type: 'string' },
                    amount: { type: 'number', example: 3000 }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Cash payment recorded' }
          }
        }
      },

      // ==================== NOTIFICATION ROUTES ====================
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get my notifications',
          description: 'Get all notifications for the authenticated user',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'isRead', in: 'query', schema: { type: 'boolean' } }
          ],
          responses: {
            200: {
              description: 'User notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                          pagination: { $ref: '#/components/schemas/Pagination' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/notifications/unread-count': {
        get: {
          tags: ['Notifications'],
          summary: 'Get unread count',
          description: 'Get count of unread notifications',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Unread count',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          count: { type: 'integer', example: 5 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark notification as read',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Notification marked as read' }
          }
        }
      },
      '/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all as read',
          description: 'Mark all notifications as read',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'All notifications marked as read' }
          }
        }
      }
    }
  },
  apis: [] // We're not using JSDoc comments, defining everything in the spec
};

export const swaggerSpec = swaggerJsdoc(options);
