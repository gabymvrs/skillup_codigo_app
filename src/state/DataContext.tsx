import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  emptyDataset,
  type Dataset,
  type TableMap,
  type TableName,
} from "../lib/types";
import { useAuth } from "./AuthContext";
import {
  deleteRow,
  insertRow,
  loadData,
  readDemo,
  updateRow,
  writeDemo,
} from "../services/repository";
import { requireSupabase } from "../services/supabase";
import { awardDemo, evaluateDemo, localTimezone } from "../services/learning";
import type { ExerciseAnswer } from "../lib/types";
import { uid } from "../lib/utils";
import {
  pendingProgress,
  queueProgress,
  removePending,
} from "../services/offline";
interface DataValue {
  data: Dataset;
  loading: boolean;
  error: string;
  syncError: string;
  reload: () => Promise<void>;
  add: <K extends TableName>(table: K, row: TableMap[K]) => Promise<void>;
  update: <K extends Exclude<TableName, "user_roles">>(
    table: K,
    id: string,
    patch: Partial<TableMap[K]>,
  ) => Promise<void>;
  remove: (
    table: Exclude<TableName, "user_roles">,
    id: string,
  ) => Promise<void>;
  completeModule: (id: string) => Promise<"saved" | "queued">;
  answer: (
    id: string,
    index: ExerciseAnswer,
  ) => Promise<{ correct: boolean; xp: number; explanation: string }>;
  startTrack: (id: string) => Promise<void>;
  recordRead: (id: string, completed?: boolean) => Promise<void>;
  grade: (id: string, grade: number, feedback: string) => Promise<void>;
}
const DataContext = createContext<DataValue | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth(),
    [data, setData] = useState(emptyDataset),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [syncError, setSyncError] = useState("");
  const epoch = useRef(0);
  const reload = useCallback(async () => {
    if (!auth.id || !auth.role) return;
    const current = ++epoch.current;
    try {
      const next = await loadData(auth.demo);
      if (current === epoch.current) {
        setData(next);
        setError("");
      }
    } catch (e) {
      if (current === epoch.current)
        setError(
          e instanceof Error
            ? e.message
            : String(
                (e as { message?: string })?.message ||
                  "Não foi possível carregar os dados.",
              ),
        );
      throw e;
    } finally {
      if (current === epoch.current) setLoading(false);
    }
  }, [auth.id, auth.demo, auth.role]);
  useEffect(() => {
    setData(emptyDataset());
    setLoading(true);
    reload().catch(() => {});
    return () => {
      epoch.current++;
    };
  }, [reload]);
  useEffect(() => {
    if (!auth.id || auth.demo) return;
    let syncing = false,
      active = true;
    async function sync() {
      if (syncing || !navigator.onLine) return;
      syncing = true;
      try {
        const setup = await requireSupabase().rpc(
          "configure_learning_timezone",
          { p_timezone: localTimezone() },
        );
        if (setup.error) throw setup.error;
        for (const item of await pendingProgress(auth.id!)) {
          if (!active) return;
          await setupTimezone();
          const { error } = await requireSupabase().rpc("complete_module", {
            p_module_id: item.module_id,
          });
          if (error) throw error;
          await removePending(item.key);
        }
        if (active) {
          setSyncError("");
          await reload();
        }
      } catch {
        if (active)
          setSyncError(
            "Há progresso pendente. A sincronização será tentada ao reconectar.",
          );
      } finally {
        syncing = false;
      }
    }
    void sync();
    window.addEventListener("online", sync);
    return () => {
      active = false;
      window.removeEventListener("online", sync);
    };
  }, [auth.id, auth.demo, reload]);
  async function add<K extends TableName>(table: K, row: TableMap[K]) {
    await insertRow(auth.demo, table, row);
    await reload();
  }
  async function update<K extends Exclude<TableName, "user_roles">>(
    table: K,
    id: string,
    patch: Partial<TableMap[K]>,
  ) {
    await updateRow(auth.demo, table, id, patch);
    await reload();
  }
  async function remove(table: Exclude<TableName, "user_roles">, id: string) {
    await deleteRow(auth.demo, table, id);
    await reload();
  }
  async function completeModule(moduleId: string): Promise<"saved" | "queued"> {
    if (!auth.id) throw new Error("Entre na sua conta.");
    if (auth.demo) {
      const d = readDemo(),
        module = d.modules.find((x) => x.id === moduleId);
      if (!module) throw new Error("Módulo não encontrado.");
      if (
        module.prerequisite_id &&
        !d.progress.some(
          (p) =>
            p.user_id === auth.id && p.module_id === module.prerequisite_id,
        )
      )
        throw new Error("Conclua a etapa anterior.");
      if (
        module.question_id &&
        !d.attempts.some(
          (a) =>
            a.user_id === auth.id &&
            a.question_id === module.question_id &&
            a.correct,
        )
      )
        throw new Error("Conclua o exercício desta etapa.");
      if (
        !d.progress.some(
          (p) => p.user_id === auth.id && p.module_id === moduleId,
        )
      ) {
        d.progress.push({
          id: uid(),
          user_id: auth.id,
          module_id: moduleId,
          completed_at: new Date().toISOString(),
        });
        awardDemo(
          d,
          auth.id,
          `module:${module.id}`,
          module.xp,
          `Módulo: ${module.title}`,
        );
        if (
          !d.track_enrollments.some(
            (e) => e.user_id === auth.id && e.track_id === module.track_id,
          )
        )
          d.track_enrollments.push({
            id: uid(),
            user_id: auth.id,
            track_id: module.track_id,
            created_at: new Date().toISOString(),
          });
        writeDemo(d);
      }
      await reload();
      return "saved";
    }
    if (!navigator.onLine) {
      await queueProgress(auth.id, moduleId);
      setSyncError(
        "Conclusão salva na fila. O servidor validará os pré-requisitos ao reconectar.",
      );
      return "queued";
    }
    const { error } = await requireSupabase().rpc("complete_module", {
      p_module_id: moduleId,
    });
    if (error) throw error;
    await reload();
    return "saved";
  }
  async function setupTimezone() {
    const { error } = await requireSupabase().rpc(
      "configure_learning_timezone",
      { p_timezone: localTimezone() },
    );
    if (error) throw error;
  }
  async function answer(questionId: string, response: ExerciseAnswer) {
    if (!auth.id) throw new Error("Entre na sua conta.");
    if (auth.demo) {
      const d = readDemo(),
        q = d.questions.find((q) => q.id === questionId);
      if (!q) throw new Error("Exercício indisponível.");
      const correct = evaluateDemo(q, response);
      const xp = correct
        ? awardDemo(
            d,
            auth.id,
            `question:${q.id}`,
            q.xp,
            `Exercício: ${q.title}`,
          )
        : 0;
      d.attempts.push({
        id: uid(),
        user_id: auth.id,
        question_id: questionId,
        selected_index: typeof response === "number" ? response : -1,
        response,
        correct,
        xp,
        created_at: new Date().toISOString(),
      });
      writeDemo(d);
      await reload();
      return {
        correct,
        xp,
        explanation:
          q.kind === "challenge"
            ? "Conclusão autodeclarada: relato e critérios registrados. Não equivale a uma avaliação docente."
            : q.explanation,
      };
    }
    await setupTimezone();
    const { data, error } = await requireSupabase().rpc("submit_exercise", {
      p_question_id: questionId,
      p_response: response,
    });
    if (error) throw error;
    await reload();
    return data as { correct: boolean; xp: number; explanation: string };
  }
  async function startTrack(trackId: string) {
    if (!auth.id) throw new Error("Entre na sua conta.");
    if (auth.demo) {
      const d = readDemo();
      if (
        !d.track_enrollments.some(
          (e) => e.user_id === auth.id && e.track_id === trackId,
        )
      ) {
        d.track_enrollments.push({
          id: uid(),
          user_id: auth.id,
          track_id: trackId,
          created_at: new Date().toISOString(),
        });
        writeDemo(d);
      }
    } else {
      const { error } = await requireSupabase().rpc("start_track", {
        p_track_id: trackId,
      });
      if (error) throw error;
    }
    await reload();
  }
  async function recordRead(materialId: string, completed = false) {
    if (!auth.id) return;
    if (auth.demo) {
      const d = readDemo(),
        old = d.material_reads.find(
          (r) => r.user_id === auth.id && r.material_id === materialId,
        ),
        now = new Date().toISOString();
      if (old) {
        old.last_opened_at = now;
        if (completed) old.completed_at ||= now;
      } else
        d.material_reads.push({
          id: uid(),
          user_id: auth.id,
          material_id: materialId,
          last_opened_at: now,
          completed_at: completed ? now : null,
        });
      writeDemo(d);
    } else {
      const { error } = await requireSupabase().rpc("record_material_read", {
        p_material_id: materialId,
        p_completed: completed,
      });
      if (error) throw error;
    }
    await reload();
  }
  async function grade(id: string, grade: number, feedback: string) {
    if (auth.demo) {
      const d = readDemo(),
        submission = d.submissions.find((s) => s.id === id);
      if (!submission) throw new Error("Atividade não encontrada.");
      Object.assign(submission, { grade, feedback, status: "reviewed" });
      if (grade >= 7)
        awardDemo(
          d,
          submission.student_id,
          `assignment:${submission.assignment_id}`,
          100,
          "Atividade aprovada pelo docente",
          new Date(),
          false,
        );
      writeDemo(d);
      await reload();
      return;
    }
    const { error } = await requireSupabase().rpc("grade_submission", {
      p_submission_id: id,
      p_grade: grade,
      p_feedback: feedback,
    });
    if (error) throw error;
    await reload();
  }
  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        syncError,
        reload,
        add,
        update,
        remove,
        completeModule,
        startTrack,
        recordRead,
        answer,
        grade,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
export function useData() {
  const v = useContext(DataContext);
  if (!v) throw new Error("DataProvider ausente");
  return v;
}
