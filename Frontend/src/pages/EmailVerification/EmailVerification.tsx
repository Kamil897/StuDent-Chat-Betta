import { useState, useEffect } from "react";
import S from "./EmailVerification.module.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
}

export default function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      setError("Введите полный код");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          code: verificationCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Неверный код верификации");
      }

      // Update user in localStorage
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        user.emailVerified = true;
        localStorage.setItem("user", JSON.stringify(user));
      }

      onVerified();
    } catch (err: any) {
      setError(err.message || "Ошибка при проверке кода");
      setCode(["", "", "", "", "", ""]);
      document.getElementById("code-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка при отправке кода");
      }

      const data = await response.json();
      setCountdown(60); // 60 seconds cooldown
      alert(data.message || "Код отправлен повторно");
    } catch (err: any) {
      setError(err.message || "Ошибка при отправке кода");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={S.wrapper}>
      <div className={S.card}>
        <h1>Подтверждение Email</h1>
        <p className={S.description}>
          Мы отправили код подтверждения на <strong>{email}</strong>
        </p>
        <p className={S.hint}>
          Введите 6-значный код из письма
        </p>

        <div className={S.codeInputs}>
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={S.codeInput}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && <p className={S.error}>{error}</p>}

        <button
          className={S.verifyButton}
          onClick={handleVerify}
          disabled={loading || code.join("").length !== 6}
        >
          {loading ? "Проверка..." : "Подтвердить"}
        </button>

        <div className={S.resendSection}>
          <p>Не получили код?</p>
          <button
            className={S.resendButton}
            onClick={handleResend}
            disabled={resending || countdown > 0}
          >
            {countdown > 0
              ? `Отправить повторно через ${countdown}с`
              : resending
              ? "Отправка..."
              : "Отправить код повторно"}
          </button>
        </div>
      </div>
    </div>
  );
}
