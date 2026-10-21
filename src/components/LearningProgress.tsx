import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { learningStats } from "../services/learning";
import { dateLabel } from "../lib/utils";
import { Button, Card, Icon, Modal, ProgressBar } from "./ui";
export function LearningProgress() {
  const auth = useAuth(),
    { data } = useData(),
    [open, setOpen] = useState(false),
    s = learningStats(data, auth.id!);
  return (
    <Card>
      <div className="row-between">
        <strong>Nível {s.level}</strong>
        <span>{s.xp} XP total</span>
      </div>
      <ProgressBar
        value={(s.xp % 1000) / 10}
        label={`${s.next} XP para o próximo nível`}
      />
      <div className="streak-stats">
        <span>
          <Icon name="flame" />
          {s.current} dia(s) de ofensiva
        </span>
        <span>Melhor: {s.best} dia(s)</span>
      </div>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Ver recompensas e conquistas
      </Button>
      {open && (
        <Modal title="Recompensas e conquistas" onClose={() => setOpen(false)}>
          <p>
            Estude em dias consecutivos. Bônus: 1 dia +10, 3 +30, 7 +75, 14 +150
            e 30 +350 XP, uma vez por sequência.
          </p>
          <p className="small">
            Virada do dia: {s.zone}. Conclusões offline contam na data da
            sincronização. Pontos anteriores à atualização foram preservados; a
            ofensiva começa com novas atividades.
          </p>
          {[1, 3, 7, 14, 30].map((n) => (
            <p key={n}>
              <Icon name={s.best >= n ? "award" : "lock"} /> {n} dia(s) ·{" "}
              {s.best >= n ? "Conquistado" : "Em construção"}
            </p>
          ))}
          <h3>Histórico de recompensas</h3>
          {s.rewards.length ? (
            s.rewards
              .slice()
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((r) => (
                <div className="list-row" key={r.id}>
                  <div>
                    {r.label}
                    <small>{dateLabel(r.created_at)}</small>
                  </div>
                  <strong>+{r.xp} XP</strong>
                </div>
              ))
          ) : (
            <p>Conclua seu primeiro exercício para começar.</p>
          )}
        </Modal>
      )}
    </Card>
  );
}
