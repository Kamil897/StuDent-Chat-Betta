import React, { useState, useEffect } from "react";
import s from "./Shop.module.scss";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getTimeUntilDailyReward, getTimeUntilWeeklyReward } from "../../utils/dailyRewards";
import { getTimeUntilLotteryPurchase } from "../../utils/gameUnlock";

/* =========================
   TYPES покупка подписки ии
========================= */

interface Prefix {
  id: string | number;
  name: string;
  description: string;
  image: string;
  price?: number;
  currency?: string;
  type?: string;
  rewardType?: "daily" | "weekly";
}

interface ShopProps {
  prefix?: Prefix; // 👈 ВАЖНО
  onBuy?: () => void;
  disabled?: boolean;
  isPurchased?: boolean;
}

/* =========================
   COMPONENT
========================= */

const Shop: React.FC<ShopProps> = ({
  prefix,
  onBuy,
  disabled = false,
  isPurchased = false,
}) => {
  const { t } = useTranslation();
  const [timeUntilNext, setTimeUntilNext] = useState<string>("");

  // Обновляем таймер для бесплатных наград
  useEffect(() => {
    if (!prefix) {
      setTimeUntilNext("");
      return;
    }

    // Показываем таймер для бесплатных наград (points с rewardType или lottery)
    const shouldShowTimer = (prefix.type === "points" && prefix.rewardType) || prefix.type === "lottery";
    
    if (!shouldShowTimer) {
      setTimeUntilNext("");
      return;
    }

    const updateTimer = () => {
      if (prefix.type === "points" && prefix.rewardType === "daily") {
        const hours = getTimeUntilDailyReward();
        if (hours > 0) {
          const hoursLeft = Math.floor(hours);
          const minutesLeft = Math.floor((hours - hoursLeft) * 60);
          if (hoursLeft > 0) {
            setTimeUntilNext(`Доступно через ${hoursLeft} ч. ${minutesLeft} мин.`);
          } else if (minutesLeft > 0) {
            setTimeUntilNext(`Доступно через ${minutesLeft} мин.`);
          } else {
            setTimeUntilNext("Доступно сейчас");
          }
        } else {
          setTimeUntilNext("Доступно сейчас");
        }
      } else if (prefix.type === "points" && prefix.rewardType === "weekly") {
        const days = getTimeUntilWeeklyReward();
        if (days > 0) {
          const daysLeft = Math.floor(days);
          const hoursLeft = Math.floor((days - daysLeft) * 24);
          if (daysLeft > 0) {
            setTimeUntilNext(`Доступно через ${daysLeft} дн. ${hoursLeft} ч.`);
          } else if (hoursLeft > 0) {
            setTimeUntilNext(`Доступно через ${hoursLeft} ч.`);
          } else {
            setTimeUntilNext("Доступно сейчас");
          }
        } else {
          setTimeUntilNext("Доступно сейчас");
        }
      } else if (prefix.type === "lottery") {
        const hours = getTimeUntilLotteryPurchase();
        if (hours > 0) {
          const hoursLeft = Math.floor(hours);
          const minutesLeft = Math.floor((hours - hoursLeft) * 60);
          if (hoursLeft > 0) {
            setTimeUntilNext(`Доступно через ${hoursLeft} ч. ${minutesLeft} мин.`);
          } else if (minutesLeft > 0) {
            setTimeUntilNext(`Доступно через ${minutesLeft} мин.`);
          } else {
            setTimeUntilNext("Доступно сейчас");
          }
        } else {
          setTimeUntilNext("Доступно сейчас");
        }
      } else {
        setTimeUntilNext("");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Обновляем каждую минуту

    return () => clearInterval(interval);
  }, [prefix, isPurchased]);

  // 🛑 ЕСЛИ НЕТ ДАННЫХ — НЕ РЕНДЕРИМ
  if (!prefix) {
    return (
      <div className={s.prefixCard}>
        <p style={{ color: "#aaa", textAlign: "center" }}>
          Product not found
        </p>
      </div>
    );
  }

  return (
    <div className={s.prefixCard}>
      <div className={s.cardHeader}>
        <img
          src={prefix.image}
          alt={t(prefix.name)}
          className={s.cardPhoto}
        />
        <h2>{t(prefix.name)}</h2>
        <p>{t(prefix.description)}</p>
      </div>

      <div className={s.cardBody}>
        {prefix.price !== undefined && (
          <div className={s.priceDisplay}>
            {prefix.currency ? (
              <span className={s.realMoneyPrice}>
                {prefix.price} {prefix.currency}
              </span>
            ) : (
              <span className={s.pointsPrice}>
                {prefix.price === 0 ? "Бесплатно" : `${prefix.price} баллов`}
              </span>
            )}
          </div>
        )}
        <button
          className={s.buyButton}
          disabled={disabled}
          onClick={onBuy}
        >
          {(() => {
            if (isPurchased) {
              if (prefix.type === "subscription") return "✅ Подписка активна";
              if (prefix.type === "points") return "✅ Уже получено";
              if (prefix.type === "game") return "✅ Игра разблокирована";
              if (prefix.type === "lottery") return "⏰ Доступно завтра";
              return "✅ Куплено";
            }
            if (prefix.type === "subscription") return "💳 Купить подписку";
            if (prefix.type === "points") {
              if (prefix.price === 0) return "🎁 Получить бесплатно";
              return "💰 Получить баллы";
            }
            if (prefix.type === "game") return "🔓 Разблокировать игру";
            if (prefix.type === "lottery") return "🎰 Купить лотерею";
            return prefix.price === 0 ? "🎁 Получить" : `🛒 Купить за ${prefix.price} баллов`;
          })()}
        </button>

        {/* Показываем время до следующей доступности для бесплатных наград */}
        {timeUntilNext && ((prefix.type === "points" && prefix.rewardType) || prefix.type === "lottery") && (
          <div className={s.timeInfo}>
            ⏰ {timeUntilNext}
          </div>
        )}
        
        {/* Ссылка на детали только для платных товаров (не подписки, не лотерея, не бесплатные награды) */}
        {prefix.type !== "subscription" && 
         prefix.type !== "lottery" && 
         prefix.type !== "points" && 
         prefix.price !== undefined && 
         prefix.price > 0 && (
          <Link to={`/product/${prefix.id}`} className={s.noUnderline}>
            <button className={s.buyButtonExtra}>
              ℹ️ {t("shop_2.details") || "Подробнее"}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Shop;
