/**
 * Application constants
 */

export const APP_NAME = "FR8";
export const APP_DESCRIPTION = "Modern freight management and tracking portal";

// Shipment statuses
export const SHIPMENT_STATUSES = {
  PENDING: "pending",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  DELAYED: "delayed",
} as const;

export type ShipmentStatus =
  (typeof SHIPMENT_STATUSES)[keyof typeof SHIPMENT_STATUSES];

// API rate limits (requests per minute)
export const RATE_LIMITS = {
  ANONYMOUS: 10,
  AUTHENTICATED: 100,
  PREMIUM: 1000,
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

