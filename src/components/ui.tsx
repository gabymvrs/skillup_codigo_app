import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { Link, type To } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  Box,
  BriefcaseBusiness,
  Calendar,
  Check,
  ChevronRight,
  Code2,
  Cpu,
  Download,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  Home,
  Leaf,
  Lock,
  Menu,
  MessageCircle,
  Network,
  Play,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
  Building2,
  ClipboardCheck,
  LogOut,
  ExternalLink,
  Send,
  Mail,
  BarChart3,
  Filter,
  Folder,
  LoaderCircle,
} from "lucide-react";
import { errorMessage } from "../lib/utils";
const icons = {
  alert: AlertCircle,
  arrow: ArrowLeft,
  award: Award,
  bell: Bell,
  book: BookOpen,
  box: Box,
  briefcase: BriefcaseBusiness,
  calendar: Calendar,
  check: Check,
  chevron: ChevronRight,
  code: Code2,
  cpu: Cpu,
  download: Download,
  file: FileText,
  flame: Flame,
  graduation: GraduationCap,
  heart: Heart,
  home: Home,
  leaf: Leaf,
  lock: Lock,
  menu: Menu,
  message: MessageCircle,
  network: Network,
  play: Play,
  plus: Plus,
  search: Search,
  settings: Settings,
  shield: Shield,
  trash: Trash2,
  upload: Upload,
  users: Users,
  wifi: Wifi,
  offline: WifiOff,
  x: X,
  zap: Zap,
  building: Building2,
  clipboard: ClipboardCheck,
  logout: LogOut,
  external: ExternalLink,
  send: Send,
  mail: Mail,
  chart: BarChart3,
  filter: Filter,
  folder: Folder,
  loading: LoaderCircle,
};
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Comp = icons[name as keyof typeof icons] || FileText;
  return <Comp size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}
export function Button({
  variant = "primary",
  icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  icon?: string;
}) {
  return (
    <button
      {...props}
      type={props.type || "button"}
      className={`button ${variant} ${props.className || ""}`}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}
export function ActionLink({
  to,
  children,
  icon,
  variant = "primary",
}: {
  to: To;
  children: ReactNode;
  icon?: string;
  variant?: string;
}) {
  return (
    <Link className={`button ${variant}`} to={to}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </Link>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Heading({
  title,
  description,
  action,
  level = 1,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2;
}) {
  const H = level === 1 ? "h1" : "h2";
  return (
    <header className="page-heading">
      <div>
        <H>{title}</H>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{children}</h2>
      {action}
    </div>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success" | "warning";
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon name={tone === "success" ? "check" : "alert"} />
      <div>{children}</div>
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name="folder" size={32} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <Icon name="loading" />
      Carregando seu espaço…
    </div>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="progress-group">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <progress value={value} max={100} aria-label={label} />
    </div>
  );
}
export function Ring({ value }: { value: number }) {
  return (
    <div
      className="ring"
      style={{
        background: `conic-gradient(var(--primary) ${value}%, var(--tertiary-300) 0)`,
      }}
      role="img"
      aria-label={`${value}% concluído`}
    >
      <strong>{value}%</strong>
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="search-field">
      <Icon name="search" />
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
      />
    </div>
  );
}
export function Chips({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="chips" role="group" aria-label="Filtros">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={value === item}
          className={value === item ? "selected" : ""}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId(),
    last = useRef<HTMLElement | null>(null);
  useEffect(() => {
    last.current = document.activeElement as HTMLElement;
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      last.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`modal ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label="Fechar" onClick={onClose}>
          <Icon name="x" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const action = useAction();
  return (
    <Modal title={title} onClose={onClose}>
      <p>{children}</p>
      {action.error && <Notice tone="error">{action.error}</Notice>}
      <div className="actions">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          disabled={action.busy}
          onClick={() =>
            action.run(async () => {
              await onConfirm();
              onClose();
            })
          }
        >
          {action.busy ? "Aguarde…" : "Confirmar"}
        </Button>
      </div>
    </Modal>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const pending = useRef(false);
  async function run(fn: () => Promise<unknown>, message = "") {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      if (message) setSuccess(message);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { busy, error, success, run, setError, setSuccess };
}
export function ActionFeedback({
  action,
}: {
  action: ReturnType<typeof useAction>;
}) {
  return (
    <>
      {action.error && <Notice tone="error">{action.error}</Notice>}
      {action.success && <Notice tone="success">{action.success}</Notice>}
    </>
  );
}
