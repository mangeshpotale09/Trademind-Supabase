
export enum TradeType {
  STOCK = 'STOCK',
  OPTION = 'OPTION'
}

export enum OptionType {
  CALL = 'CALL',
  PUT = 'PUT'
}

export enum TradeSide {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING = 'PENDING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PlanType {
  MONTHLY = 'MONTHLY',
  SIX_MONTHS = 'SIX_MONTHS',
  ANNUAL = 'ANNUAL'
}

export interface Transaction {
  id: string;
  orderId?: string;
  signature?: string;
  userId: string;
  userName: string;
  plan: PlanType;
  amount: number;
  method: 'CARD' | 'WALLET' | 'BANK' | 'RAZORPAY';
  timestamp: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface User {
  id: string;
  displayId: string;
  email: string;
  name: string;
  mobile?: string;
  password?: string;
  isPaid: boolean;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
  paymentScreenshot?: string;
  amountPaid?: number;
  expiryDate?: string;
  selectedPlan?: PlanType;
  referredBy?: string;
  ownReferralCode: string;
  hasReferralDiscount?: boolean;
}

export interface OptionDetails {
  strike: number;
  expiration: string;
  option_type: OptionType;
  delta?: number;
  iv?: number;
  dte?: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AIReview {
  score: number;
  well: string;
  wrong: string;
  violations: boolean;
  improvement: string;
  timestamp: number;
  sources?: GroundingSource[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; // Changed from data (base64) to url (Supabase Storage)
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  type: TradeType;
  side: TradeSide;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  entryDate: string;
  exitDate?: string;
  fees: number;
  status: TradeStatus;
  tags: string[];
  notes: string;
  optionDetails?: OptionDetails;
  aiReview?: AIReview;
  attachments?: Attachment[];
  emotions: string[];
  mistakes: string[];
  strategies: string[];
}
