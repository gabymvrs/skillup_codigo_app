import { useId, useState } from "react";
import { Badge, Button, SearchField } from "../../components/ui";
import {
  headlines,
  skillSuggestions,
  uniqueSkills,
  visibilityLabels,
  type Visibility,
} from "./model";
export function HeadlineField({ value }: { value: string }) {
  const [choice, setChoice] = useState(
      headlines.includes(value) ? value : value ? "other" : "",
    ),
    [custom, setCustom] = useState(value);
  return (
    <>
      <label>
        Apresentação profissional
        <select value={choice} onChange={(e) => setChoice(e.target.value)}>
          <option value="">Selecione sua apresentação</option>
          {headlines.map((h) => (
            <option key={h}>{h}</option>
          ))}
          <option value="other">Outra área — personalizar</option>
        </select>
      </label>
      {choice === "other" && (
        <label>
          Apresentação personalizada
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={160}
            minLength={2}
            required
          />
        </label>
      )}
      <input
        type="hidden"
        name="headline"
        value={choice === "other" ? custom.trim() : choice}
      />
      <small className="muted">
        Apresentação autodeclarada; não comprova qualificação profissional.
      </small>
    </>
  );
}
export function SkillsField({
  initial = [],
  name = "skills",
  label = "Habilidades",
  limit = 30,
}: {
  initial?: string[];
  name?: string;
  label?: string;
  limit?: number;
}) {
  const [selected, setSelected] = useState(() => uniqueSkills(initial, limit)),
    [query, setQuery] = useState("");
  const id = useId();
  const options = skillSuggestions.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase()),
  );
  const isSelected = (s: string) =>
    selected.some(
      (value) => value.toLocaleLowerCase() === s.toLocaleLowerCase(),
    );
  function toggle(s: string) {
    setSelected((old) =>
      old.some((value) => value.toLocaleLowerCase() === s.toLocaleLowerCase())
        ? old.filter((x) => x.toLocaleLowerCase() !== s.toLocaleLowerCase())
        : old.length < limit
          ? uniqueSkills([...old, s], limit)
          : old,
    );
  }
  return (
    <fieldset className="skill-picker">
      <legend>{label}</legend>
      <SearchField
        label={`Buscar ${label.toLowerCase()}`}
        value={query}
        onChange={setQuery}
      />
      <div className="chips" aria-label={`${label} selecionadas`}>
        {selected.map((s) => (
          <Badge key={s}>
            {s}
            <button
              type="button"
              className="chip-remove"
              aria-label={`Remover ${s}`}
              onClick={() => toggle(s)}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div
        className="skill-options"
        role="group"
        aria-label={`Opções de ${label.toLowerCase()}`}
      >
        {options.map((s, i) => (
          <label className="check-label" key={s} htmlFor={`${id}-${i}`}>
            <input
              id={`${id}-${i}`}
              type="checkbox"
              checked={isSelected(s)}
              disabled={!isSelected(s) && selected.length >= limit}
              onChange={() => toggle(s)}
            />
            {s}
          </label>
        ))}
      </div>
      {query.trim() &&
        !skillSuggestions.some(
          (s) => s.toLowerCase() === query.trim().toLowerCase(),
        ) && (
          <Button
            variant="ghost"
            disabled={selected.length >= limit || query.trim().length > 60}
            onClick={() => {
              setSelected(uniqueSkills([...selected, query], limit));
              setQuery("");
            }}
          >
            Adicionar “{query.trim()}”
          </Button>
        )}
      <small>
        {selected.length}/{limit} selecionadas
      </small>
      <input type="hidden" name={name} value={selected.join(",")} />
    </fieldset>
  );
}
export function VisibilityField({
  value = "private",
  name = "visibility",
  onChange,
}: {
  value?: Visibility;
  name?: string;
  onChange?: (v: Visibility) => void;
}) {
  return (
    <label>
      Visibilidade
      <select
        name={name}
        defaultValue={onChange ? undefined : value}
        value={onChange ? value : undefined}
        onChange={(e) => onChange?.(e.target.value as Visibility)}
      >
        {Object.entries(visibilityLabels).map(([key, label]) => (
          <option value={key} key={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
