import { Link, useParams } from "react-router-dom";
import {
  ActionLink,
  Badge,
  Card,
  Empty,
  Heading,
  Icon,
  Notice,
} from "../../components/ui";
import { findSimulation, simulationCatalog } from "./catalog";

export function SimulationCatalogPage() {
  return (
    <div className="stack simulation-lab">
      <Heading
        title="Laboratório de simulações"
        description="Escolha um tema para consultar o objetivo da atividade. As experiências interativas serão liberadas nos próximos lotes."
      />
      <ul className="simulation-catalog" aria-label="Simulações educativas">
        {simulationCatalog.map((simulation) => (
          <li key={simulation.id}>
            <Card className="simulation-card">
              <div className="simulation-card-heading">
                <span className="simulation-icon" aria-hidden="true">
                  <Icon name={simulation.icon} size={28} />
                </span>
                <Badge>{simulation.subject}</Badge>
              </div>
              <h2>{simulation.title}</h2>
              <p>{simulation.description}</p>
              <ActionLink
                to={`/app/aprenda/laboratorio/${simulation.id}`}
                variant="outline"
              >
                Ver planejamento
              </ActionLink>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SimulationPage() {
  const { simulationId } = useParams();
  const simulation = findSimulation(simulationId);

  if (!simulation)
    return (
      <Empty
        title="Simulação não encontrada"
        action={
          <ActionLink to="/app/aprenda/laboratorio">Ver catálogo</ActionLink>
        }
      >
        Confira as atividades disponíveis no laboratório.
      </Empty>
    );

  return (
    <div className="stack simulation-lab">
      <Link className="back-link" to="/app/aprenda/laboratorio">
        <Icon name="arrow" />
        Laboratório
      </Link>
      <Heading title={simulation.title} description={simulation.description} />
      <Notice>
        A experiência interativa será implementada no Lote{" "}
        {simulation.implementationBatch}. Este lote organiza somente o catálogo
        e a navegação.
      </Notice>
      <Card>
        <h2>O que você vai aprender</h2>
        <ul className="simulation-goals">
          {simulation.learningGoals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
