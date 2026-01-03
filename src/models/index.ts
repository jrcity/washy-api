/**
 * Model Exports
 * Central export point for all models
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

// User models
export { default as User } from './user.model';
export type { IUser } from './user.model';

export { default as Admin } from './admin.model';
export type { IAdmin } from './admin.model';

export { default as Customer } from './customer.model';
export type { ICustomer } from './customer.model';

export { default as Staff } from './staff.model';
export type { IStaff } from './staff.model';

export { default as Rider } from './rider.model';
export type { IRider } from './rider.model';

export { default as BranchManager } from './banch_manager.model';
export type { IBranchManager } from './banch_manager.model';

// Business models
export { default as Branch } from './branch.model';
export type { IBranch, ICoverageZone } from './branch.model';

export { default as Service } from './service.model';
export type { IService, IServicePricing } from './service.model';

export { default as Order } from './order.model';
export type { IOrder, IOrderItem, IStatusHistory, IAddress } from './order.model';

export { default as Payment } from './payment.model';
export type { IPayment } from './payment.model';

export { default as Notification } from './notification.model';
export type { INotification } from './notification.model';

export { default as Preference } from './preference.model';
export type { IPreference } from './preference.model';
