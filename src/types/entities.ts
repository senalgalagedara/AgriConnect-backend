export interface Province {
  id: number;
  name: string;
  capacity: number;
  location?: string;
  manager_name?: string;
  created_at: Date;
  updated_at: Date;
  total_products?: number;
  total_current_stock?: number;
}

export interface CreateProvinceRequest {
  name: string;
  capacity?: number;
  location?: string;
  manager_name?: string;
}

export interface UpdateProvinceRequest extends Partial<CreateProvinceRequest> {
  id: number;
}

export interface ProvinceStatistics {
  province_name: string;
  total_products: number;
  total_farmers: number;
  total_suppliers: number;
  total_stock: number;
  total_capacity: number;
  average_price: number;
  utilization_percentage: number;
}

export interface Product {
  id: number;
  product_name: string; // Database uses product_name
  category_id: number; // Database uses category_id foreign key
  province_id: number;
  daily_limit: number;
  current_stock: number;
  final_price: number; // Database uses final_price
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: Date;
  updated_at: Date;
  // Virtual fields from joins
  category_name?: string;
  province_name?: string;
}

export interface CreateProductRequest {
  name: string; // Maps to product_name
  category_id?: number;
  province_id: number;
  daily_limit: number;
  current_stock?: number;
  final_price: number;
  unit?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface Farmer {
  id: number;
  name: string;
  contact_number?: string; // Database uses contact_number
  email?: string;
  address?: string; // Database uses text type
  province_id: number;
  registration_number?: string; // Database uses registration_number
  created_at: Date;
  updated_at: Date;
  // Virtual fields from joins
  province_name?: string;
  total_supplies?: number;
  total_value?: number;
}

export interface CreateFarmerRequest {
  name: string;
  contact_number?: string;
  email?: string;
  address?: string;
  province_id: number;
  registration_number?: string;
}

export interface UpdateFarmerRequest extends Partial<CreateFarmerRequest> {
  // No status field in database, so removed it
}

export interface Supplier {
  id: number;
  farmer_id: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  supply_date: Date;
  notes?: string;
  status: 'active' | 'inactive' | 'pending' | 'completed';
  created_at: Date;
  updated_at: Date;
  // Virtual fields from joins
  farmer_name?: string;
  product_name?: string;
  province_name?: string;
}

export interface CreateSupplierRequest {
  farmer_id: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  supply_date: string; // Will be converted to Date
  notes?: string;
  status?: 'active' | 'inactive' | 'pending' | 'completed';
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  status?: 'active' | 'inactive' | 'pending' | 'completed';
}

export interface Feedback {
  id: number;
  user_id?: number;
  rating: number; // Required field from frontend (1-5)
  comment: string; // Frontend calls it 'comment' instead of 'message'
  meta?: Record<string, any>; // Frontend meta data (orderId, userId, etc.)
  // Keep backend-specific fields
  user_type?: 'farmer' | 'supplier' | 'driver' | 'admin' | 'anonymous';
  category?: 'general' | 'technical' | 'service' | 'suggestion' | 'complaint';
  subject?: string; // Made optional since frontend focuses on rating + comment
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[]; // URLs to uploaded files
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  resolved_by?: number;
  admin_notes?: string;
}

export interface CreateFeedbackRequest {
  user_id?: number;
  rating: number; // Required from frontend
  comment: string; // Frontend calls it 'comment'
  meta?: Record<string, any>; // Frontend meta data
  // Optional backend fields with defaults
  user_type?: 'farmer' | 'supplier' | 'driver' | 'admin' | 'anonymous';
  category?: 'general' | 'technical' | 'service' | 'suggestion' | 'complaint';
  subject?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
}

// Frontend-compatible interface for client responses
export interface FeedbackData {
  rating: number;
  comment: string;
  meta?: Record<string, any>;
}

// Response interface that includes both frontend and backend data
export interface FeedbackResponse extends FeedbackData {
  id: number;
  user_id?: number;
  user_type?: string;
  category?: string;
  subject?: string;
  status: string;
  priority?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateFeedbackRequest {
  status?: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes?: string;
  resolved_by?: number;
}

export interface FeedbackFilter {
  user_type?: string;
  category?: string;
  status?: string;
  priority?: string;
  created_from?: Date;
  created_to?: Date;
  rating_min?: number;
  rating_max?: number;
}

// Cart related interfaces
export interface Cart {
  id: string;  // UUID
  user_id: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface CartItem {
  id: string;  // UUID
  cart_id: string;  // UUID
  product_id: number;
  qty: number;
  product_name?: string;
  name?: string; // For backward compatibility
  price?: number;
  added_at?: Date;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
}

export interface CartWithItems {
  cart: Cart;
  items: CartItem[];
  totals: CartTotals;
}

export interface AddToCartRequest {
  productId: number;
  qty?: number;
}

export interface UpdateCartItemRequest {
  qty: number;
}

// Order related interfaces
export interface Order {
  id: number;
  order_no?: string | number;
  user_id: number;
  subtotal: number;
  tax: number;
  shipping_fee: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  contact: ContactInfo | any; // JSON field
  shipping: ShippingInfo | any; // JSON field
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  name: string;
  price: number;
  qty: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface CheckoutRequest {
  userId: number;
  contact: ContactInfo;
  shipping: ShippingInfo;
}

// Additional Order-related interfaces
export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface CheckoutRequest {
  userId: number;
  contact: ContactInfo;
  shipping: ShippingInfo;
}

export interface OrderFilter {
  status?: string;
  customer_email?: string;
  order_no?: string;
  created_from?: Date;
  created_to?: Date;
}

// Payment related interfaces
export interface Payment {
  id: number;
  order_id: number;
  method: 'COD' | 'CARD' | 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  amount?: number;
  card_last4?: string;
  transaction_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentRequest {
  orderId: number;
  method: 'COD' | 'CARD';
  cardNumber?: string;
}

export interface PaymentResponse {
  order: Order;
  items: OrderItem[];
  payment: Payment;
  invoice: InvoiceInfo;
}

export interface InvoiceInfo {
  orderId: string | number;
  total: number;
  customerName: string;
  email: string;
  createdAt: Date;
  method: string;
}

// Driver related interfaces
export interface Driver {
  id: number;
  name: string;
  phone_number: string;
  location: string;
  vehicle_type: string;
  capacity: number;
  availability_status: 'available' | 'busy' | 'offline';
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface CreateDriverRequest {
  name: string;
  phone_number: string;
  location: string;
  vehicle_type: string;
  capacity: number;
}

export interface UpdateDriverRequest {
  name?: string;
  phone_number?: string;
  location?: string;
  vehicle_type?: string;
  capacity?: number;
  availability_status?: 'available' | 'busy' | 'offline';
  status?: 'active' | 'inactive';
}

// Assignment related interfaces
export interface Assignment {
  id: number;
  order_id: number;
  driver_id: number;
  schedule_time: Date;
  special_notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  weight?: number;
  driver_name?: string;
  vehicle_type?: string;
  capacity?: number;
}

export interface CreateAssignmentRequest {
  orderId: number;
  driverId: number;
  scheduleTime: Date;
  specialNotes?: string;
}

export interface UpdateAssignmentRequest {
  schedule_time?: Date;
  special_notes?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}