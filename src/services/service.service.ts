/**
 * Service Service
 * Business logic for service/pricing management
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Types } from 'mongoose';
import Service, { IService, IServicePricing } from '@/models/service.model';
import { AppError } from '@/utils/error.util';
import { ESERVICE_CATEGORY, ESERVICE_TYPE, EGARMENT_TYPE } from '@/constants/enums.constant';

interface CreateServiceInput {
  name: string;
  slug?: string;
  description: string;
  category?: ESERVICE_CATEGORY;
  serviceType: ESERVICE_TYPE;
  pricing: IServicePricing[];
  estimatedDuration?: {
    standard: number;
    express: number;
  };
  isExpressAvailable?: boolean;
  branch?: string;
  icon?: string;
  sortOrder?: number;
}

interface PriceCalculationItem {
  serviceId: string;
  garmentType: EGARMENT_TYPE;
  quantity: number;
  isExpress: boolean;
}

class ServiceService {

  /**
   * Create a new service
   */
  async createService(input: CreateServiceInput): Promise<IService> {
    // Generate slug if not provided
    const slug = input.slug || this.generateSlug(input.name);
    
    // Check if slug already exists
    const existingService = await Service.findOne({ slug });
    if (existingService) {
      throw AppError.conflict('Service with this name already exists');
    }
    
    const service = await Service.create({
      ...input,
      slug
    });
    
    return service;
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId: string): Promise<IService> {
    const service = await Service.findById(serviceId)
      .populate('branch', 'name code');
    
    if (!service) {
      throw AppError.notFound('Service not found');
    }
    
    return service;
  }

  /**
   * Get service by slug
   */
  async getServiceBySlug(slug: string): Promise<IService> {
    const service = await Service.findOne({ slug })
      .populate('branch', 'name code');
    
    if (!service) {
      throw AppError.notFound('Service not found');
    }
    
    return service;
  }

  /**
   * Get all services with filters
   */
  async getServices(filters: {
    category?: ESERVICE_CATEGORY;
    serviceType?: ESERVICE_TYPE;
    isActive?: boolean;
    branch?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};
    
    if (filters.category) query.category = filters.category;
    if (filters.serviceType) query.serviceType = filters.serviceType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.branch) query.branch = filters.branch;
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    
    const [services, total] = await Promise.all([
      Service.find(query)
        .populate('branch', 'name code')
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Service.countDocuments(query)
    ]);
    
    return {
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get active services (for customers)
   */
  async getActiveServices(category?: ESERVICE_CATEGORY): Promise<IService[]> {
    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    return Service.find(query)
      .sort({ sortOrder: 1, name: 1 });
  }

  /**
   * Update service
   */
  async updateService(
    serviceId: string,
    updates: Partial<CreateServiceInput>
  ): Promise<IService> {
    // If name is being updated, regenerate slug
    if (updates.name) {
      updates.slug = this.generateSlug(updates.name);
      
      // Check if new slug conflicts
      const existingService = await Service.findOne({ 
        slug: updates.slug,
        _id: { $ne: serviceId }
      });
      
      if (existingService) {
        throw AppError.conflict('Service with this name already exists');
      }
    }
    
    const service = await Service.findByIdAndUpdate(
      serviceId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!service) {
      throw AppError.notFound('Service not found');
    }
    
    return service;
  }

  /**
   * Update service pricing
   */
  async updatePricing(
    serviceId: string,
    pricing: IServicePricing[]
  ): Promise<IService> {
    const service = await Service.findByIdAndUpdate(
      serviceId,
      { $set: { pricing } },
      { new: true }
    );
    
    if (!service) {
      throw AppError.notFound('Service not found');
    }
    
    return service;
  }

  /**
   * Add pricing for a garment type
   */
  async addGarmentPricing(
    serviceId: string,
    pricing: IServicePricing
  ): Promise<IService> {
    const service = await Service.findById(serviceId);
    
    if (!service) {
      throw AppError.notFound('Service not found');
    }
    
    // Check if pricing already exists for this garment type
    const existingIndex = service.pricing.findIndex(
      (p) => p.garmentType === pricing.garmentType
    );
    
    if (existingIndex >= 0) {
      // Update existing pricing
      service.pricing[existingIndex] = pricing;
    } else {
      // Add new pricing
      service.pricing.push(pricing);
    }
    
    return service.save();
  }

  /**
   * Delete service (soft delete)
   */
  async deleteService(serviceId: string): Promise<void> {
    const service = await Service.findByIdAndUpdate(
      serviceId,
      { isActive: false },
      { new: true }
    );
    
    if (!service) {
      throw AppError.notFound('Service not found');
    }
  }

  /**
   * Calculate price for a list of items
   */
  async calculatePrice(items: PriceCalculationItem[]): Promise<{
    items: Array<{
      serviceId: string;
      serviceName: string;
      garmentType: EGARMENT_TYPE;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      isExpress: boolean;
    }>;
    subtotal: number;
    expressCount: number;
  }> {
    const calculatedItems = [];
    let subtotal = 0;
    let expressCount = 0;
    
    for (const item of items) {
      const service = await Service.findById(item.serviceId);
      
      if (!service || !service.isActive) {
        throw AppError.badRequest(`Service not found: ${item.serviceId}`);
      }
      
      const pricing = service.pricing.find(
        (p) => p.garmentType === item.garmentType
      );
      
      if (!pricing) {
        throw AppError.badRequest(
          `Pricing not available for ${item.garmentType} in ${service.name}`
        );
      }
      
      let unitPrice = pricing.basePrice;
      if (item.isExpress && service.isExpressAvailable) {
        unitPrice *= pricing.expressMultiplier;
        expressCount++;
      }
      
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      
      calculatedItems.push({
        serviceId: item.serviceId,
        serviceName: service.name,
        garmentType: item.garmentType,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        isExpress: item.isExpress
      });
    }
    
    return {
      items: calculatedItems,
      subtotal,
      expressCount
    };
  }

  /**
   * Get pricing for a specific service
   */
  async getServicePricing(serviceId: string): Promise<IServicePricing[]> {
    const service = await Service.findById(serviceId);
    
    if (!service) {
      throw AppError.notFound('Service not found');
    }
    
    return service.pricing;
  }

  /**
   * Get all pricing as a catalog
   */
  async getPriceCatalog(category?: ESERVICE_CATEGORY) {
    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    const services = await Service.find(query)
      .select('name serviceType pricing estimatedDuration isExpressAvailable')
      .sort({ sortOrder: 1 });
    
    return services.map((service) => ({
      name: service.name,
      serviceType: service.serviceType,
      estimatedDuration: service.estimatedDuration,
      isExpressAvailable: service.isExpressAvailable,
      pricing: service.pricing.map((p) => ({
        garmentType: p.garmentType,
        standardPrice: p.basePrice,
        expressPrice: service.isExpressAvailable 
          ? Math.round(p.basePrice * p.expressMultiplier)
          : null
      }))
    }));
  }

  /**
   * Seed default services
   */
  async seedDefaultServices(): Promise<void> {
    const existingCount = await Service.countDocuments();
    if (existingCount > 0) {
      return; // Already seeded
    }
    
    const defaultServices: CreateServiceInput[] = [
      {
        name: 'Wash & Fold',
        description: 'Professional washing and folding service for your everyday clothes',
        serviceType: ESERVICE_TYPE.WASH_AND_FOLD,
        pricing: [
          { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 200, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 250, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.DRESS, basePrice: 400, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.TOWEL, basePrice: 150, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.BEDSHEET, basePrice: 350, expressMultiplier: 1.5 }
        ],
        sortOrder: 1
      },
      {
        name: 'Wash & Iron',
        description: 'Washing with professional ironing for a crisp finish',
        serviceType: ESERVICE_TYPE.WASH_AND_IRON,
        pricing: [
          { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 300, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 350, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.DRESS, basePrice: 500, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 600, expressMultiplier: 1.5 }
        ],
        sortOrder: 2
      },
      {
        name: 'Dry Cleaning',
        description: 'Premium dry cleaning for delicate and formal wear',
        serviceType: ESERVICE_TYPE.DRY_CLEAN,
        pricing: [
          { garmentType: EGARMENT_TYPE.SUIT, basePrice: 2500, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.DRESS, basePrice: 1500, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.JACKET, basePrice: 1800, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.DUVET, basePrice: 3500, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.CURTAIN, basePrice: 2000, expressMultiplier: 1.5 }
        ],
        estimatedDuration: { standard: 72, express: 48 },
        sortOrder: 3
      },
      {
        name: 'Express Service',
        description: 'Same-day or next-day service for urgent needs',
        serviceType: ESERVICE_TYPE.EXPRESS,
        pricing: [
          { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 400, expressMultiplier: 1 },
          { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 450, expressMultiplier: 1 },
          { garmentType: EGARMENT_TYPE.DRESS, basePrice: 600, expressMultiplier: 1 }
        ],
        estimatedDuration: { standard: 24, express: 12 },
        sortOrder: 4
      },
      {
        name: 'Starch Service',
        description: 'Professional starching for native attire',
        serviceType: ESERVICE_TYPE.STARCH,
        pricing: [
          { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 800, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 400, expressMultiplier: 1.5 }
        ],
        sortOrder: 5
      },
      {
        name: 'Iron Only',
        description: 'Professional pressing for already clean clothes',
        serviceType: ESERVICE_TYPE.IRON_ONLY,
        pricing: [
          { garmentType: EGARMENT_TYPE.SHIRT, basePrice: 150, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.TROUSER, basePrice: 150, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.DRESS, basePrice: 200, expressMultiplier: 1.5 },
          { garmentType: EGARMENT_TYPE.NATIVE_ATTIRE, basePrice: 300, expressMultiplier: 1.5 }
        ],
        estimatedDuration: { standard: 24, express: 6 },
        sortOrder: 6
      }
    ];
    
    for (const serviceData of defaultServices) {
      await this.createService(serviceData);
    }
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export default new ServiceService();
