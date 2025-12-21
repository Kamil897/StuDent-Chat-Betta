// AISimulation.tsx
import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import s from "./AISimulation.module.scss";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { checkIELTSEssay } from "../../utils/openai";

/** --------- TYPES --------- */
type WritingTask = {
  type: string;
  prompt: string;
};

type ReadingTask = {
  passage: string;
  questions: string[];
  correct: string[]; // length 40, values "A"|"B"|"C"|"D"
};

type MessageResult = {
  id: number;
  type: "writing" | "reading";
  createdAt: string;
  band?: number | null;
  payload?: any;
};

/** --------- MOCK HELPERS (front-only) --------- */

function mockWritingTask(difficulty: "easy" | "medium" | "hard"): WritingTask {
  const prompts: Record<string, string[]> = {
    easy: [
      "Describe your favourite place and explain why you like it.",
      "Do you prefer studying alone or with friends? Explain your view.",
    ],
    medium: [
      "Some people believe that children should start school earlier. Discuss both views and give your opinion.",
      "Is technology making our lives better? Give reasons and examples.",
    ],
    hard: [
      "Many argue that global economic inequality is increasing. To what extent do you agree or disagree?",
      "Should governments be responsible for ensuring sustainable urban development? Discuss.",
    ],
  };

  const list = prompts[difficulty] || prompts.easy;
  return {
    type: Math.random() > 0.5 ? "task1" : "task2",
    prompt: list[Math.floor(Math.random() * list.length)],
  };
}

function mockReadingTask(difficulty: "easy" | "medium" | "hard"): ReadingTask {
  const passages: Record<string, string> = {
    easy:
      "Cats are popular pets worldwide. They adapt well to human households and require relatively little maintenance compared to other animals.",
    medium:
      "Over the last century, industrialization reshaped economies: production increased drastically, migration patterns changed and societies adapted.",
    hard:
      "In quantum information theory, entanglement is a crucial resource. Researchers explore its applications in cryptography and computing.",
  };

  const questions = Array.from({ length: 40 }, (_, i) => `Question ${i + 1}`);
  const correct = Array.from({ length: 40 }, () =>
    ["A", "B", "C", "D"][Math.floor(Math.random() * 4)]
  );

  return {
    passage: passages[difficulty] || passages.easy,
    questions,
    correct,
  };
}

/** Простая эвристика для оценки письма — фронт-only */
function mockScoreWriting(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const band = Math.min(9, Math.max(1, Math.floor(words / 30) + 1));
  return { overall: band, words };
}

/** Fake AI check with simple heuristics (fallback) */
function mockAICheckWriting(text: string) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const band = Math.min(9, Math.max(1, Math.floor(words / 25) + 1));
  return {
    band,
    feedback: {
      taskAchievement:
        words > 150 ? "Task addressed adequately." : "Task could use more development.",
      coherence: words > 120 ? "Coherent structure." : "Work on paragraphing and flow.",
      lexicalResource:
        words > 140 ? "Good range of vocabulary." : "Use more varied vocabulary.",
      grammar: words > 100 ? "Few grammar mistakes." : "Frequent grammar errors detected.",
    },
  };
}

/** Reading scoring: compare answers with correct array */
function mockScoreReading(answers: string[], correct?: string[]) {
  const total = 40;
  if (!correct || correct.length !== total) {
    return { total, correct: 0, band: 0 };
  }
  let correctCount = 0;
  for (let i = 0; i < total; i++) {
    if ((answers[i] || "").trim().toUpperCase() === correct[i]) correctCount++;
  }
  // Convert correctCount to band (simple linear)
  const band = Math.round((correctCount / total) * 9 * 10) / 10;
  return { total, correct: correctCount, band };
}

/** LocalStorage helpers */
function lsLoadResults(): MessageResult[] {
  try {
    const raw = localStorage.getItem("ieltsResults");
    if (!raw) return [];
    return JSON.parse(raw) as MessageResult[];
  } catch {
    return [];
  }
}

