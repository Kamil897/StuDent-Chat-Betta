import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Shop from "../Shop/Shop";
import s from "./Magaz.module.scss";
import { Link } from "react-router-dom";
import { getPoints, spendPoints, addPoints } from "../../utils/points";
import { 
  isGameUnlocked, 
  unlockGame, 
  getGameUnlockPrice, 
  lotteryUnlockGame,
  getLockedGames,
  getLotteryPrice,
  canPurchaseLotteryToday,
  getTimeUntilLotteryPurchase
} from "../../utils/gameUnlock";
import {
  canClaimDailyReward,
  claimDailyReward,
  getTimeUntilDailyReward,
  canClaimWeeklyReward,
  claimWeeklyReward,
  getTimeUntilWeeklyReward
} from "../../utils/dailyRewards";
import {
  SUBSCRIPTION_PLANS,
  hasActiveSubscription,
  processPayment,
  type SubscriptionPlan
} from "../../utils/payment";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/* =======================
   TYPES
======================= */

type ProductType = "subscription" | "points" | "game" | "lottery";

interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string; // For real money products
  rarity: "common" | "rare" | "legendary";
  type: ProductType;
  gameId?: string; // For game unlock products
  subscriptionType?: "cognia" | "trai"; // For subscription products (deprecated - use SubscriptionPlan)
  rewardType?: "daily" | "weekly"; // For free point rewards
  planId?: string; // For subscription plans
}

/* =======================
   MOCK DATA
======================= */

const MOCK_PRODUCTS: Product[] = [
  // Subscriptions are now handled separately via SUBSCRIPTION_PLANS
  // Free daily/weekly rewards
  {
    id: 3,
    name: "100 баллов (Ежедневно)",
    description: "Бесплатные 100 баллов раз в сутки",
    image: "/images/points.png",
    price: 0,
    rarity: "common",
    type: "points",
    rewardType: "daily",
  },
  {
    id: 4,
    name: "500 баллов (Еженедельно)",
    description: "Бесплатные 500 баллов раз в неделю",
    image: "/images/points.png",
    price: 0,
    rarity: "rare",
    type: "points",
    rewardType: "weekly",
  },
  // Lottery - price is dynamic, will be updated in component
  {
    id: 5,
    name: "Лотерея игр",
    description: "Случайная разблокировка игры (раз в сутки)",
    image: "/images/lottery.png",
    price: 75, // Will be updated dynamically
    rarity: "legendary",
    type: "lottery",
  },
];

/* =======================
   COMPONENT
======================= */

