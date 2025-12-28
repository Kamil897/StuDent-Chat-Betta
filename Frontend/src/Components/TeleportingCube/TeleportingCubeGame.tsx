import React, { useEffect, useRef, useState } from "react";

export default function TeleportingCubeGameApp() {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [speedText, setSpeedText] = useState("1x");
  const [cubeSkin, setCubeSkin] = useState("default");
  const [bombSkin, setBombSkin] = useState("default");
  const [achievementsUnlocked, setAchievementsUnlocked] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("achievementsUnlocked") || "[]");
    } catch {
      return [];
    }
  });

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const cubeRef = useRef<HTMLDivElement | null>(null);

  // ✅ браузерный таймер
  const teleportTimerRef = useRef<number | null>(null);

  const cubeClickedRef = useRef(false);
  const isBombRef = useRef(false);

  const baseSpeedRef = useRef(2000);
  const currentSpeedRef = useRef(2000);

  const maxScoreRef = useRef<number>(
    parseInt(localStorage.getItem("maxScore") || "0", 10)
  );
  const maxScoreValueRef = useRef<HTMLDivElement | null>(null);

  /* =========================
     ACHIEVEMENTS (FRONT ONLY)
  ========================= */
  const achievementsDef = useRef([
    { id: "firstClick", text: "First Click!", check: () => score >= 1 },
    { id: "score10", text: "Score 10 Points!", check: () => score >= 10 },
    { id: "score50", text: "Score 50 Points!", check: () => score >= 50 },
    { id: "level5", text: "Reach Level 5!", check: () => level >= 5 },
    { id: "speed3x", text: "Speed 3x!", check: () => parseFloat(speedText) >= 3 },
  ]);

  const saveMaxScore = (v: number) =>
    localStorage.setItem("maxScore", String(v));

  const saveAchievements = (arr: string[]) =>
    localStorage.setItem("achievementsUnlocked", JSON.stringify(arr));

  /* =========================
     GAME LOGIC
  ========================= */
  const positionCube = () => {
    if (!gameAreaRef.current || !cubeRef.current) return;

    const size = isBombRef.current ? 40 : 50;
    const padding = 20;

    const maxX = gameAreaRef.current.clientWidth - size - padding;
    const maxY = gameAreaRef.current.clientHeight - size - padding;

    cubeRef.current.style.left = Math.random() * maxX + padding + "px";
    cubeRef.current.style.top = Math.random() * maxY + padding + "px";
  };

  const applyCurrentSkin = () => {
    if (!cubeRef.current) return;

    cubeRef.current.className = "cube";

    if (isBombRef.current) {
      cubeRef.current.classList.add("bomb");
      if (bombSkin !== "default") cubeRef.current.classList.add(bombSkin);
    } else {
      if (cubeSkin !== "default") cubeRef.current.classList.add(cubeSkin);
    }
  };

  const setMode = () => {
    isBombRef.current = Math.random() < 0.25;
    applyCurrentSkin();
  };

  const checkAchievements = () => {
    let updated = false;
    const unlocked = [...achievementsUnlocked];

    achievementsDef.current.forEach(a => {
      if (!unlocked.includes(a.id) && a.check()) {
        unlocked.push(a.id);
        updated = true;
      }
    });

    if (updated) {
      setAchievementsUnlocked(unlocked);
      saveAchievements(unlocked);
    }
  };

  useEffect(() => {
    if (score > maxScoreRef.current) {
      maxScoreRef.current = score;
      saveMaxScore(score);
    }
    checkAchievements();
  }, [score, level, speedText]);

  const updateProgress = (newScore: number) => {
    setLevel(Math.floor(newScore / 10) + 1);

    const reduction = Math.floor(newScore / 5) * 0.05;
    const speed = Math.max(400, baseSpeedRef.current * (1 - reduction));

    currentSpeedRef.current = speed;
    setSpeedText((baseSpeedRef.current / speed).toFixed(1) + "x");
  };

  const clearTimer = () => {
    if (teleportTimerRef.current) {
      clearTimeout(teleportTimerRef.current);
      teleportTimerRef.current = null;
    }
  };

  const startTeleportTimer = () => {
    clearTimer();

    teleportTimerRef.current = window.setTimeout(() => {
      if (!cubeClickedRef.current && !isBombRef.current) {
        setScore(prev => Math.max(0, prev - 1));
      }

      cubeClickedRef.current = false;
      setMode();
      positionCube();
      startTeleportTimer();
    }, currentSpeedRef.current);
  };

  const createClickEffect = (x: number, y: number, type = "") => {
    if (!gameAreaRef.current) return;

    const rect = gameAreaRef.current.getBoundingClientRect();
    const el = document.createElement("div");

    el.className = `click-effect ${type}`;
    el.style.left = x - rect.left - 15 + "px";
    el.style.top = y - rect.top - 15 + "px";

    gameAreaRef.current.appendChild(el);
    setTimeout(() => el.remove(), 600);
  };

  const onCubeClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!cubeRef.current) return;

    cubeRef.current.classList.add("clicked");
    setTimeout(() => cubeRef.current?.classList.remove("clicked"), 400);

    if (isBombRef.current) {
      createClickEffect(e.clientX, e.clientY, "error");
      setScore(0);
      setLevel(1);
      currentSpeedRef.current = baseSpeedRef.current;
      setSpeedText("1x");
    } else {
      createClickEffect(e.clientX, e.clientY, "success");
      cubeClickedRef.current = true;

      setScore(prev => {
        const next = prev + 1;
        updateProgress(next);
        return next;
      });
    }

    clearTimer();
    setTimeout(() => {
      setMode();
      positionCube();
      startTeleportTimer();
    }, 100);
  };

  useEffect(() => {
    setMode();
    positionCube();
    startTeleportTimer();
    return clearTimer;
  }, []);

  useEffect(() => {
    applyCurrentSkin();
  }, [cubeSkin, bombSkin]);

  /* =========================
     UI
  ========================= */
  const achievementsList = achievementsDef.current.map(a => ({
    ...a,
    unlocked: achievementsUnlocked.includes(a.id),
  }));

  return (
    <div className="app-wrap">
      {/* UI + CSS оставлены как у тебя */}
      {/* game-area, cube, skins, achievements — всё фронт */}
    </div>
  );
}
