import { Icon } from "./Icon";
import { cx } from "./formato";
import type { IconName, NoticeProps } from "./tipos";

// Aviso en línea: error, estado del sistema, regla de negocio o modo de prueba. Todo error dice qué pasó
// (title), qué hacer (children) y ofrece el botón que lo hace (action). Nunca un mensaje técnico del servidor.
const ICONO: Record<string, IconName | null> = { info: "info", ok: "check-circle", warn: "warn", danger: "alert", progress: null, test: "card" };

export function Notice({ tone = "info", title, children, action, icon, progress, className }: NoticeProps) {
  const iconoPorTono = ICONO[tone];
  return (
    <div className={cx("cy-notice", `cy-notice-${tone}`, className)} role={tone === "danger" ? "alert" : "status"}>
      {tone === "progress" ? <span className="cy-spinner" aria-hidden="true" /> : <Icon name={icon ?? iconoPorTono ?? "info"} />}
      <div className="cy-notice-body">
        {title ? <p className="cy-notice-title">{title}</p> : null}
        {children ? <div className="cy-notice-text">{children}</div> : null}
        {progress ? (
          <div className="cy-progress" role="progressbar" aria-label={typeof title === "string" ? title : "Progreso"}>
            <span />
          </div>
        ) : null}
        {action ? <div className="cy-notice-actions">{action}</div> : null}
      </div>
    </div>
  );
}
