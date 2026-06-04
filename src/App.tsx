import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Eye,
  EyeOff,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trophy,
  Users,
  X,
} from "lucide-react";
import defaultRules from "./data/rules.json";
import defaultTasks from "./data/tasks.json";
import defaultTeams from "./data/teams.json";
import type { Rule, RuntimeTeam, Task, Team, View } from "./types";

const SESSION_KEY = "drunk-taskmaster-session";

type SavedSession = {
  teams: RuntimeTeam[];
  completedTaskIds: string[];
  dictionaryLetters?: string | Record<string, string>;
};

const rules = defaultRules as Rule[];
const tasks = defaultTasks as Task[];

function createRuntimeTeams(teams: Team[]): RuntimeTeam[] {
  return teams.map((team) => ({
    ...team,
    score: team.startingScore ?? 0,
  }));
}

function loadSession(): SavedSession | null {
  try {
    const rawSession = localStorage.getItem(SESSION_KEY);
    return rawSession ? (JSON.parse(rawSession) as SavedSession) : null;
  } catch {
    return null;
  }
}

function normalizeDictionaryLetters(value: SavedSession["dictionaryLetters"]) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return Object.values(value).join("");
}

function makeTeamId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `team-${Date.now()}`;
}

function App() {
  const savedSession = useMemo(loadSession, []);
  const [view, setView] = useState<View>("home");
  const [teams, setTeams] = useState<RuntimeTeam[]>(savedSession?.teams ?? createRuntimeTeams(defaultTeams));
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(savedSession?.completedTaskIds ?? []);
  const [dictionaryLetters, setDictionaryLetters] = useState<string>(normalizeDictionaryLetters(savedSession?.dictionaryLetters));
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [scoreDrawerOpen, setScoreDrawerOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(Boolean(savedSession));

  useEffect(() => {
    if (!sessionStarted) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ teams, completedTaskIds, dictionaryLetters }));
  }, [completedTaskIds, dictionaryLetters, sessionStarted, teams]);

  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;
  const hasSavedGame = sessionStarted;

  function beginNewGame() {
    setSessionStarted(true);
    setTeams(createRuntimeTeams(defaultTeams));
    setCompletedTaskIds([]);
    setDictionaryLetters("");
    setActiveTaskId(null);
    setScoreDrawerOpen(false);
    setView("setup");
  }

  function resumeGame() {
    setSessionStarted(true);
    setActiveTaskId(null);
    setView("board");
  }

  function openTask(taskId: string) {
    setActiveTaskId(taskId);
    setScoreDrawerOpen(false);
    setView("task");
  }

  function completeTask(points: Record<string, number>) {
    if (!activeTask) return;
    setTeams((currentTeams) =>
      currentTeams.map((team) => ({
        ...team,
        score: team.score + (points[team.id] ?? 0),
      })),
    );
    setCompletedTaskIds((currentIds) => Array.from(new Set([...currentIds, activeTask.id])));
    setActiveTaskId(null);
    setScoreDrawerOpen(true);
    setView("board");
  }

  return (
    <div className="app-shell">
      <div className="stage-glow" />
      {view === "home" && (
        <HomeScreen onNewGame={beginNewGame} onRules={() => setView("rules")} onResume={hasSavedGame ? resumeGame : undefined} />
      )}

      {view === "rules" && <RulesScreen onBack={() => setView("home")} />}

      {view === "setup" && (
        <TeamSetup
          teams={teams}
          onTeamsChange={setTeams}
          onBack={() => setView("home")}
          onStart={() => {
            setScoreDrawerOpen(true);
            setView("board");
          }}
        />
      )}

      {view === "board" && (
        <div className={`game-layout ${scoreDrawerOpen ? "scores-open" : ""} ${timerOpen ? "timer-open" : ""}`}>
          <GameBoard
            completedTaskIds={completedTaskIds}
            onBack={() => setView("home")}
            onOpenTask={openTask}
            timerSlot={<TimerDock isOpen={timerOpen} onToggle={() => setTimerOpen((isOpen) => !isOpen)} />}
          />
          <ScoreDrawer teams={teams} isOpen={scoreDrawerOpen} onToggle={() => setScoreDrawerOpen((isOpen) => !isOpen)} />
        </div>
      )}

      {view === "task" && activeTask && (
        <div className={`game-layout ${scoreDrawerOpen ? "scores-open" : ""} ${timerOpen ? "timer-open" : ""}`}>
          <TaskReveal
            task={activeTask}
            isComplete={completedTaskIds.includes(activeTask.id)}
            onBack={() => setView("board")}
            onComplete={completeTask}
            teams={teams}
            dictionaryLetters={dictionaryLetters}
            onDictionaryLettersChange={setDictionaryLetters}
            timerSlot={<TimerDock isOpen={timerOpen} onToggle={() => setTimerOpen((isOpen) => !isOpen)} />}
          />
          <ScoreDrawer teams={teams} isOpen={scoreDrawerOpen} onToggle={() => setScoreDrawerOpen((isOpen) => !isOpen)} />
        </div>
      )}
    </div>
  );
}

