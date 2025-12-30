/**
 * Payment System for Real Money Subscriptions
 * Handles payment processing for AI subscriptions
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  type: "cognia" | "trai";
  duration: number; // days
  price: number; // in currency (USD, RUB, etc.)
  currency: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "cognia_monthly",
    name: "Cognia Pro - Месяц",
    description: "Расширенный доступ к AI Cognia на 30 дней",
    type: "cognia",
    duration: 30,
    price: 9.99,
    currency: "USD",
    features: [
      "Неограниченные запросы",
      "Приоритетная обработка",
      "Расширенный контекст",
      "Эксклюзивные функции"
    ]
  },
  {
    id: "cognia_quarterly",
    name: "Cognia Pro - Квартал",
    description: "Расширенный доступ к AI Cognia на 90 дней (экономия 20%)",
    type: "cognia",
    duration: 90,
    price: 23.99,
    currency: "USD",
    features: [
      "Неограниченные запросы",
      "Приоритетная обработка",
      "Расширенный контекст",
      "Эксклюзивные функции",
      "Приоритетная поддержка"
    ]
  },
  {
    id: "trai_monthly",
    name: "Trai Pro - Месяц",
    description: "Расширенный доступ к AI Trai на 30 дней",
    type: "trai",
    duration: 30,
    price: 9.99,
    currency: "USD",
    features: [
      "Неограниченные симуляции",
      "Расширенные настройки",
      "Экспорт результатов",
      "Приоритетная обработка"
    ]
  },
  {
    id: "trai_quarterly",
    name: "Trai Pro - Квартал",
    description: "Расширенный доступ к AI Trai на 90 дней (экономия 20%)",
    type: "trai",
    duration: 90,
    price: 23.99,
    currency: "USD",
    features: [
      "Неограниченные симуляции",
      "Расширенные настройки",
      "Экспорт результатов",
      "Приоритетная обработка",
      "Приоритетная поддержка"
    ]
  }
];

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(type: "cognia" | "trai"): boolean {
  try {
    const subKey = type === "cognia" ? "cognia_pro" : "trai_pro";
    const isActive = localStorage.getItem(subKey) === "true";
    
    if (!isActive) return false;

    const expiresKey = `${subKey}_expires`;
    const expiresStr = localStorage.getItem(expiresKey);
    
    if (!expiresStr) return false;

    const expires = new Date(expiresStr);
    const now = new Date();

    if (now > expires) {
      // Subscription expired
      localStorage.removeItem(subKey);
      localStorage.removeItem(expiresKey);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get subscription expiry date
 */
export function getSubscriptionExpiry(type: "cognia" | "trai"): Date | null {
  try {
    const subKey = type === "cognia" ? "cognia_pro" : "trai_pro";
    const expiresKey = `${subKey}_expires`;
    const expiresStr = localStorage.getItem(expiresKey);
    
    if (!expiresStr) return null;

    return new Date(expiresStr);
  } catch {
    return null;
  }
}

/**
 * Activate subscription (after payment)
 */
export function activateSubscription(planId: string): boolean {
  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return false;

    const subKey = `${plan.type}_pro`;
    const expiresKey = `${subKey}_expires`;
    
    const expires = new Date();
    expires.setDate(expires.getDate() + plan.duration);

    localStorage.setItem(subKey, "true");
    localStorage.setItem(expiresKey, expires.toISOString());
    localStorage.setItem(`${subKey}_plan`, planId);
    localStorage.setItem(`${subKey}_purchased_at`, new Date().toISOString());

    // Dispatch event
    window.dispatchEvent(new CustomEvent("subscription-activated", { 
      detail: { type: plan.type, planId, expires: expires.toISOString() } 
    }));

    return true;
  } catch {
    return false;
  }
}

/**
 * Process payment (mock implementation - replace with real payment gateway)
 */
export async function processPayment(
  planId: string,
  paymentMethod: "card" | "paypal" | "crypto"
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // This is a mock implementation
  // In production, integrate with payment gateway (Stripe, PayPal, etc.)
  
  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { success: false, error: "План не найден" };
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock successful payment
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save transaction
    const transactions = JSON.parse(localStorage.getItem("payment_transactions") || "[]");
    transactions.push({
      id: transactionId,
      planId,
      amount: plan.price,
      currency: plan.currency,
      method: paymentMethod,
      date: new Date().toISOString(),
      status: "completed"
    });
    localStorage.setItem("payment_transactions", JSON.stringify(transactions));

    // Activate subscription
    if (activateSubscription(planId)) {
      return { success: true, transactionId };
    }

    return { success: false, error: "Ошибка активации подписки" };
  } catch (error) {
    return { success: false, error: "Ошибка обработки платежа" };
  }
}

/**
 * Get payment history
 */
export function getPaymentHistory(): any[] {
  try {
    return JSON.parse(localStorage.getItem("payment_transactions") || "[]");
  } catch {
    return [];
  }
}


