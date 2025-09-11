export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  description: string;
  status: "active" | "inactive";
  profit?: number;
  profitPercentage?: number;
  barcode?: string; // إضافة دعم الباركود
  // Support for investor ownership
  ownerId?: string; // investorId or 'company' for company-owned products
  ownerType: "investor" | "company";
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  code: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  reason: string;
  value: number;
  referenceType?: "sale" | "purchase" | "adjustment" | "return" | "investor_purchase" | "investor_sale";
  referenceId?: string;
  notes?: string;
  // Owner information for tracking
  ownerId?: string;
  ownerType?: "investor" | "company";
}

export interface StockAnalysis {
  productId: string;
  productName: string;
  code: string;
  category: string;
  currentStock: number;
  avgMovement: number;
  turnoverRate: number;
  daysToStockout: number;
  reorderPoint: number;
  stockValue: number;
  lastMovementDate: string;
}