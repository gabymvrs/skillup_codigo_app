import { useState, type CSSProperties } from "react";
import { Button, Notice } from "../../components/ui";

const voltages = [3, 6, 9] as const;

export function ElectricCircuitSimulation() {
  const [closed, setClosed] = useState(false);
  const [voltage, setVoltage] = useState<(typeof voltages)[number]>(6);
  const [resistance, setResistance] = useState(20);
  const current = closed ? voltage / resistance : 0;
  const power = closed ? voltage * current : 0;
  const brightness = Math.min(1, power / 4.05);
  const stateText = closed ? "fechado" : "aberto";

  function reset() {
    setClosed(false);
    setVoltage(6);
    setResistance(20);
  }

  return (
    <section
      className="circuit-simulation stack"
      aria-labelledby="circuit-simulation-title"
    >
      <div className="row-between circuit-simulation-heading">
        <div>
          <h3 id="circuit-simulation-title">Monte um circuito básico</h3>
          <p>Feche a chave e ajuste a fonte e a resistência da lâmpada.</p>
        </div>
        <Button variant="outline" onClick={reset}>
          Reiniciar
        </Button>
      </div>

      <Notice>
        Este modelo usa a Lei de Ohm: corrente = tensão ÷ resistência. Os
        valores e o brilho foram simplificados para a atividade.
      </Notice>

      <div className="circuit-controls" aria-label="Controles do circuito">
        <fieldset>
          <legend>Tensão da fonte</legend>
          <div className="circuit-voltage-options">
            {voltages.map((option) => (
              <Button
                key={option}
                variant={voltage === option ? "secondary" : "outline"}
                aria-pressed={voltage === option}
                onClick={() => setVoltage(option)}
              >
                {option} V
              </Button>
            ))}
          </div>
        </fieldset>
        <label className="circuit-resistance-control">
          <span>
            Resistência da lâmpada: <strong>{resistance} Ω</strong>
          </span>
          <input
            type="range"
            min="10"
            max="40"
            step="5"
            value={resistance}
            onChange={(event) => setResistance(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="circuit-workspace">
        <div
          className={`circuit-board ${closed ? "is-on" : "is-off"}`}
          role="img"
          aria-label={`Circuito ${stateText}, fonte de ${voltage} volts, resistência de ${resistance} ohms e corrente de ${current.toFixed(2)} ampère.`}
          style={{ "--lamp-brightness": brightness } as CSSProperties}
        >
          <div className="circuit-wire wire-top" aria-hidden="true" />
          <div className="circuit-wire wire-right" aria-hidden="true" />
          <div className="circuit-wire wire-bottom" aria-hidden="true" />
          <div className="circuit-wire wire-left" aria-hidden="true" />
          <div className="circuit-battery" aria-hidden="true">
            <span className="battery-positive">+</span>
            <span className="battery-cell long" />
            <span className="battery-cell short" />
            <span className="battery-negative">−</span>
            <small>{voltage} V</small>
          </div>
          <div className="circuit-lamp" aria-hidden="true">
            <span className="lamp-glow" />
            <span className="lamp-bulb">✕</span>
            <small>Lâmpada</small>
          </div>
          <button
            type="button"
            className="circuit-switch"
            aria-label={`${closed ? "Abrir" : "Fechar"} chave do circuito`}
            aria-pressed={closed}
            onClick={() => setClosed((value) => !value)}
          >
            <span className="switch-contact" aria-hidden="true" />
            <span className="switch-lever" aria-hidden="true" />
            <span>{closed ? "Abrir chave" : "Fechar chave"}</span>
          </button>
        </div>

        <article className="circuit-readings" aria-live="polite">
          <span className="circuit-readings-kicker">Leituras do modelo</span>
          <h4>Circuito {stateText}</h4>
          <p>
            {closed
              ? "O caminho está completo: há corrente e a lâmpada acende."
              : "A chave interrompe o caminho: não há corrente e a lâmpada fica apagada."}
          </p>
          <dl>
            <div>
              <dt>Tensão</dt>
              <dd>{voltage} V</dd>
            </div>
            <div>
              <dt>Corrente</dt>
              <dd>{current.toFixed(2)} A</dd>
            </div>
            <div>
              <dt>Potência</dt>
              <dd>{power.toFixed(2)} W</dd>
            </div>
          </dl>
        </article>
      </div>

      <p
        className="circuit-feedback"
        role="status"
        aria-label="Feedback do circuito"
        aria-live="polite"
      >
        {closed
          ? `A corrente está circulando. Com ${voltage} V e ${resistance} Ω, ela vale ${current.toFixed(2)} A.`
          : "Feche a chave para completar o caminho da corrente."}
      </p>
    </section>
  );
}
