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
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      console.warn("[Complaints] No access token found in localStorage");
    }
    return token;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = getAuthToken();
    if (!token) {
      setMessage({ text: "Требуется авторизация", type: "error" });
      return;
    }

    // Проверка верификации email
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (!user.emailVerified) {
        setMessage({ 
          text: "Для отправки жалоб необходимо подтвердить email. Проверьте почту и подтвердите email.", 
          type: "error" 
        });
        return;
      }
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
      if (formData.targetType === "user") {
        if (!targetUsername.trim()) {
          setMessage({ text: "Укажите никнейм пользователя", type: "error" });
          setSubmitting(false);
          return;
        }

        // Ищем пользователя по нику
        const searchResponse = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(targetUsername.trim())}&limit=1`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          credentials: "include",
        });
        
        if (!searchResponse.ok) {
          throw new Error("Ошибка при поиске пользователя");
        }

        const searchData = await searchResponse.json();
        if (!searchData.users || searchData.users.length === 0) {
          setMessage({ text: "Пользователь не найден. Проверьте правильность никнейма", type: "error" });
          setSubmitting(false);
          return;
        }

        targetUserId = searchData.users[0].id;
        
        if (!targetUserId) {
          setMessage({ text: "Не удалось получить ID пользователя", type: "error" });
          setSubmitting(false);
          return;
        }
      }

      // Проверяем обязательные поля в зависимости от типа
      if (formData.targetType === "message" || formData.targetType === "post") {
        if (!formData.targetContentId || !formData.targetContentId.trim()) {
          setMessage({ text: `Укажите ID ${formData.targetType === "message" ? "сообщения" : "поста"}`, type: "error" });
          setSubmitting(false);
          return;
        }
      }

      console.log("[Complaints] Submitting complaint with token:", token ? "Token present" : "No token");
      
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          targetType: formData.targetType,
          targetUserId: formData.targetType === "user" ? targetUserId : undefined,
          targetContentId: (formData.targetType === "message" || formData.targetType === "post") 
            ? formData.targetContentId?.trim() 
            : undefined,
          reason: formData.reason.trim(),
          comment: formData.comment?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Неизвестная ошибка" } }));
        const errorMessage = errorData.error?.message || errorData.message || "Ошибка при отправке жалобы";
        
        console.error("[Complaints] Error response:", response.status, errorData);
        
        // Обработка специфичных ошибок
        if (response.status === 401) {
          // Проверяем, есть ли токен
          if (!token) {
            throw new Error("Требуется авторизация. Пожалуйста, войдите в систему");
          } else {
            // Токен есть, но неверный или истек - нужно обновить
            throw new Error("Сессия истекла. Пожалуйста, войдите в систему снова");
          }
        } else if (response.status === 429) {
          throw new Error("Превышен лимит жалоб. Попробуйте позже");
        } else if (response.status === 400) {
          throw new Error(errorMessage);
        } else {
          throw new Error(errorMessage);
        }
      }

      const result = await response.json();
      
      setMessage({ text: "Жалоба успешно отправлена", type: "success" });
      setFormData({
        targetType: "user",
        reason: "",
        comment: "",
        targetUserId: undefined,
        targetContentId: undefined,
      });
      setTargetUsername("");
    } catch (error: any) {
      console.error("Complaint submission error:", error);
      setMessage({ 
        text: error.message || "Ошибка при отправке жалобы. Проверьте подключение к серверу", 
        type: "error" 
      });
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



