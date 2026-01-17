/**
 * Enum constants for the Washy application
 * Laundry API v1
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

// User roles for the application
export enum EUSERS_ROLE {
    ADMIN = "admin",
    SUPER_ADMIN = "super_admin",
    CUSTOMER = "customer",
    BRANCH_MANAGER = "branch_manager",
    STAFF = "staff",
    RIDER = "rider"
}

// Staff-level permissions
export enum EPERMISSIONS {
    CREATE_ORDER = "create_order",
    VIEW_ORDERS = "view_orders",
    VIEW_REPORTS = "view_reports",
    UPDATE_ORDER_STATUS = "update_order_status",
    MANAGE_CUSTOMERS = "manage_customers",
    MANAGE_SERVICES = "manage_services",
    MANAGE_BRANCHES = "manage_branches",
    MANAGE_STAFF = "manage_staff",
    MANAGE_ADMINS = "manage_admins",
    DELETE_BRANCHES = "delete_branches",
    MANAGE_PAYMENTS = "manage_payments",
    MANAGE_PICKUP_DELIVERY = "manage_pickup_delivery",
    MANAGE_INVENTORY = "manage_inventory",
    SEND_NOTIFICATIONS = "send_notifications"
}

// Order status tracking - follows the customer journey
export enum EORDER_STATUS {
    PENDING = "pending",                    // Initial booking state
    CONFIRMED = "confirmed",                // Order confirmed, awaiting pickup
    PICKED_UP = "picked_up",                // Rider has collected items
    IN_PROCESS = "in_process",              // Items at branch, being cleaned
    READY = "ready",                        // Ready for delivery
    OUT_FOR_DELIVERY = "out_for_delivery",  // Rider en route to customer
    DELIVERED = "delivered",                // Successfully delivered
    COMPLETED = "completed",                // Payment confirmed, order closed
    CANCELLED = "cancelled"                 // Order cancelled
}

// Payment status
export enum EPAYMENT_STATUS {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded"
}

// Payment methods - Nigerian focused
export enum EPAYMENT_METHOD {
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    USSD = "ussd",
    CASH = "cash"
}

// Service categories - future-proofing for Graphics Design
export enum ESERVICE_CATEGORY {
    LAUNDRY = "laundry",
    GRAPHICS_DESIGN = "graphics_design",
    DRY_CLEANING = "dry_cleaning",
    ALTERATION = "alteration",
    SHOE_CARE = "shoe_care",
    HOUSEHOLD = "household"
}

// Service types for laundry
export enum ESERVICE_TYPE {
    WASH_AND_FOLD = "wash_and_fold",
    WASH_AND_IRON = "wash_and_iron",
    DRY_CLEAN = "dry_clean",
    EXPRESS = "express",
    STARCH = "starch",
    IRON_ONLY = "iron_only"
}

// Garment types
export enum EGARMENT_TYPE {
    SHIRT = "shirt",
    TROUSER = "trouser",
    SUIT = "suit",
    DRESS = "dress",
    DUVET = "duvet",
    CURTAIN = "curtain",
    BEDSHEET = "bedsheet",
    TOWEL = "towel",
    SKIRT = "skirt",
    UNDERWEAR = "underwear",
    BLANKET = "blanket",
    JACKET = "jacket",
    NATIVE_ATTIRE = "native_attire",
    OTHER = "other"
}

// Notification types
export enum ENOTIFICATION_TYPE {
    ORDER_STATUS = "order_status",
    PAYMENT = "payment",
    PROMOTION = "promotion",
    SYSTEM = "system"
}

// Notification channels
export enum ENOTIFICATION_CHANNEL {
    PUSH = "push",
    SMS = "sms",
    EMAIL = "email",
    WHATSAPP = "whatsapp"
}

// Delivery proof types
export enum EDELIVERY_PROOF_TYPE {
    PHOTO = "photo",
    OTP_CODE = "otp_code",
    SIGNATURE = "signature"
}

// Upload categories for file classification
export enum EUPLOAD_CATEGORY {
    SERVICE_IMAGE = "service_image",
    CATEGORY_IMAGE = "category_image",
    PICKUP_SCREENSHOT = "pickup_screenshot",
    DELIVERY_SCREENSHOT = "delivery_screenshot",
    PROOF_PHOTO = "proof_photo",
    OTHER = "other"
}