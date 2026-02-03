/**
 * Service Controller
 * @author Redemption Jonathan
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import ServiceService from '@/services/service.service';
import ResponseHandler from '@/utils/response.util';
import { asyncHandler } from '@/utils/async-handler.util';
import { ESERVICE_CATEGORY, ESERVICE_TYPE } from '@/constants/enums.constant';

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const service = await ServiceService.createService(req.body);
  return ResponseHandler.created(res, service, 'Service created successfully');
});

export const getService = asyncHandler(async (req: Request, res: Response) => {
  const service = await ServiceService.getServiceById(req.params.id as string);
  return ResponseHandler.success(res, service);
});

export const getServiceBySlug = asyncHandler(async (req: Request, res: Response) => {
  const service = await ServiceService.getServiceBySlug(req.params.slug as string);
  return ResponseHandler.success(res, service);
});

export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const result = await ServiceService.getServices({
    category: req.query.category as ESERVICE_CATEGORY | undefined,
    serviceType: req.query.serviceType as ESERVICE_TYPE | undefined,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    branch: req.query.branch as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10
  });
  return ResponseHandler.paginated(res, result.services,
    result.pagination.page, result.pagination.limit, result.pagination.total);
});

export const getActiveServices = asyncHandler(async (req: Request, res: Response) => {
  const category = req.query.category as ESERVICE_CATEGORY | undefined;
  const services = await ServiceService.getActiveServices(category);
  return ResponseHandler.success(res, services);
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const service = await ServiceService.updateService(req.params.id as string, req.body);
  return ResponseHandler.success(res, service, 'Service updated');
});

export const updatePricing = asyncHandler(async (req: Request, res: Response) => {
  const service = await ServiceService.updatePricing(req.params.id as string, req.body.pricing);
  return ResponseHandler.success(res, service, 'Pricing updated');
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  await ServiceService.deleteService(req.params.id as string);
  return ResponseHandler.noContent(res);
});

export const calculatePrice = asyncHandler(async (req: Request, res: Response) => {
  const result = await ServiceService.calculatePrice(req.body.items);
  return ResponseHandler.success(res, result);
});

export const getPriceCatalog = asyncHandler(async (req: Request, res: Response) => {
  const category = req.query.category as ESERVICE_CATEGORY | undefined;
  const catalog = await ServiceService.getPriceCatalog(category);
  return ResponseHandler.success(res, catalog);
});

export const seedServices = asyncHandler(async (req: Request, res: Response) => {
  await ServiceService.seedDefaultServices();
  return ResponseHandler.success(res, null, 'Services seeded successfully');
});

export default {
  createService, getService, getServiceBySlug, getServices, getActiveServices,
  updateService, updatePricing, deleteService, calculatePrice, getPriceCatalog, seedServices
};
