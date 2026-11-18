import { useState, type CSSProperties } from "react";
import { Button, Notice } from "../../components/ui";

type Planet = {
  id: string;
  name: string;
  color: string;
  size: number;
  orbit: number;
  duration: number;
  year: string;
  description: string;
};

const planets: readonly Planet[] = [
  {
    id: "mercurio",
    name: "Mercúrio",
    color: "#a9a9a9",
    size: 9,
    orbit: 15,
    duration: 5,
    year: "88 dias terrestres",
    description:
      "É o planeta mais próximo do Sol e completa a órbita mais rápida.",
  },
  {
    id: "venus",
    name: "Vênus",
    color: "#e3b565",
    size: 12,
    orbit: 20,
    duration: 7,
    year: "225 dias terrestres",
    description:
      "Tem uma atmosfera espessa e é o segundo planeta a partir do Sol.",
  },
  {
    id: "terra",
    name: "Terra",
    color: "#3f83d7",
    size: 13,
    orbit: 25,
    duration: 10,
    year: "365 dias terrestres",
    description:
      "É o terceiro planeta e possui água líquida em grande quantidade.",
  },
  {
    id: "marte",
    name: "Marte",
    color: "#c85b3c",
    size: 10,
    orbit: 30,
    duration: 13,
    year: "687 dias terrestres",
    description:
      "É conhecido pela superfície avermelhada rica em óxidos de ferro.",
  },
  {
    id: "jupiter",
    name: "Júpiter",
    color: "#d1a277",
    size: 20,
    orbit: 35,
    duration: 17,
    year: "Quase 12 anos terrestres",
    description: "É o maior planeta do Sistema Solar e um gigante gasoso.",
  },
  {
    id: "saturno",
    name: "Saturno",
    color: "#e0c277",
    size: 18,
    orbit: 40,
    duration: 21,
    year: "Cerca de 29 anos terrestres",
    description: "É um gigante gasoso reconhecido pelo amplo sistema de anéis.",
  },
  {
    id: "urano",
    name: "Urano",
    color: "#79c9ce",
    size: 15,
    orbit: 45,
    duration: 25,
    year: "Cerca de 84 anos terrestres",
    description: "É um gigante de gelo que gira com o eixo muito inclinado.",
  },
  {
    id: "netuno",
    name: "Netuno",
    color: "#4667c8",
    size: 15,
    orbit: 49,
    duration: 29,
    year: "Cerca de 165 anos terrestres",
    description:
      "É o planeta mais distante do Sol e apresenta ventos muito intensos.",
  },
] as const;

export function SolarSystemSimulation() {
  const [running, setRunning] = useState(false),
    [speed, setSpeed] = useState(1),
    [labels, setLabels] = useState(true),
    [selectedId, setSelectedId] = useState("terra"),
    [resetKey, setResetKey] = useState(0),
    selected = planets.find((planet) => planet.id === selectedId)!;

  function reset() {
    setRunning(false);
    setSpeed(1);
    setLabels(true);
    setSelectedId("terra");
    setResetKey((value) => value + 1);
  }

  return (
    <section
      className="solar-simulation stack"
      aria-labelledby="solar-simulation-title"
    >
      <div className="row-between solar-simulation-heading">
        <div>
          <h3 id="solar-simulation-title">Explore as órbitas</h3>
          <p>
            Inicie o movimento e selecione um planeta para consultar suas
            informações.
          </p>
        </div>
        <Button variant="outline" onClick={reset}>
          Reiniciar
        </Button>
      </div>

      <div className="solar-controls" aria-label="Controles do Sistema Solar">
        <Button
          variant={running ? "secondary" : "primary"}
          aria-pressed={running}
          onClick={() => setRunning((value) => !value)}
        >
          {running ? "Pausar órbitas" : "Iniciar órbitas"}
        </Button>
        <label className="solar-speed-control">
          <span>Velocidade: {speed}×</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.5"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>
        <label className="check-label solar-label-control">
          <input
            type="checkbox"
            checked={labels}
            onChange={(event) => setLabels(event.target.checked)}
          />
          Mostrar nomes
        </label>
      </div>

      <Notice>
        As distâncias, os tamanhos e as velocidades foram simplificados para
        caber na tela. A ordem dos planetas e a diferença entre os períodos
        orbitais foram preservadas.
      </Notice>

      <div className="solar-workspace">
        <div
          key={resetKey}
          className={`solar-scene ${running ? "running" : "paused"}`}
          role="group"
          aria-label={`Modelo 2D do Sistema Solar. ${running ? "Órbitas em movimento." : "Órbitas pausadas."} Planeta selecionado: ${selected.name}.`}
        >
          <div className="solar-star" aria-hidden="true">
            Sol
          </div>
          {planets.map((planet, index) => (
            <div
              className="solar-orbit"
              key={planet.id}
              style={
                {
                  "--solar-orbit": `${planet.orbit}%`,
                  "--solar-duration": `${planet.duration / speed}s`,
                  "--solar-delay": `${-index * 1.7}s`,
                } as CSSProperties
              }
            >
              <button
                type="button"
                className={`solar-planet ${selectedId === planet.id ? "selected" : ""}`}
                style={
                  {
                    "--planet-color": planet.color,
                    "--planet-size": `${planet.size}px`,
                  } as CSSProperties
                }
                aria-label={`Selecionar ${planet.name}`}
                aria-pressed={selectedId === planet.id}
                onClick={() => setSelectedId(planet.id)}
              >
                <span className="solar-planet-dot" aria-hidden="true" />
                {labels && (
                  <span className="solar-planet-name">{planet.name}</span>
                )}
              </button>
            </div>
          ))}
        </div>

        <article className="solar-planet-details" aria-live="polite">
          <span className="solar-position">
            {planets.indexOf(selected) + 1}º planeta a partir do Sol
          </span>
          <h4>{selected.name}</h4>
          <p>{selected.description}</p>
          <dl>
            <div>
              <dt>Uma volta ao redor do Sol</dt>
              <dd>{selected.year}</dd>
            </div>
            <div>
              <dt>Posição no modelo</dt>
              <dd>
                Órbita {planets.indexOf(selected) + 1} de {planets.length}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