const Magaz: React.FC = () => {
  const { t } = useTranslation();

  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [points, setPoints] = useState<number>(getPoints());
  const [purchased, setPurchased] = useState<number[]>(() => {
    return JSON.parse(localStorage.getItem("purchased") || "[]");
  });
  const [lockedGames, setLockedGames] = useState<string[]>(getLockedGames());
  const [gameProducts, setGameProducts] = useState<Product[]>([]);
  const [subscriptionProducts, setSubscriptionProducts] = useState<Product[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [lotteryPrice, setLotteryPrice] = useState(getLotteryPrice());
  const [canBuyLottery, setCanBuyLottery] = useState(canPurchaseLotteryToday());

  // Update points when storage changes
  useEffect(() => {
    const updatePoints = () => {
      setPoints(getPoints());
      setLockedGames(getLockedGames());
      setLotteryPrice(getLotteryPrice());
      setCanBuyLottery(canPurchaseLotteryToday());
    };

    window.addEventListener('storage', updatePoints);
    window.addEventListener('game-win', updatePoints);
    window.addEventListener('game-unlocked', updatePoints);
    
    updatePoints();

    return () => {
      window.removeEventListener('storage', updatePoints);
      window.removeEventListener('game-win', updatePoints);
      window.removeEventListener('game-unlocked', updatePoints);
    };
  }, []);

  // Generate game unlock products
  useEffect(() => {
    const locked = getLockedGames();
    // Генерируем уникальный ID на основе хеша всей строки gameId
    const hashString = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const gameUnlockProducts: Product[] = locked.map((gameId, index) => ({
      id: 1000 + (hashString(gameId) % 9000) + index, // Уникальный ID на основе хеша и индекса
      name: `Разблокировать ${gameId}`,
      description: `Откройте доступ к игре ${gameId}`,
      image: "/images/game.png",
      price: getGameUnlockPrice(gameId),
      rarity: gameId.includes("Arena") ? "legendary" : gameId.includes("Mine") ? "rare" : "common",
      type: "game" as ProductType,
      gameId,
    }));
    setGameProducts(gameUnlockProducts);
  }, [lockedGames]);

  // Generate subscription products from plans
  useEffect(() => {
    // Генерируем уникальный ID на основе хеша всей строки planId
    const hashString = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    };
    
    const subProducts: Product[] = SUBSCRIPTION_PLANS.map((plan, index) => ({
      id: 2000 + (hashString(plan.id) % 9000) + index, // Уникальный ID на основе хеша и индекса
      name: plan.name,
      description: plan.description,
      image: plan.type === "cognia" ? "/images/cognia.png" : "/images/trai.png",
      price: plan.price,
      currency: plan.currency,
      rarity: "legendary",
      type: "subscription" as ProductType,
      planId: plan.id,
    }));
    setSubscriptionProducts(subProducts);
  }, []);

  const [filter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  /* =======================
     HELPERS
  ======================= */

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2500);
  };

  const handleBuy = (product: Product) => {
    if (purchased.includes(product.id) && product.type !== "lottery") return;
    
    // Handle different product types
    if (product.type === "points") {
      if (product.rewardType === "daily") {
        const result = claimDailyReward();
        if (result.success) {
          addPoints(100, "reward", "Daily Reward");
          setPoints(getPoints());
          showNotification(`✅ ${result.message} Получено 100 баллов!`, "success");
        } else {
          showNotification(result.message, "error");
        }
        return;
      }
      
      if (product.rewardType === "weekly") {
        const result = claimWeeklyReward();
        if (result.success) {
          addPoints(500, "reward", "Weekly Reward");
          setPoints(getPoints());
          showNotification(`✅ ${result.message} Получено 500 баллов!`, "success");
        } else {
          showNotification(result.message, "error");
        }
        return;
      }
      
      // Fallback for old point products
      const pointsToAdd = product.id === 3 ? 100 : 500;
      addPoints(pointsToAdd, "reward", "Points Purchase");
      setPoints(getPoints());
      showNotification(`✅ Получено ${pointsToAdd} баллов!`, "success");
      return;
    }

    if (product.type === "subscription" && product.planId) {
      // Open payment modal for real money subscription
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === product.planId);
      if (plan) {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
      }
      return;
    }

    if (product.type === "lottery") {
      // Check if can purchase today
      if (!canPurchaseLotteryToday()) {
        const hoursLeft = getTimeUntilLotteryPurchase();
        showNotification(`Лотерею можно купить только раз в сутки! Следующая покупка через ${hoursLeft} часов`, "error");
        return;
      }

      const currentLotteryPrice = getLotteryPrice();
      if (points < currentLotteryPrice) {
        showNotification(`Недостаточно баллов! Нужно ${currentLotteryPrice} баллов`, "error");
        return;
      }
      
      if (spendPoints(currentLotteryPrice, "Lottery")) {
        setPoints(getPoints());
        const result = lotteryUnlockGame();
        if (result.success) {
          setLockedGames(getLockedGames());
          setLotteryPrice(getLotteryPrice()); // Update price after purchase
          setCanBuyLottery(false); // Can't buy again today
          showNotification(result.message, "success");
        } else {
          showNotification(result.message, "error");
        }
      }
      return;
    }

    if (product.type === "game") {
      if (!product.gameId) return;
      if (isGameUnlocked(product.gameId)) {
        showNotification("Игра уже разблокирована!", "error");
        return;
      }
      if (points < product.price) {
        showNotification("Недостаточно баллов!", "error");
        return;
      }

      if (spendPoints(product.price, `Game Unlock: ${product.gameId}`)) {
        if (unlockGame(product.gameId)) {
          setPoints(getPoints());
          setLockedGames(getLockedGames());
          setPurchased((prev) => {
            const updated = [...prev, product.id];
            localStorage.setItem("purchased", JSON.stringify(updated));
            return updated;
          });
          showNotification(`✅ Игра "${product.gameId}" разблокирована!`, "success");
          
          // Add notification
          import("../../utils/notifications").then(({ notifyPurchase }) => {
            notifyPurchase(product.name || product.gameId, "game");
          });

          // Пытаемся уведомить backend об успешной разблокировке (необязательно)
          fetch(`${API_BASE_URL}/games/${encodeURIComponent(product.gameId)}/unlock`, {
            method: "POST",
            credentials: "include",
          }).catch(() => {
            // если backend недоступен или нет авторизации — просто игнорируем
          });
        }
      }
      return;
    }


    // Default purchase (old products)
    if (points < product.price) {
      showNotification(t("shop.insufficientFunds"), "error");
      return;
    }

    if (spendPoints(product.price, product.name)) {
      setPoints(getPoints());
      setPurchased((prev) => {
        const updated = [...prev, product.id];
        localStorage.setItem("purchased", JSON.stringify(updated));
        return updated;
      });
      showNotification(`✅ ${product.name} ${t("shop.success")}`, "success");
      
      // Add notification
      import("../../utils/notifications").then(({ notifyPurchase }) => {
        notifyPurchase(product.name, product.type === "subscription" ? "subscription" : "other");
      });
    }
  };

  const affordableCount = products.filter((p) => points >= p.price).length;

  // Update lottery product with current price and info
  const updatedProducts = products.map(p => {
    if (p.type === "lottery") {
      const purchaseCount = parseInt(localStorage.getItem("lottery_purchase_count") || "0", 10);
      const baseDescription = `Случайная разблокировка игры за ${lotteryPrice} баллов (раз в сутки)`;
      const priceInfo = purchaseCount > 0 
        ? ` Цена увеличивается на 50 баллов после каждой покупки.`
        : ` После покупки цена увеличится на 50 баллов.`;
      return {
        ...p,
        price: lotteryPrice,
        description: baseDescription + priceInfo
      };
    }
    return p;
  });

  const allProducts = [...updatedProducts, ...subscriptionProducts, ...gameProducts];
  
  const filteredProducts = allProducts
    .filter((p) => {
      if (p.type === "game" && p.gameId) {
        // Don't show already unlocked games
        if (isGameUnlocked(p.gameId)) return false;
      }
      if (filter === "affordable") return points >= p.price || p.price === 0;
      if (filter === "unaffordable") return points < p.price && p.price > 0;
      if (filter === "purchased") {
        if (p.type === "game" && p.gameId) {
          return isGameUnlocked(p.gameId);
        }
        return purchased.includes(p.id);
      }
      return true;
    })
    .filter((p) => {
      if (!searchQuery) return true;
      const name = typeof p.name === 'string' ? p.name : t(p.name);
      const desc = typeof p.description === 'string' ? p.description : t(p.description);
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rarity") {
        const order = { common: 1, rare: 2, legendary: 3 };
        return order[b.rarity] - order[a.rarity];
      }
      const nameA = typeof a.name === 'string' ? a.name : t(a.name);
      const nameB = typeof b.name === 'string' ? b.name : t(b.name);
      return nameA.localeCompare(nameB);
    });

  const totalSpent = products
    .filter((p) => purchased.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  /* =======================
     RENDER
  ======================= */

  return (
    <div className={s.container}>
      {notification && (
        <div className={`${s.notification} ${s[notification.type]}`}>
          {notification.message}
        </div>
      )}

      <header className={s.header}>
        <h1>{t("shop.title")}</h1>
        <p>{t("shop.available", { count: affordableCount, total: products.length })}</p>

        <div className={s.balance}>
          {t("shop.balance")}: {points}
        </div>

        <Link to="/Shop">
          <button className={s.Pointsbtn}>{t("shop.buypoints")}</button>
        </Link>
      </header>

      <div className={s.controls}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("shop.searchPlaceholder")}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">{t("shop.sortName")}</option>
          <option value="price-low">{t("shop.sortLow")}</option>
          <option value="price-high">{t("shop.sortHigh")}</option>
          <option value="rarity">{t("shop.sortRarity")}</option>
        </select>
      </div>

      <div className={s.productGrid}>
        {filteredProducts.map((product) => {
          let isPurchased = false;
          let canClaim = false;
          let timeUntilNext = "";
          
          if (product.type === "game" && product.gameId) {
            isPurchased = isGameUnlocked(product.gameId);
          } else if (product.type === "subscription" && product.planId) {
            const plan = SUBSCRIPTION_PLANS.find(p => p.id === product.planId);
            isPurchased = plan ? hasActiveSubscription(plan.type) : false;
          } else if (product.type === "points") {
            if (product.rewardType === "daily") {
              canClaim = canClaimDailyReward();
              isPurchased = !canClaim;
              if (!canClaim) {
                const hours = getTimeUntilDailyReward();
                timeUntilNext = `Следующая награда через ${hours} ч.`;
              }
            } else if (product.rewardType === "weekly") {
              canClaim = canClaimWeeklyReward();
              isPurchased = !canClaim;
              if (!canClaim) {
                const days = getTimeUntilWeeklyReward();
                timeUntilNext = `Следующая награда через ${days} дн.`;
              }
            } else {
              isPurchased = purchased.includes(product.id);
            }
          } else if (product.type === "lottery") {
            isPurchased = !canBuyLottery;
            if (!canBuyLottery) {
              const hours = getTimeUntilLotteryPurchase();
              timeUntilNext = `Следующая покупка через ${hours} ч.`;
            }
            // Lottery is never "purchased" permanently, just time-locked
            isPurchased = false; // Allow showing it, but disabled if can't buy
          } else {
            isPurchased = purchased.includes(product.id);
          }
          
          const canAfford = points >= product.price || product.price === 0;
          
          // Create product with time info and currency for display
          let productWithTime = product;
          if (timeUntilNext) {
            productWithTime = { ...product, description: `${product.description} (${timeUntilNext})` };
          }
          
          // Add currency info for subscription products
          const displayProduct = product.type === "subscription" && product.planId
            ? { ...productWithTime, currency: product.currency, type: "subscription" }
            : productWithTime;

          // Генерируем уникальный ключ на основе типа и уникального идентификатора
          const uniqueKey = product.type === "game" && product.gameId
            ? `game-${product.gameId}`
            : product.type === "subscription" && product.planId
            ? `subscription-${product.planId}`
            : product.type === "lottery"
            ? `lottery-${product.id}`
            : `${product.type}-${product.id}`;

          return (
            <Shop
              key={uniqueKey}
              prefix={displayProduct}
              onBuy={() => handleBuy(product)}
              disabled={(() => {
                if (product.type === "subscription" && product.planId) {
                  return isPurchased;
                }
                if (product.type === "lottery") {
                  return !canBuyLottery || points < product.price;
                }
                return (!canAfford && product.price > 0) || isPurchased;
              })()}
              isPurchased={(() => {
                if (product.type === "lottery") {
                  return !canBuyLottery;
                }
                if (product.type === "points") {
                  return isPurchased;
                }
                return isPurchased;
              })()}
            />
          );
        })}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className={s.paymentModal}>
          <div className={s.paymentModalContent}>
            <button 
              className={s.closeButton}
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPlan(null);
              }}
            >
              ×
            </button>
            <h2>Оплата подписки</h2>
            <div className={s.planInfo}>
              <h3>{selectedPlan.name}</h3>
              <p>{selectedPlan.description}</p>
              <div className={s.price}>
                {selectedPlan.price} {selectedPlan.currency}
              </div>
              <ul className={s.features}>
                {selectedPlan.features.map((feature, idx) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
            </div>
            <div className={s.paymentMethods}>
              <button
                className={s.paymentButton}
                onClick={async () => {
                  setPaymentProcessing(true);
                  const result = await processPayment(selectedPlan.id, "card");
                  setPaymentProcessing(false);
                  
                  if (result.success) {
                    // Активируем подписку на backend (если пользователь авторизован)
                    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
                    if (token) {
                      fetch(`${API_BASE_URL}/subscriptions/activate`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          type: selectedPlan.type,
                          durationDays: selectedPlan.duration,
                        }),
                      }).catch(() => {
                        // тихо игнорируем ошибки сети/авторизации
                      });
                    }

                    showNotification(`✅ Подписка активирована! ID транзакции: ${result.transactionId}`, "success");
                    setShowPaymentModal(false);
                    setSelectedPlan(null);
                  } else {
                    showNotification(`❌ Ошибка: ${result.error}`, "error");
                  }
                }}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? "Обработка..." : "Оплатить картой"}
              </button>
              <button
                className={s.paymentButton}
                onClick={async () => {
                  setPaymentProcessing(true);
                  const result = await processPayment(selectedPlan.id, "paypal");
                  setPaymentProcessing(false);
                  
                  if (result.success) {
                    // Активируем подписку на backend (если пользователь авторизован)
                    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
                    if (token) {
                      fetch(`${API_BASE_URL}/subscriptions/activate`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          type: selectedPlan.type,
                          durationDays: selectedPlan.duration,
                        }),
                      }).catch(() => {
                        // тихо игнорируем ошибки сети/авторизации
                      });
                    }

                    showNotification(`✅ Подписка активирована! ID транзакции: ${result.transactionId}`, "success");
                    setShowPaymentModal(false);
                    setSelectedPlan(null);
                  } else {
                    showNotification(`❌ Ошибка: ${result.error}`, "error");
                  }
                }}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? "Обработка..." : "Оплатить через PayPal"}
              </button>
            </div>
            <p className={s.paymentNote}>
              * Это демо-версия. В продакшене здесь будет интеграция с реальной платежной системой.
            </p>
          </div>
        </div>
      )}

      {purchased.length > 0 && (
        <div className={s.statistics}>
          <p>{t("shop.statsPurchased")}: {purchased.length}</p>
          <p>{t("shop.statsSpent")}: {totalSpent}</p>
        </div>
      )}
    </div>
  );
};

export default Magaz;
