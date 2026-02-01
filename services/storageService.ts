
import { Trade, User, UserRole, UserStatus, Transaction, TradeStatus, TradeSide, PlanType } from "../types";
import { supabase } from "./supabaseClient";

export const generateUUID = (): string => crypto.randomUUID();

const PROFILE_CACHE_KEY = 'tm_cached_profile';

// --- P&L Calculations ---

export const calculateGrossPnL = (trade: Trade): number => {
  if (trade.status === TradeStatus.OPEN || !trade.exitPrice) return 0;
  const diff = trade.side === TradeSide.LONG 
    ? trade.exitPrice - trade.entryPrice 
    : trade.entryPrice - trade.exitPrice;
  return diff * trade.quantity;
};

export const calculatePnL = (trade: Trade): number => {
  return calculateGrossPnL(trade) - trade.fees;
};

// --- User & Identity ---

export const getCurrentUser = async (passedSession?: any): Promise<User | null> => {
  try {
    let session = passedSession;
    if (!session) {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        localStorage.removeItem(PROFILE_CACHE_KEY);
        return null;
      }
      session = data.session;
    }

    const email = session.user.email?.toLowerCase().trim();
    const ADMIN_EMAIL = 'mangeshpotale09@gmail.com';
    const isHardcodedAdmin = email === ADMIN_EMAIL;

    if (isHardcodedAdmin) {
      const admin: User = {
        id: session.user.id,
        displayId: `ROOT-MASTER`,
        email: email || '',
        name: session.user.user_metadata?.name || 'Admin',
        isPaid: true,
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
        joinedAt: new Date().toISOString(),
        ownReferralCode: 'ADMIN-ROOT'
      };
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(admin));
      return admin;
    }

    const cachedStr = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr) as User;
        if (cached.id === session.user.id) {
          fetchAndCacheProfile(session.user.id, session.user.email, session.user.user_metadata);
          return cached;
        }
      } catch (e) {
        localStorage.removeItem(PROFILE_CACHE_KEY);
      }
    }

    return await fetchAndCacheProfile(session.user.id, session.user.email, session.user.user_metadata);
  } catch (err: any) {
    console.error("Critical Auth Resolve Failure:", err);
    return null;
  }
};

const fetchAndCacheProfile = async (uid: string, email: string, metadata: any): Promise<User | null> => {
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) throw error;

    let userObj: User;

    if (!profileData) {
      userObj = {
        id: uid,
        displayId: `TM-${uid.substring(0, 6).toUpperCase()}`,
        email: email || '',
        name: metadata?.name || 'Trader',
        isPaid: false,
        role: UserRole.USER,
        status: UserStatus.PENDING,
        joinedAt: new Date().toISOString(),
        ownReferralCode: ''
      };
    } else {
      userObj = {
        id: profileData.id,
        displayId: profileData.display_id,
        email: profileData.email,
        name: profileData.name,
        mobile: profileData.mobile,
        isPaid: profileData.is_paid || profileData.role === 'ADMIN',
        role: profileData.role as UserRole,
        status: profileData.status as UserStatus,
        joinedAt: profileData.joined_at,
        ownReferralCode: profileData.own_referral_code,
        paymentScreenshot: profileData.payment_screenshot,
        // Fix: Use selectedPlan to match the User interface property name
        selectedPlan: profileData.selected_plan as PlanType,
        amountPaid: profileData.amount_paid,
        expiryDate: profileData.expiry_date
      };
    }

    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(userObj));
    return userObj;
  } catch (err) {
    console.error("Profile fetch/cache failed:", err);
    return null;
  }
};

// --- Auth Methods ---
export const registerUser = async (data: any): Promise<User | null> => {
  const { email, password, name, mobile } = data;
  const { error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: { data: { name, mobile } }
  });
  if (error) throw error;
  return getCurrentUser();
};

export const validateLogin = async (email: string, password: string): Promise<User | null> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password
  });
  if (error) throw error;
  return getCurrentUser();
};

export const resetUserPassword = async (email: string, mobile: string, newPass: string): Promise<boolean> => {
  const { error } = await supabase.auth.updateUser({ password: newPass });
  return !error;
};

// --- Storage Methods ---
export const uploadAttachment = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${generateUUID()}.${fileExt}`;
  const { error } = await supabase.storage.from('trade-attachments').upload(fileName, file);
  
  if (error) {
    console.error("Upload Error:", error);
    throw new Error(`STORAGE_FAIL: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from('trade-attachments').getPublicUrl(fileName);
  return publicUrl;
};

export const submitPaymentProof = async (userId: string, plan: PlanType, file: File): Promise<void> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/proof_${generateUUID()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, file);
  if (uploadError) throw new Error(`PROOF_UPLOAD_FAIL: ${uploadError.message}`);

  const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      payment_screenshot: publicUrl,
      selected_plan: plan,
      status: UserStatus.WAITING_APPROVAL
    })
    .eq('id', userId);

  if (updateError) throw updateError;
  localStorage.removeItem(PROFILE_CACHE_KEY);
};

// --- Trades Management ---

export const getStoredTrades = async (userId?: string): Promise<Trade[]> => {
  try {
    let query = supabase.from('trades').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.order('entry_date', { ascending: false }).limit(200); 
    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      userId: t.user_id,
      symbol: t.symbol,
      type: t.type,
      side: t.side as TradeSide,
      entryPrice: Number(t.entry_price),
      exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
      quantity: Number(t.quantity),
      entryDate: t.entry_date,
      exitDate: t.exit_date,
      fees: Number(t.fees),
      status: t.status as TradeStatus,
      tags: t.tags || [],
      notes: t.notes || '',
      optionDetails: t.option_details,
      aiReview: t.ai_review,
      attachments: Array.isArray(t.attachments) ? t.attachments : [],
      emotions: t.emotions || [],
      mistakes: t.mistakes || [],
      strategies: t.strategies || []
    }));
  } catch (err) {
    console.error("Fetch trades error:", err);
    return [];
  }
};

