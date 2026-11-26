import type { HTMLAttributes, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoAlert, IoCheckmark } from "react-icons/io5";
import { useSlidingThumb } from "./steps-utils/use-sliding-thumb";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const PRESS_SCALE = 1.12;
export type StepStatus = "complete" | "current" | "upcoming" | "error";
export type StepsOrientation = "horizontal" | "vertical";
export type StepsSize = "sm" | "md" | "lg";

export interface StepItem {
  title: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
  icon?: ReactNode;
}

export interface StepsProps extends Omit<
  HTMLAttributes<HTMLOListElement>,
  "onChange"
> {
  items: StepItem[];
  current: number;
  orientation?: StepsOrientation;
  clickable?: boolean;
  onStepChange?: (index: number) => void;
  size?: StepsSize;
  "aria-label"?: string;
}

const STATUS_LABEL: Record<StepStatus, string> = {
  complete: "Concluída",
  current: "Etapa atual",
  upcoming: "Não iniciada",
  error: "Com erro",
};
const MIN_VISIBLE = 90;

function usePressFeedback(disabled = false) {
  const [pressed, setPressed] = useState(false);
  const pressedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const press = useCallback(() => {
    if (disabled) return;
    if (timer.current) clearTimeout(timer.current);
    pressedAt.current = Date.now();
    setPressed(true);
  }, [disabled]);
  const release = useCallback(() => {
    const remaining = Math.max(
      0,
      MIN_VISIBLE - (Date.now() - pressedAt.current),
    );
    if (!remaining) return setPressed(false);
    timer.current = setTimeout(() => setPressed(false), remaining);
  }, []);
  return {
    pressProps: {
      onPointerDown: press,
      onPointerUp: release,
      onPointerCancel: release,
      onPointerLeave: release,
      "data-pressed": pressed ? ("true" as const) : undefined,
    },
  };
}

interface StepProps {
  item: StepItem;
  index: number;
  status: StepStatus;
  last: boolean;
  clickable: boolean;
  markerRef: (node: HTMLSpanElement | null) => void;
  onSelect?: (index: number) => void;
}

function Step({
  item,
  index,
  status,
  last,
  clickable,
  markerRef,
  onSelect,
}: StepProps) {
  const interactive = clickable && status !== "upcoming";
  const { pressProps } = usePressFeedback(!interactive);
  const body = (
    <>
      <span ref={markerRef} className="may-steps__marker" aria-hidden>
        {item.icon ??
          (status === "complete" ? (
            <IoCheckmark className="may-steps__check" />
          ) : status === "error" ? (
            <IoAlert />
          ) : (
            index + 1
          ))}
      </span>
      <span className="may-steps__text">
        <span className="may-steps__title">{item.title}</span>
        {item.description && (
          <span className="may-steps__description">{item.description}</span>
        )}
      </span>
      <span className="may-sr-only">{STATUS_LABEL[status]}</span>
    </>
  );
  return (
    <li
      className="may-steps__step"
      data-status={status}
      aria-current={status === "current" ? "step" : undefined}
    >
      {clickable ? (
        <button
          {...pressProps}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(index)}
          className="may-steps__body may-pressable"
        >
          {body}
        </button>
      ) : (
        <span className="may-steps__body">{body}</span>
      )}
      {!last && <span className="may-steps__connector" aria-hidden />}
    </li>
  );
}

export function Steps({
  items = [],
  current,
  orientation = "horizontal",
  clickable = false,
  onStepChange,
  size = "md",
  className,
  "aria-label": ariaLabel = "Progresso",
  ...rest
}: StepsProps) {
  const statusAt = (index: number): StepStatus =>
    items[index]?.status ??
    (index < current ? "complete" : index === current ? "current" : "upcoming");
  const { trackRef, thumbRef, registerItem, onPointerDown } = useSlidingThumb<
    HTMLOListElement,
    HTMLSpanElement
  >({
    axis: orientation === "vertical" ? "block" : "inline",
    itemCount: items.length,
    selectedIndex: current,
    roundEnds: true,
    pressScale: PRESS_SCALE,
    enabled: clickable,
  });
  return (
    <ol
      {...rest}
      ref={trackRef}
      aria-label={ariaLabel}
      data-orientation={orientation}
      data-size={size}
      data-clickable={clickable ? "true" : undefined}
      className={cx("may-steps", className)}
      onPointerDown={clickable ? onPointerDown : undefined}
    >
      {clickable && (
        <span ref={thumbRef} className="may-steps__thumb" aria-hidden />
      )}
      {items.map((item, index) => (
        <Step
          key={index}
          item={item}
          index={index}
          status={statusAt(index)}
          last={index === items.length - 1}
          clickable={clickable}
          markerRef={registerItem(index)}
          onSelect={onStepChange}
        />
      ))}
    </ol>
  );
}

export default Steps;