function HomeScreen({
  onNewGame,
  onRules,
  onResume,
}: {
  onNewGame: () => void;
  onRules: () => void;
  onResume?: () => void;
}) {
  return (
    <main className="screen home-screen">
      <section className="home-lockup">
        <h1>Drunk TaskMaster</h1>
      </section>

      <nav className="home-actions" aria-label="Main menu">
        <button className="primary-command" onClick={onNewGame}>
          <Play aria-hidden="true" />
          New Game
        </button>
        {onResume && (
          <button className="secondary-command" onClick={onResume}>
            <Trophy aria-hidden="true" />
            Resume Game
          </button>
        )}
        <button className="secondary-command" onClick={onRules}>
          <BookOpen aria-hidden="true" />
          Rules
        </button>
      </nav>
    </main>
  );
}

function RulesScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="screen">
      <TopBar title="House Rules" onBack={onBack} />
      <section className="rules-grid" aria-label="Rules">
        {rules.map((rule, index) => (
          <article className="rule-tile" key={rule.id}>
            <span className="rule-number">{String(index + 1).padStart(2, "0")}</span>
            <h2>{rule.title}</h2>
            <p>{rule.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function TeamSetup({
  teams,
  onTeamsChange,
  onBack,
  onStart,
}: {
  teams: RuntimeTeam[];
  onTeamsChange: (teams: RuntimeTeam[]) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  function updateTeam(teamId: string, patch: Partial<RuntimeTeam>) {
    onTeamsChange(teams.map((team) => (team.id === teamId ? { ...team, ...patch } : team)));
  }

  function moveTeam(teamId: string, direction: -1 | 1) {
    const index = teams.findIndex((team) => team.id === teamId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= teams.length) return;
    const nextTeams = [...teams];
    const [team] = nextTeams.splice(index, 1);
    nextTeams.splice(nextIndex, 0, team);
    onTeamsChange(nextTeams);
  }

  function addTeam() {
    const name = `Team ${teams.length + 1}`;
    onTeamsChange([
      ...teams,
      {
        id: makeTeamId(`${name}-${Date.now()}`),
        name,
        startingScore: 0,
        score: 0,
      },
    ]);
  }

  const canStart = teams.length > 0 && teams.every((team) => team.name.trim());

  return (
    <main className="screen setup-screen">
      <TopBar title="Set The Teams" onBack={onBack} />
      <div className="setup-actions">
        <button className="icon-text-button" onClick={() => onTeamsChange(createRuntimeTeams(defaultTeams))}>
          <RotateCcw aria-hidden="true" />
          Reset Presets
        </button>
        <button className="icon-text-button" onClick={addTeam}>
          <Plus aria-hidden="true" />
          Add Team
        </button>
      </div>

      <section className="team-editor-grid" aria-label="Team editor">
        {teams.map((team, index) => (
          <article className="team-editor" key={team.id}>
            <div className="team-editor-header">
              <Users aria-hidden="true" />
              <input
                aria-label="Team name"
                value={team.name}
                onChange={(event) => updateTeam(team.id, { name: event.target.value })}
              />
              <div className="team-editor-controls">
                <button className="icon-button" title="Move team left" onClick={() => moveTeam(team.id, -1)} disabled={index === 0}>
                  <ArrowLeft aria-hidden="true" />
                </button>
                <button
                  className="icon-button"
                  title="Move team right"
                  onClick={() => moveTeam(team.id, 1)}
                  disabled={index === teams.length - 1}
                >
                  <ArrowRight aria-hidden="true" />
                </button>
                <button
                  className="icon-button danger"
                  title="Remove team"
                  onClick={() => onTeamsChange(teams.filter((candidate) => candidate.id !== team.id))}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <footer className="setup-footer">
        <p>{teams.length} teams loaded</p>
        <button className="primary-command" onClick={onStart} disabled={!canStart}>
          <Crown aria-hidden="true" />
          Start The Game
        </button>
      </footer>
    </main>
  );
}

function GameBoard({
  completedTaskIds,
  onBack,
  onOpenTask,
  timerSlot,
}: {
  completedTaskIds: string[];
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
  timerSlot: ReactNode;
}) {
  return (
    <main className="screen board-screen">
      <TopBar title="Drunk TaskMaster" onBack={onBack} rightSlot={timerSlot} />
      <section className="task-grid" aria-label="Task board">
        {tasks.map((task) => {
          const isComplete = completedTaskIds.includes(task.id);
          return (
            <button
              className={`task-card ${isComplete ? "complete" : ""}`}
              key={task.id}
              onClick={() => onOpenTask(task.id)}
            >
              <span className="task-title">{task.title}</span>
            </button>
          );
        })}
      </section>
    </main>
  );
}

function TaskReveal({
  task,
  teams,
  isComplete,
  onBack,
  onComplete,
  dictionaryLetters,
  onDictionaryLettersChange,
  timerSlot,
}: {
  task: Task;
  teams: RuntimeTeam[];
  isComplete: boolean;
  onBack: () => void;
  onComplete: (points: Record<string, number>) => void;
  dictionaryLetters: string;
  onDictionaryLettersChange: (letters: string) => void;
  timerSlot: ReactNode;
}) {
  const [partIndex, setPartIndex] = useState(0);
  const [points, setPoints] = useState<Record<string, number>>({});
  const [pointText, setPointText] = useState<Record<string, string>>({});
  const dictionaryInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setPartIndex(0);
    setPoints({});
    setPointText({});
  }, [task.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onBack();
        return;
      }

      if (task.parts.length <= 1) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPartIndex((index) => Math.max(0, index - 1));
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPartIndex((index) => Math.min(task.parts.length - 1, index + 1));
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onBack, task.parts.length]);

  function adjustPoints(teamId: string, delta: number) {
    const nextValue = (points[teamId] ?? 0) + delta;
    setPoints((currentPoints) => ({
      ...currentPoints,
      [teamId]: nextValue,
    }));
    setPointText((currentText) => ({
      ...currentText,
      [teamId]: String(nextValue),
    }));
  }

  function editPoints(teamId: string, value: string) {
    if (!/^-?\d*$/.test(value)) return;
    setPointText((currentText) => ({
      ...currentText,
      [teamId]: value,
    }));

    if (value === "" || value === "-") return;
    setPoints((currentPoints) => ({
      ...currentPoints,
      [teamId]: Number(value),
    }));
  }

  function commitPoints(teamId: string) {
    const value = pointText[teamId];
    const nextValue = value === "" || value === "-" || value == null ? points[teamId] ?? 0 : Number(value);
    setPoints((currentPoints) => ({
      ...currentPoints,
      [teamId]: nextValue,
    }));
    setPointText((currentText) => ({
      ...currentText,
      [teamId]: String(nextValue),
    }));
  }

  function getDictionaryLetter(index: number) {
    const letter = dictionaryLetters[index] ?? "";
    return /^[A-Z]$/.test(letter) ? letter : "";
  }

  function setDictionaryLetter(index: number, value: string) {
    const letters = Array.from({ length: dictionaryLetterCount }, (_, letterIndex) => getDictionaryLetter(letterIndex) || " ");
    const nextLetter = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    letters[index] = nextLetter || " ";
    onDictionaryLettersChange(letters.join("").trimEnd());

    if (nextLetter && index < dictionaryLetterCount - 1) {
      dictionaryInputRefs.current[index + 1]?.focus();
    }
  }

  function handleDictionaryKeyDown(index: number, event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !getDictionaryLetter(index) && index > 0) {
      event.preventDefault();
      dictionaryInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      dictionaryInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < dictionaryLetterCount - 1) {
      event.preventDefault();
      dictionaryInputRefs.current[index + 1]?.focus();
    }
  }

  function pasteDictionaryLetters(index: number, value: string) {
    const pastedLetters = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, dictionaryLetterCount - index);
    if (!pastedLetters) return;

    const letters = Array.from({ length: dictionaryLetterCount }, (_, letterIndex) => getDictionaryLetter(letterIndex) || " ");
    pastedLetters.split("").forEach((letter, offset) => {
      letters[index + offset] = letter;
    });
    onDictionaryLettersChange(letters.join("").trimEnd());
    dictionaryInputRefs.current[Math.min(index + pastedLetters.length, dictionaryLetterCount - 1)]?.focus();
  }

  const currentPart = task.parts[partIndex];
  const copyDensity = currentPart.length > 220 ? "dense" : currentPart.length > 150 ? "compact" : "";
  const taskCopyClassName = ["task-copy", copyDensity].filter(Boolean).join(" ");
  const showDictionaryWidget = task.id === "dictionary";
  const taskRevealClassName = ["task-reveal", copyDensity ? `${copyDensity}-copy` : "", showDictionaryWidget ? "with-widget" : ""]
    .filter(Boolean)
    .join(" ");
  const dictionaryLetterCount = teams.length * 2;

  return (
    <main className="screen task-reveal-screen">
      <TopBar title={task.title} onBack={onBack} rightSlot={timerSlot} />

      <section className={taskRevealClassName}>
        <img className="wax-seal" src="/DTM_Seal_transparent.png" alt="Drunk TaskMaster seal" />
        <div className={taskCopyClassName}>
          <p>{currentPart}</p>
        </div>

        {task.parts.length > 1 && (
          <div className="part-controls" aria-label="Task parts">
            <button
              className="part-nav-button previous"
              onClick={() => setPartIndex((index) => Math.max(0, index - 1))}
              disabled={partIndex === 0}
              title="Previous part"
              aria-label="Previous part"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              className="part-nav-button next"
              onClick={() => setPartIndex((index) => Math.min(task.parts.length - 1, index + 1))}
              disabled={partIndex === task.parts.length - 1}
              title="Next part"
              aria-label="Next part"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </section>

      {showDictionaryWidget && (
        <section className="task-widget dictionary-widget" aria-label="Dictionary letters">
          <div className="dictionary-otp" aria-label={`${dictionaryLetterCount} shared dictionary letters`}>
            {Array.from({ length: dictionaryLetterCount }).map((_, index) => (
              <label className="dictionary-letter-box" key={index}>
                <span>Letter {index + 1}</span>
                <input
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={getDictionaryLetter(index)}
                  ref={(input) => {
                    dictionaryInputRefs.current[index] = input;
                  }}
                  onChange={(event) => setDictionaryLetter(index, event.target.value)}
                  onKeyDown={(event) => handleDictionaryKeyDown(index, event)}
                  onPaste={(event) => {
                    event.preventDefault();
                    pasteDictionaryLetters(index, event.clipboardData.getData("text"));
                  }}
                  aria-label={`Dictionary letter ${index + 1}`}
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="scoring-panel" aria-label="Award points">
        <div className="award-grid">
          {teams.map((team) => (
            <div className="award-row" key={team.id}>
              <strong>{team.name}</strong>
              <div className="stepper" aria-label={`${team.name} task points`}>
                <button className="icon-button" onClick={() => adjustPoints(team.id, -1)}>
                  <Minus aria-hidden="true" />
                </button>
                <input
                  type="number"
                  value={pointText[team.id] ?? String(points[team.id] ?? 0)}
                  onBlur={() => commitPoints(team.id)}
                  onChange={(event) => editPoints(team.id, event.target.value)}
                  aria-label={`${team.name} points`}
                />
                <button className="icon-button" onClick={() => adjustPoints(team.id, 1)}>
                  <Plus aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          className="primary-command score-close-button"
          onClick={() => onComplete(points)}
          title={isComplete ? "Update score and close" : "Score and close task"}
          aria-label={isComplete ? "Update score and close" : "Score and close task"}
        >
          <Check aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}

function ScoreDrawer({
  teams,
  isOpen,
  onToggle,
}: {
  teams: RuntimeTeam[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const sortedTeams = [...teams].sort((a, b) => a.score - b.score);
  const rankByTeamId = new Map<string, number>();
  let previousScore: number | null = null;
  let previousRank = 0;

  [...sortedTeams].reverse().forEach((team, index) => {
    const rank = previousScore === team.score ? previousRank : index + 1;
    rankByTeamId.set(team.id, rank);
    previousScore = team.score;
    previousRank = rank;
  });

  return (
    <aside className={`score-drawer ${isOpen ? "open" : ""}`}>
      <button className="drawer-tab" onClick={onToggle}>
        {isOpen ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        {isOpen ? "Hide Scores" : "Show Scores"}
      </button>
      <div className="score-track">
        {sortedTeams.map((team) => (
          <article className="score-team" key={team.id}>
            <span className="rank-label">#{rankByTeamId.get(team.id)}</span>
            <strong>{team.name}</strong>
            <output>{team.score}</output>
          </article>
        ))}
      </div>
    </aside>
  );
}

function TimerDock({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [mode, setMode] = useState<"countdown" | "stopwatch">("countdown");
  const [minutes, setMinutes] = useState(5);
  const [minuteText, setMinuteText] = useState("5");
  const [seconds, setSeconds] = useState(5 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => {
      setSeconds((currentSeconds) => {
        if (mode === "stopwatch") return currentSeconds + 1;
        if (currentSeconds <= 1) {
          setRunning(false);
          return 0;
        }
        return currentSeconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mode, running]);

  function resetTimer() {
    setRunning(false);
    setSeconds(mode === "countdown" ? Math.max(1, minutes) * 60 : 0);
  }

  function changeMode(nextMode: "countdown" | "stopwatch") {
    setMode(nextMode);
    setRunning(false);
    setSeconds(nextMode === "countdown" ? Math.max(1, minutes) * 60 : 0);
  }

  function changeMinutes(value: number) {
    const nextMinutes = Math.min(99, Math.max(0.1, value));
    setMinutes(nextMinutes);
    setMinuteText(String(Number(nextMinutes.toFixed(2))));
    if (mode === "countdown" && !running) {
      setSeconds(Math.round(nextMinutes * 60));
    }
  }

  function editMinutes(value: string) {
    if (!/^\d{0,2}(\.\d{0,2})?$/.test(value)) return;
    setMinuteText(value);

    const nextMinutes = Number(value);
    if (!value || value === "." || nextMinutes < 0.1) return;
    setMinutes(nextMinutes);
    if (mode === "countdown" && !running) {
      setSeconds(Math.round(nextMinutes * 60));
    }
  }

  function commitMinutes() {
    changeMinutes(Number(minuteText) || minutes);
  }

  const displayMinutes = Math.floor(seconds / 60);
  const displaySeconds = seconds % 60;

  return (
    <div className={`timer-dock ${isOpen ? "open" : ""}`}>
      <button className="timer-toggle" onClick={onToggle} title="Timer">
        <Clock3 aria-hidden="true" />
      </button>

      {isOpen && (
        <section className="timer-panel" aria-label="Timer">
          <div className="segmented-control">
            <button className={mode === "countdown" ? "active" : ""} onClick={() => changeMode("countdown")}>
              Timer
            </button>
            <button className={mode === "stopwatch" ? "active" : ""} onClick={() => changeMode("stopwatch")}>
              Stopwatch
            </button>
          </div>

          <output className="timer-display">
            {String(displayMinutes).padStart(2, "0")}:{String(displaySeconds).padStart(2, "0")}
          </output>

          <div className="timer-side">
            {mode === "countdown" && (
              <label className="minute-control">
                <span>Min</span>
                <input
                  type="number"
                  min="0.1"
                  max="99"
                  step="0.1"
                  value={minuteText}
                  onBlur={commitMinutes}
                  onChange={(event) => editMinutes(event.target.value)}
                />
              </label>
            )}

            <div className="timer-actions">
              <button className="icon-button" title={running ? "Pause" : "Start"} onClick={() => setRunning((isRunning) => !isRunning)}>
                {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
              <button className="icon-button" title="Reset" onClick={resetTimer}>
                <RotateCcw aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function TopBar({ title, onBack, rightSlot }: { title: string; onBack: () => void; rightSlot?: ReactNode }) {
  return (
    <header className="top-bar">
      <button className="icon-button nav-back-button" onClick={onBack} title="Back" aria-label="Back">
        <ArrowLeft aria-hidden="true" />
      </button>
      <h1>{title}</h1>
      <div className="top-bar-slot">{rightSlot}</div>
    </header>
  );
}

export default App;
