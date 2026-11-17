import { redirect } from "next/navigation";

// /admin no tiene contenido propio: lleva a la lista de ventas, que a su vez pide la sesión de la cuenta interna.
export default function InternoPage() {
  redirect("/admin/ventas");
}
