import { useEffect, useState } from "react";
import { useAuth } from "../state/AuthContext";
import { useData } from "../state/DataContext";
import { requireSupabase } from "../services/supabase";
import { demoRanking, type RankingRow } from "../services/learning";
import { Avatar } from "./Avatar";
import { ActionLink, Badge, Card, Empty, Notice } from "./ui";
export function WeeklyRanking() {
  const auth = useAuth(),
    { data } = useData(),
    [rows, setRows] = useState<RankingRow[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setError("");
    setLoading(true);
    if (auth.demo) {
      setRows(demoRanking(data));
      setLoading(false);
      return;
    }
    requireSupabase()
      .rpc("weekly_leaderboard")
      .then(({ data, error }) => {
        if (!active) return;
        if (error)
          setError(
            "Não foi possível carregar o ranking semanal. Tente recarregar a página.",
          );
        else setRows(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.demo, data.reward_events, data.profiles]);
  const own = rows.find((r) => r.user_id === auth.id),
    profile = data.profiles.find((p) => p.id === auth.id);
  return (
    <Card>
      <div className="row-between">
        <h2>Ranking semanal</h2>
        {auth.demo && <Badge>Demonstração</Badge>}
      </div>
      <p className="small muted">
        Segunda a domingo · horário de Brasília · perfis que optaram por
        participar.
      </p>
      {loading ? (
        <p role="status">Carregando ranking…</p>
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          {rows.slice(0, 3).map((r) => (
            <div className="ranking-row" key={r.user_id}>
              <strong className="rank-number">{r.position}</strong>
              <Avatar
                name={r.full_name}
                path={r.avatar_path}
                demoImage={r.avatar_demo}
              />
              <span>
                <strong>{r.full_name}</strong>
                <small>{r.xp} XP nesta semana</small>
              </span>
            </div>
          ))}
          {!rows.length && (
            <Empty title="A semana está começando">
              Nenhum participante com XP registrado nesta semana.
            </Empty>
          )}
          <p>
            <strong>Sua posição: {own ? `${own.position}º` : "—"}</strong>
          </p>
          {own ? (
            <p className="small">
              {own.xp} XP nesta semana · {own.previous_xp} XP na semana passada
              · diferença {own.xp - own.previous_xp >= 0 ? "+" : ""}
              {own.xp - own.previous_xp} XP.
            </p>
          ) : (
            <p className="small">
              {profile?.public_profile
                ? "Conclua uma nova atividade para entrar na classificação."
                : "Ative a participação na comunidade em Configurações para aparecer no ranking."}
            </p>
          )}
        </>
      )}
      {auth.demo && (
        <p className="small muted">
          Classificação calculada apenas sobre os registros locais da
          demonstração.
        </p>
      )}
      <ActionLink variant="ghost" to="/app/aprenda/pratica">
        Continuar praticando
      </ActionLink>
    </Card>
  );
}