function lsSaveResult(item: MessageResult) {
  const prev = lsLoadResults();
  const next = [item, ...prev];
  localStorage.setItem("ieltsResults", JSON.stringify(next));
  return next;
}

/** --------- COMPONENT --------- */

export default function AISimulation(): JSX.Element {
  const [mode, setMode] = useState<"writing" | "reading">("writing");
  const [loading, setLoading] = useState(false);

  // Difficulty
  const [writingDifficulty, setWritingDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );
  const [readingDifficulty, setReadingDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );

  // Writing
  const [writingTask, setWritingTask] = useState<WritingTask | null>(null);
  const [essay, setEssay] = useState("");
  const [writingScore, setWritingScore] = useState<any | null>(null);
  const [writingAIResult, setWritingAIResult] = useState<any | null>(null);
  const [writingTimerSec, setWritingTimerSec] = useState<number>(40 * 60);

  // Reading
  const [readingTask, setReadingTask] = useState<ReadingTask | null>(null);
  const [readingAnswers, setReadingAnswers] = useState<string[]>(
    Array(40).fill("")
  );
  const [readingScoreResult, setReadingScoreResult] = useState<any | null>(null);
  const [readingTimerSec, setReadingTimerSec] = useState<number>(60 * 60);

  // Results tab
  const [myResultsOpen, setMyResultsOpen] = useState(false);
  const [myResults, setMyResults] = useState<MessageResult[]>([]);

  // Timers
  const writingIntervalRef = useRef<number | null>(null);
  const readingIntervalRef = useRef<number | null>(null);

  /** Format time mm:ss */
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s2 = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s2}`;
  }

  /** Load tasks when mode/difficulty changes */
  useEffect(() => {
    if (mode === "writing") {
      loadWritingTask(writingDifficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, writingDifficulty]);

  useEffect(() => {
    if (mode === "reading") {
      loadReadingTask(readingDifficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, readingDifficulty]);

  /** Manage writing timer */
  useEffect(() => {
    // clear previous
    if (writingIntervalRef.current) {
      window.clearInterval(writingIntervalRef.current);
      writingIntervalRef.current = null;
    }
    if (mode !== "writing") return;

    writingIntervalRef.current = window.setInterval(() => {
      setWritingTimerSec((t) => {
        if (t <= 1) {
          if (writingIntervalRef.current) {
            window.clearInterval(writingIntervalRef.current);
            writingIntervalRef.current = null;
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (writingIntervalRef.current) {
        window.clearInterval(writingIntervalRef.current);
        writingIntervalRef.current = null;
      }
    };
  }, [mode, writingTask]);

  /** Manage reading timer */
  useEffect(() => {
    if (readingIntervalRef.current) {
      window.clearInterval(readingIntervalRef.current);
      readingIntervalRef.current = null;
    }
    if (mode !== "reading") return;

    readingIntervalRef.current = window.setInterval(() => {
      setReadingTimerSec((t) => {
        if (t <= 1) {
          if (readingIntervalRef.current) {
            window.clearInterval(readingIntervalRef.current);
            readingIntervalRef.current = null;
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (readingIntervalRef.current) {
        window.clearInterval(readingIntervalRef.current);
        readingIntervalRef.current = null;
      }
    };
  }, [mode, readingTask]);

  async function loadWritingTask(diff: "easy" | "medium" | "hard") {
    try {
      setLoading(true);
      const data = mockWritingTask(diff);
      setWritingTask(data);
      setEssay("");
      setWritingScore(null);
      setWritingAIResult(null);
      setWritingTimerSec(40 * 60);
    } catch (e) {
      console.error("loadWritingTask error", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadReadingTask(diff: "easy" | "medium" | "hard") {
    try {
      setLoading(true);
      const data = mockReadingTask(diff);
      setReadingTask(data);
      setReadingAnswers(Array(40).fill(""));
      setReadingScoreResult(null);
      setReadingTimerSec(60 * 60);
    } catch (e) {
      console.error("loadReadingTask error", e);
    } finally {
      setLoading(false);
    }
  }

  /** Writing actions (mocked) */
  async function onScoreWriting() {
    if (!essay.trim()) return;
    try {
      setLoading(true);
      const res = mockScoreWriting(essay);
      setWritingScore(res);
      // stop writing timer
      if (writingIntervalRef.current) {
        window.clearInterval(writingIntervalRef.current);
        writingIntervalRef.current = null;
      }
    } catch (e) {
      console.error("onScoreWriting error", e);
    } finally {
      setLoading(false);
    }
  }

  async function onAICheckWriting() {
    if (!essay.trim() || !writingTask) return;
    try {
      setLoading(true);
      
      // Use real OpenAI Assistant API
      const res = await checkIELTSEssay(essay, writingTask.type, writingTask.prompt);
      setWritingAIResult(res);
      // do not stop timer
    } catch (e) {
      console.error("onAICheckWriting error", e);
      // Fallback to mock if API fails
      const fallbackRes = mockAICheckWriting(essay);
      setWritingAIResult({
        ...fallbackRes,
        error: true,
        errorMessage: e instanceof Error ? e.message : "Failed to check with AI",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSaveWriting() {
    try {
      setLoading(true);
      const band =
        writingAIResult && !writingAIResult.error
          ? writingAIResult.band
          : writingScore?.overall ?? null;
      const payload = {
        difficulty: writingDifficulty,
        task: writingTask,
        essay,
        writingScore,
        writingAIResult,
      };
      const item: MessageResult = {
        id: Date.now(),
        type: "writing",
        createdAt: new Date().toISOString(),
        band: band ?? null,
        payload,
      };
      const next = lsSaveResult(item);
      if (myResultsOpen) {
        setMyResults(next);
      }
      alert("Сохранено (локально)");
    } catch (e) {
      console.error("onSaveWriting error", e);
      alert("Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  }

  /** Reading actions (mocked) */
  async function onScoreReading() {
    try {
      setLoading(true);
      const res = mockScoreReading(readingAnswers, readingTask?.correct);
      setReadingScoreResult(res);
      if (readingIntervalRef.current) {
        window.clearInterval(readingIntervalRef.current);
        readingIntervalRef.current = null;
      }
    } catch (e) {
      console.error("onScoreReading error", e);
    } finally {
      setLoading(false);
    }
  }

  async function onSaveReading() {
    try {
      setLoading(true);
      const band = readingScoreResult?.band ?? null;
      const payload = {
        difficulty: readingDifficulty,
        task: { passage: readingTask?.passage, questions: readingTask?.questions },
        answers: readingAnswers,
        result: readingScoreResult,
      };
      const item: MessageResult = {
        id: Date.now(),
        type: "reading",
        createdAt: new Date().toISOString(),
        band: band ?? null,
        payload,
      };
      const next = lsSaveResult(item);
      if (myResultsOpen) {
        setMyResults(next);
      }
      alert("Сохранено (локально)");
    } catch (e) {
      console.error("onSaveReading error", e);
      alert("Не удалось сохранить");
    } finally {
      setLoading(false);
    }
  }

  /** Results list toggle/load */
  async function onToggleMyResults() {
    const next = !myResultsOpen;
    setMyResultsOpen(next);
    if (next) {
      setLoading(true);
      try {
        const data = lsLoadResults();
        setMyResults(data);
      } catch (e) {
        console.error("load results error", e);
      } finally {
        setLoading(false);
      }
    }
  }

  const writingSeries = useMemo(() => {
    return (myResults || [])
      .filter((r) => r.type === "writing" && typeof r.band !== "undefined" && r.band !== null)
      .map((r) => ({
        date: new Date(r.createdAt).toLocaleDateString(),
        band: Number(r.band),
      }))
      .reverse();
  }, [myResults]);

  const readingSeries = useMemo(() => {
    return (myResults || [])
      .filter((r) => r.type === "reading" && typeof r.band !== "undefined" && r.band !== null)
      .map((r) => ({
        date: new Date(r.createdAt).toLocaleDateString(),
        band: Number(r.band),
      }))
      .reverse();
  }, [myResults]);

  return (
    <div className={s.container}>
      <h1 className={s.title}>IELTS Simulation (Front-only)</h1>

      <div className={s.switcher}>
        <button
          onClick={() => setMode("writing")}
          className={`${s.button} ${mode === "writing" ? s.buttonActive : s.buttonInactive}`}
        >
          Writing
        </button>
        <button
          onClick={() => setMode("reading")}
          className={`${s.button} ${mode === "reading" ? s.buttonActive : s.buttonInactive}`}
        >
          Reading
        </button>
        <button
          onClick={onToggleMyResults}
          className={`${s.button} ${myResultsOpen ? s.buttonActive : s.buttonInactive}`}
          style={{ marginLeft: 12 }}
        >
          Мои результаты
        </button>
      </div>

      {/* Difficulty selector & timer */}
      <div className={s.card} style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className={s.title} style={{ fontSize: 16, margin: 0 }}>
            Сложность:
          </div>
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              className={`${s.button} ${
                (mode === "writing" ? writingDifficulty : readingDifficulty) === d
                  ? s.buttonActive
                  : s.buttonInactive
              }`}
              onClick={() =>
                mode === "writing"
                  ? setWritingDifficulty(d)
                  : setReadingDifficulty(d)
              }
            >
              {d}
            </button>
          ))}
          <div style={{ marginLeft: "auto", fontWeight: 600 }}>
            {mode === "writing" ? (
              <span>⏱️ 40:00 → {formatTime(writingTimerSec)}</span>
            ) : (
              <span>⏱️ 60:00 → {formatTime(readingTimerSec)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Writing */}
      {mode === "writing" && (
        <div className={s.card} style={{ marginTop: 12 }}>
          <h2 className={s.title} style={{ marginBottom: 8 }}>
            Задание Writing
          </h2>

          <div className={s.card} style={{ background: "#fafafa" }}>
            <div className={s.tableCell} style={{ whiteSpace: "pre-wrap" }}>
              {writingTask ? (
                <>
                  <div>
                    <b>Type:</b> {writingTask.type?.toUpperCase?.()}
                  </div>
                  <div style={{ marginTop: 6 }}>{writingTask.prompt}</div>
                </>
              ) : (
                <div>Загрузка задания...</div>
              )}
            </div>
          </div>

          <textarea
            className={s.textarea}
            rows={10}
            placeholder="Write your essay here..."
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
          />

          <div className={s.actionsRow} style={{ display: "flex", gap: 8 }}>
            <button onClick={onScoreWriting} className={`${s.button} ${s.buttonActive}`}>
              {loading ? "Checking..." : "Проверить"}
            </button>
            <button onClick={onAICheckWriting} className={`${s.button} ${s.buttonInactive}`}>
              {loading ? "Checking..." : "Check with AI"}
            </button>
            <button onClick={onSaveWriting} className={`${s.button} ${s.buttonInactive}`}>
              {loading ? "Saving..." : "Сохранить"}
            </button>
          </div>

          {(writingScore || writingAIResult) && (
            <div className={s.resultCard}>
              {writingScore && (
                <>
                  <h3 className={s.title}>Writing Score</h3>
                  <div className={`${s.tableCell} ${s.scoreHigh}`}>
                    Overall: {writingScore.overall} (words: {writingScore.words})
                  </div>
                </>
              )}
              {writingAIResult && !writingAIResult.error && (
                <>
                  <h3 className={s.title}>AI Writing Assessment</h3>
                  <div className={s.title} style={{ fontSize: "20px", marginBottom: 8 }}>
                    Band: <span className={s.scoreHigh}>{writingAIResult.band}</span>
                  </div>
                  <ul className={s.table} style={{ listStyle: "disc", paddingLeft: 20 }}>
                    <li className={s.tableCell}>
                      <b>Task Achievement:</b> {writingAIResult.feedback?.taskAchievement}
                    </li>
                    <li className={s.tableCell}>
                      <b>Coherence:</b> {writingAIResult.feedback?.coherence}
                    </li>
                    <li className={s.tableCell}>
                      <b>Lexical Resource:</b> {writingAIResult.feedback?.lexicalResource}
                    </li>
                    <li className={s.tableCell}>
                      <b>Grammar:</b> {writingAIResult.feedback?.grammar}
                    </li>
                  </ul>
                </>
              )}
              {writingAIResult?.error && <div className={s.scoreLow}>AI ошибка</div>}
            </div>
          )}
        </div>
      )}

      {/* Reading */}
      {mode === "reading" && (
        <div className={s.card} style={{ marginTop: 12 }}>
          <h2 className={s.title} style={{ marginBottom: 8 }}>
            Задание Reading
          </h2>

          <div className={s.card} style={{ background: "#fafafa" }}>
            <div className={s.tableCell} style={{ whiteSpace: "pre-wrap" }}>
              {readingTask ? readingTask.passage : "Загрузка задания..."}
            </div>
          </div>

          <div className={s.inputGrid}>
            {Array.from({ length: 40 }).map((_, i) => (
              <input
                key={i}
                className={s.input}
                placeholder={String(i + 1)}
                value={readingAnswers[i] || ""}
                onChange={(e) => {
                  const copy = [...readingAnswers];
                  copy[i] = e.target.value;
                  setReadingAnswers(copy);
                }}
                maxLength={3}
              />
            ))}
          </div>

          <div className={s.actionsRow} style={{ display: "flex", gap: 8 }}>
            <button onClick={onScoreReading} className={`${s.button} ${s.buttonActive}`}>
              {loading ? "Checking..." : "Проверить"}
            </button>
            <button onClick={onSaveReading} className={`${s.button} ${s.buttonInactive}`}>
              {loading ? "Saving..." : "Сохранить"}
            </button>
          </div>

          {readingScoreResult && (
            <div className={s.resultCard}>
              <h3 className={s.title}>Reading Result</h3>
              <p>
                Correct: <span className={s.scoreHigh}>{readingScoreResult.correct}</span> /{" "}
                {readingScoreResult.total}
              </p>
              <p>
                Band: <span className={s.scoreHigh}>{readingScoreResult.band}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {myResultsOpen && (
        <div className={s.card} style={{ marginTop: 12 }}>
          <h2 className={s.title}>Мои результаты</h2>

          {(!myResults || myResults.length === 0) && <div className={s.tableCell}>Пока пусто</div>}

          {myResults && myResults.length > 0 && (
            <>
              <table className={s.table} style={{ marginBottom: 16 }}>
                <thead>
                  <tr className={s.tableRow}>
                    <th className={s.tableCell}>Тип</th>
                    <th className={s.tableCell}>Band</th>
                    <th className={s.tableCell}>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {myResults.map((r) => (
                    <tr key={r.id} className={s.tableRow}>
                      <td className={s.tableCell}>{r.type}</td>
                      <td className={s.tableCell}>{r.band ?? "-"}</td>
                      <td className={s.tableCell}>{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={s.card} style={{ height: 300 }}>
                <h3 className={s.title}>Прогресс — Writing</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={writingSeries}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 9]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="band" stroke="#2563eb" name="Band" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className={s.card} style={{ height: 300, marginTop: 12 }}>
                <h3 className={s.title}>Прогресс — Reading</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={readingSeries}>
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 9]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="band" stroke="#16a34a" name="Band" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
