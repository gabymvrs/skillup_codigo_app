import { useState, type CSSProperties } from "react";
import { Button, Notice } from "../../components/ui";

type Organelle = {
  id: string;
  name: string;
  shortName: string;
  function: string;
  location: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "round" | "bean" | "stack" | "network" | "dot" | "edge";
};

const organelles: readonly Organelle[] = [
  {
    id: "nucleo",
    name: "Núcleo",
    shortName: "Núcleo",
    function: "Armazena o DNA e coordena muitas atividades da célula.",
    location: "Região central da célula neste modelo.",
    color: "#7655b7",
    x: 48,
    y: 48,
    width: 23,
    height: 30,
    shape: "round",
  },
  {
    id: "mitocondria",
    name: "Mitocôndria",
    shortName: "Mitocôndria",
    function:
      "Participa da respiração celular e da produção de ATP, usado como fonte de energia.",
    location: "Distribuída pelo citoplasma.",
    color: "#df7656",
    x: 72,
    y: 30,
    width: 17,
    height: 10,
    shape: "bean",
  },
  {
    id: "golgi",
    name: "Complexo golgiense",
    shortName: "Golgi",
    function: "Modifica, organiza e direciona proteínas e outras substâncias.",
    location: "Próximo ao núcleo neste modelo.",
    color: "#e5ab45",
    x: 72,
    y: 62,
    width: 18,
    height: 14,
    shape: "stack",
  },
  {
    id: "reticulo",
    name: "Retículo endoplasmático",
    shortName: "Retículo",
    function:
      "Forma uma rede que participa da produção e do transporte de proteínas e lipídios.",
    location: "Ao redor do núcleo.",
    color: "#4da7a0",
    x: 27,
    y: 43,
    width: 24,
    height: 20,
    shape: "network",
  },
  {
    id: "lisossomo",
    name: "Lisossomo",
    shortName: "Lisossomo",
    function:
      "Contém enzimas que ajudam a decompor materiais dentro da célula.",
    location: "Pequena vesícula no citoplasma.",
    color: "#cf5f91",
    x: 31,
    y: 72,
    width: 8,
    height: 10,
    shape: "round",
  },
  {
    id: "ribossomo",
    name: "Ribossomo",
    shortName: "Ribossomo",
    function: "Produz proteínas a partir das instruções do RNA mensageiro.",
    location: "Livre no citoplasma ou associado ao retículo.",
    color: "#315a92",
    x: 62,
    y: 79,
    width: 6,
    height: 7,
    shape: "dot",
  },
  {
    id: "membrana",
    name: "Membrana plasmática",
    shortName: "Membrana",
    function:
      "Delimita a célula e controla a entrada e a saída de substâncias.",
    location: "Contorno externo da célula.",
    color: "#267f76",
    x: 8,
    y: 52,
    width: 7,
    height: 18,
    shape: "edge",
  },
] as const;

export function AnimalCellSimulation() {
  const [selectedId, setSelectedId] = useState("nucleo"),
    [labels, setLabels] = useState(true),
    [challenge, setChallenge] = useState(false),
    [targetIndex, setTargetIndex] = useState(1),
    [feedback, setFeedback] = useState(""),
    selected = organelles.find((organelle) => organelle.id === selectedId)!,
    target = organelles[targetIndex];

  function select(organelle: Organelle) {
    setSelectedId(organelle.id);
    if (!challenge) {
      setFeedback(`Estrutura selecionada: ${organelle.name}.`);
      return;
    }
    if (organelle.id === target.id) {
      setFeedback(`Correto: você encontrou ${target.name}.`);
      setChallenge(false);
    } else {
      setFeedback(`Você selecionou ${organelle.name}. Procure ${target.name}.`);
    }
  }

  function startChallenge() {
    const current = organelles.findIndex(
      (organelle) => organelle.id === selectedId,
    );
    setTargetIndex((current + 1) % organelles.length);
    setChallenge(true);
    setFeedback("");
  }

  function reset() {
    setSelectedId("nucleo");
    setLabels(true);
    setChallenge(false);
    setTargetIndex(1);
    setFeedback("");
  }

  return (
    <section
      className="cell-simulation stack"
      aria-labelledby="cell-simulation-title"
    >
      <div className="row-between cell-simulation-heading">
        <div>
          <h3 id="cell-simulation-title">Explore a célula animal</h3>
          <p>Selecione uma estrutura para consultar sua função.</p>
        </div>
        <Button variant="outline" onClick={reset}>
          Reiniciar
        </Button>
      </div>

      <div className="cell-controls" aria-label="Controles da célula animal">
        <Button
          variant={challenge ? "secondary" : "outline"}
          aria-pressed={challenge}
          onClick={() => (challenge ? setChallenge(false) : startChallenge())}
        >
          {challenge ? "Encerrar desafio" : "Criar desafio"}
        </Button>
        <label className="check-label">
          <input
            type="checkbox"
            checked={labels}
            onChange={(event) => setLabels(event.target.checked)}
          />
          Mostrar nomes
        </label>
      </div>

      {challenge ? (
        <Notice>
          <strong>Desafio:</strong> encontre {target.name} no modelo.
        </Notice>
      ) : (
        <Notice>
          Este é um modelo simplificado. As estruturas não estão em escala e
          podem aparecer em outras posições dentro de uma célula real.
        </Notice>
      )}

      <div className="cell-workspace">
        <div
          className="cell-diagram"
          role="group"
          aria-label={`Modelo 2D de uma célula animal. Estrutura selecionada: ${selected.name}.`}
        >
          <div className="cell-body" aria-hidden="true" />
          {organelles.map((organelle) => (
            <button
              key={organelle.id}
              type="button"
              className={`cell-organelle ${organelle.shape} ${selectedId === organelle.id ? "selected" : ""}`}
              style={
                {
                  "--organelle-x": `${organelle.x}%`,
                  "--organelle-y": `${organelle.y}%`,
                  "--organelle-width": `${organelle.width * 3}px`,
                  "--organelle-height": `${organelle.height * 3}px`,
                  "--organelle-color": organelle.color,
                } as CSSProperties
              }
              aria-label={`Selecionar ${organelle.name}`}
              aria-pressed={selectedId === organelle.id}
              onClick={() => select(organelle)}
            >
              <span className="cell-organelle-shape" aria-hidden="true" />
              {labels && (
                <span className="cell-organelle-name">
                  {organelle.shortName}
                </span>
              )}
            </button>
          ))}
        </div>

        <article className="cell-details" aria-live="polite">
          <span className="cell-details-kicker">Estrutura selecionada</span>
          <h4>{selected.name}</h4>
          <p>{selected.function}</p>
          <dl>
            <dt>Onde observar</dt>
            <dd>{selected.location}</dd>
          </dl>
        </article>
      </div>

      <p
        className="cell-feedback"
        role="status"
        aria-label="Feedback da célula"
        aria-live="polite"
      >
        {feedback || "Selecione uma estrutura ou inicie um desafio."}
      </p>
    </section>
  );
}
