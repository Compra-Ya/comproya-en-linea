import { Icon } from "./Icon";
import type { IconName, NoticeProps } from "./tipos";

// Aviso en línea: qué pasó (title) + qué hacer (children) + el botón que lo hace (action).
// Reglas en design/design-system/components/Notice/README.md: nunca un mensaje técnico del
// servidor, nunca dos avisos que se contradicen a la vez, y junto a lo que lo causó.
const ICONO: Record<Exclude<NonNullable<NoticeProps["tone"]>, "progress">, IconName> = {
  info: "info",
  ok: "check-circle",
  warn: "warn",
  danger: "alert",
};

export function Notice({ tone = "info", title, children, action, className }: NoticeProps) {
  return (
    <div
      className={["cy-notice", `cy-notice-${tone}`, className].filter(Boolean).join(" ")}
      role={tone === "danger" ? "alert" : "status"}
    >
      {tone === "progress" ? <span className="cy-spinner" aria-hidden="true" /> : <Icon name={ICONO[tone]} />}
      <div className="cy-notice-body">
        {title ? <p className="cy-notice-title">{title}</p> : null}
        {children ? <div className="cy-notice-text">{children}</div> : null}
        {action ? <div className="cy-notice-actions">{action}</div> : null}
      </div>
    </div>
  );
}