export const saveTrade = async (trade: Trade): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("AUTH_SESSION_MISSING: Login required to save trades.");

  const isTargetAdmin = session.user.email === 'mangeshpotale09@gmail.com';
  // CRITICAL: Ensure we are sending the authenticated user's ID for the row unless admin
  const targetUserId = isTargetAdmin ? trade.userId : session.user.id;

  const payload = {
    id: trade.id,
    user_id: targetUserId,
    symbol: trade.symbol,
    type: trade.type,
    side: trade.side,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice || null,
    quantity: trade.quantity,
    entry_date: trade.entryDate,
    // Fix: Changed trade.exit_date to trade.exitDate as defined in the Trade interface
    exit_date: trade.exitDate || null,
    fees: trade.fees,
    status: trade.status,
    tags: trade.tags,
    notes: trade.notes,
    option_details: trade.optionDetails || null,
    ai_review: trade.aiReview || null,
    attachments: trade.attachments || [],
    emotions: trade.emotions,
    mistakes: trade.mistakes,
    strategies: trade.strategies
  };
  
  console.debug("Saving trade payload:", payload);
  const { error } = await supabase.from('trades').upsert(payload, { onConflict: 'id' });
  
  if (error) {
    console.error("Save Trade Error:", error);
    throw new Error(`DB_SYNC_FAIL: ${error.message} (Code: ${error.code}). Ensure user_id matches auth.uid().`);
  }
};

export const saveTrades = async (trades: Trade[]): Promise<void> => {
  for (const trade of trades) {
    await saveTrade(trade);
  }
};

export const deleteTradeFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('trades').delete().eq('id', id);
  if (error) throw error;
};

// --- Admin Helpers ---

export const getRegisteredUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*').order('joined_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id,
    displayId: p.display_id,
    email: p.email,
    name: p.name,
    mobile: p.mobile,
    isPaid: p.is_paid || p.role === 'ADMIN',
    role: p.role as UserRole,
    status: p.status as UserStatus,
    joinedAt: p.joined_at,
    ownReferralCode: p.own_referral_code,
    paymentScreenshot: p.payment_screenshot,
    selectedPlan: p.selected_plan as PlanType,
    amountPaid: p.amount_paid,
    expiryDate: p.expiry_date
  }));
};

export const saveUsers = async (users: User[]): Promise<void> => {
  for (const user of users) {
    const payload = {
      id: user.id,
      display_id: user.displayId,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      joined_at: user.joinedAt,
      own_referral_code: user.ownReferralCode,
      payment_screenshot: user.paymentScreenshot,
      selected_plan: user.selectedPlan,
      is_paid: user.isPaid
    };
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  }
};

export const getAdminOverviewStats = async () => {
  const [u, t, tx, p] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('trades').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', UserStatus.WAITING_APPROVAL)
  ]);
  return { totalUsers: u.count || 0, totalTrades: t.count || 0, totalTransactions: tx.count || 0, pendingApprovals: p.count || 0 };
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  let updatePayload: any = { status, is_paid: status === UserStatus.APPROVED };

  if (status === UserStatus.APPROVED) {
    // Fetch user's requested plan to calculate expiry and amount
    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_plan')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.selected_plan) {
      const now = new Date();
      let daysToAdd = 30;
      let price = 299;

      if (profile.selected_plan === PlanType.SIX_MONTHS) {
        daysToAdd = 180;
        price = 599;
      } else if (profile.selected_plan === PlanType.ANNUAL) {
        daysToAdd = 365;
        price = 999;
      }

      const expiryDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      updatePayload.expiry_date = expiryDate.toISOString();
      updatePayload.amount_paid = price;
    }
  } else if (status === UserStatus.PENDING || status === UserStatus.REJECTED) {
    updatePayload.is_paid = false;
    updatePayload.expiry_date = null;
    updatePayload.amount_paid = 0;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId);
  
  if (error) throw error;
  localStorage.removeItem(PROFILE_CACHE_KEY);
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return (data || []).map(tx => ({
    id: tx.id,
    orderId: tx.order_id,
    signature: tx.signature,
    userId: tx.user_id,
    userName: tx.user_name,
    plan: tx.plan as PlanType,
    amount: tx.amount,
    method: tx.method,
    timestamp: tx.timestamp,
    status: tx.status
  }));
};

export const exportUsersToCSV = (users: User[]): void => {
  if (users.length === 0) return;
  const headers = [
    'ID', 
    'Identity', 
    'Plan Requested', 
    'Plan Start Date', 
    'Plan End Date', 
    'Amount Paid'
  ];
  
  const rows = users.map(u => {
    const startDate = u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : 'N/A';
    const endDate = u.expiryDate ? new Date(u.expiryDate).toLocaleDateString() : 'N/A';
    const identity = `"${u.name} (${u.email})"`;
    const amount = u.amountPaid ? `₹${u.amountPaid.toLocaleString()}` : '0';
    
    return [
      u.displayId,
      identity,
      u.selectedPlan || 'NONE',
      startDate,
      endDate,
      amount
    ];
  });
  
  const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `TradeMind_User_Report_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};
