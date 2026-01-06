import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Complaints.module.scss";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface ComplaintFormData {
  targetType: "user" | "message" | "post" | "other";
  targetUserId?: string;
  targetContentId?: string;
  reason: string;
  comment?: string;
}

const Complaints: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ComplaintFormData>({
    targetType: "user",
    reason: "",
    comment: "",
  });
  const [targetUsername, setTargetUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const getAuthToken = (): string | null => {
    return localStorage.getItem("accessToken") || localStorage.getItem("token");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = getAuthToken();
    if (!token) {
      setMessage({ text: "Требуется авторизация", type: "error" });
      return;
    }

    if (!formData.reason.trim()) {
      setMessage({ text: "Укажите причину жалобы", type: "error" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Если тип жалобы - пользователь, ищем пользователя по нику
      let targetUserId = formData.targetUserId;
      if (formData.targetType === "user" && targetUsername && !targetUserId) {
        const searchResponse = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(targetUsername)}&limit=1`, {
          credentials: "include",
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.users && searchData.users.length > 0) {
            targetUserId = searchData.users[0].id;
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          targetType: formData.targetType,
          targetUserId: targetUserId || undefined,
          targetContentId: formData.targetContentId || undefined,
          reason: formData.reason,
          comment: formData.comment || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Ошибка при отправке жалобы");
      }

      setMessage({ text: "Жалоба успешно отправлена", type: "success" });
      setFormData({
        targetType: "user",
        reason: "",
        comment: "",
      });
      setTargetUsername("");
    } catch (error: any) {
      setMessage({ text: error.message || "Ошибка при отправке жалобы", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Система жалоб</h1>
      <p className={styles.description}>
        Если вы столкнулись с неподобающим поведением или контентом, пожалуйста, отправьте жалобу.
        Все жалобы рассматриваются администраторами вручную.
      </p>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Тип жалобы:</label>
          <select
            value={formData.targetType}
            onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
            required
          >
            <option value="user">Пользователь</option>
            <option value="message">Сообщение</option>
            <option value="post">Пост</option>
            <option value="other">Другое</option>
          </select>
        </div>

        {formData.targetType === "user" && (
          <div className={styles.field}>
            <label>Никнейм/Имя пользователя:</label>
            <input
              type="text"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              placeholder="Введите никнейм или имя пользователя"
            />
          </div>
        )}

        {formData.targetType === "message" && (
          <div className={styles.field}>
            <label>ID сообщения:</label>
            <input
              type="text"
              value={formData.targetContentId || ""}
              onChange={(e) => setFormData({ ...formData, targetContentId: e.target.value })}
              placeholder="Введите ID сообщения"
            />
          </div>
        )}

        {formData.targetType === "post" && (
          <div className={styles.field}>
            <label>ID поста:</label>
            <input
              type="text"
              value={formData.targetContentId || ""}
              onChange={(e) => setFormData({ ...formData, targetContentId: e.target.value })}
              placeholder="Введите ID поста"
            />
          </div>
        )}

        <div className={styles.field}>
          <label>Причина жалобы:</label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          >
            <option value="">Выберите причину</option>
            <option value="spam">Спам</option>
            <option value="harassment">Оскорбления/Харассмент</option>
            <option value="inappropriate_content">Неподобающий контент</option>
            <option value="scam">Мошенничество</option>
            <option value="other">Другое</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Комментарий (необязательно):</label>
          <textarea
            value={formData.comment || ""}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Дополнительная информация о жалобе"
            rows={4}
          />
        </div>

        <button type="submit" disabled={submitting} className={styles.submitButton}>
          {submitting ? "Отправка..." : "Отправить жалобу"}
        </button>
      </form>
    </div>
  );
};

export default Complaints;


