// Development-only manual QA harness. Not an application route or production entry.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ActivityRenderer } from "../src/components/ActivityRenderer";
import { initialAnswer } from "../src/components/ExerciseFields";
import { questions, id } from "../src/data/catalog";
import type { ExerciseAnswer } from "../src/lib/types";
import "@fontsource-variable/lexend";
import "../src/styles/tokens.css";
import "../src/styles/global.css";
function Fixture({ questionId }: { questionId: number }) {
  const q = questions.find((q) => q.id === id(questionId))!;
  const [answer, setAnswer] = useState<ExerciseAnswer>(initialAnswer(q));
  return (
    <section className="card stack">
      <h2>{q.title}</h2>
      <p>{q.prompt}</p>
      <ActivityRenderer
        q={q}
        value={answer}
        onChange={setAnswer}
        disabled={false}
      />
    </section>
  );
}
function QA() {
  const [q, setQ] = useState(12005);
  return (
    <main
      className="stack"
      style={{ maxWidth: 720, margin: "24px auto", padding: 16 }}
    >
      <h1>Verificação de atividades</h1>
      <p>Ambiente local de teste · sem conta ou XP real.</p>
      <label>
        Atividade
        <select value={q} onChange={(e) => setQ(Number(e.target.value))}>
          <option value={12005}>JavaScript</option>
          <option value={12006}>HTML/CSS/JS</option>
          <option value={12007}>UI/UX Design</option>
        </select>
      </label>
      <Fixture key={q} questionId={q} />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<QA />);
