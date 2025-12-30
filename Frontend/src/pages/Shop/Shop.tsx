import React from "react";
import s from "./Shop.module.scss";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
          {isPurchased ? t("shop_2.purchasedLabel") : prefix.type === "subscription" ? "Купить подписку" : t("shop_2.buy")}
        </button>

        {prefix.type !== "subscription" && (
          <Link to={`/product/${prefix.id}`} className={s.noUnderline}>
            <button className={s.buyButtonExtra}>
              {t("shop_2.details")}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Shop;
