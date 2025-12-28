import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Shop from "../Shop/Shop";
import s from "./Magaz.module.scss";
import { Link } from "react-router-dom";

/* =======================
   TYPES
======================= */

interface Product {
  id: number;
  name: string;
  description: string;
  image: string;
  price: number;
  rarity: "common" | "rare" | "legendary";
}

/* =======================
   MOCK DATA
======================= */

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "shop.item.vip",
    description: "shop.item.vip_desc",
    image: "/images/vip.png",
    price: 500,
    rarity: "legendary",
  },
  {
    id: 2,
    name: "shop.item.blue",
    description: "shop.item.blue_desc",
    image: "/images/blue.png",
    price: 200,
    rarity: "rare",
  },
  {
    id: 3,
    name: "shop.item.green",
    description: "shop.item.green_desc",
    image: "/images/green.png",
    price: 100,
    rarity: "common",
  },
];

/* =======================
   COMPONENT
======================= */

const Magaz: React.FC = () => {
  const { t } = useTranslation();

  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [points, setPoints] = useState<number>(1000);
  const [purchased, setPurchased] = useState<number[]>(() => {
    return JSON.parse(localStorage.getItem("purchased") || "[]");
  });

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
    if (purchased.includes(product.id)) return;
    if (points < product.price) {
      showNotification(t("shop.insufficientFunds"), "error");
      return;
    }

    setPoints((p) => p - product.price);
    setPurchased((prev) => {
      const updated = [...prev, product.id];
      localStorage.setItem("purchased", JSON.stringify(updated));
      return updated;
    });

    showNotification(`✅ ${t(product.name)} ${t("shop.success")}`, "success");
  };

  const affordableCount = products.filter((p) => points >= p.price).length;

  const filteredProducts = products
    .filter((p) => {
      if (filter === "affordable") return points >= p.price;
      if (filter === "unaffordable") return points < p.price;
      if (filter === "purchased") return purchased.includes(p.id);
      return true;
    })
    .filter((p) => {
      if (!searchQuery) return true;
      return (
        t(p.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t(p.description).toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rarity") {
        const order = { common: 1, rare: 2, legendary: 3 };
        return order[b.rarity] - order[a.rarity];
      }
      return t(a.name).localeCompare(t(b.name));
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
          const isPurchased = purchased.includes(product.id);
          const canAfford = points >= product.price;

          return (
            <Shop
              key={product.id}
              prefix={product}
              onBuy={() => handleBuy(product)}
              disabled={!canAfford || isPurchased}
              isPurchased={isPurchased}
            />
          );
        })}
      </div>

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
