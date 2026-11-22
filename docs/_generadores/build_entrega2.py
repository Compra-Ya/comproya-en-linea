"""Genera docs/entrega-2/Segundo_Entregable_ComproYa.docx con el formato de la primera entrega.

Parte de Resultados_Pruebas_ComproYa.docx (estilos, portada y la ficha «CASO DE PRUEBA» del docente), vacía su cuerpo y
escribe las secciones del segundo entregable. Todas las cifras salen de archivos de evidencia (jest, cobertura, navegador).

  python build_entrega2.py <Resultados_Pruebas_ComproYa.docx> <carpeta_evidencia>
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt
from docx.table import Table
from docx.text.paragraph import Paragraph

import build_ejecucion as ejecucion
import entrega2_casos as casos
import plantilla as pl

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "entrega-2"
IMG = SALIDA / "img"
DISENO = RAIZ.parent / "design"
FECHA = "17 de noviembre de 2026"  # fecha de ejecución de las pruebas
FECHA_DOC = "22 de noviembre de 2026"  # fecha de esta versión del documento (portada)
FECHA_ISO = "2026-11-17"


class Constructor:
    def __init__(self, base: Path):
        self.doc = docx.Document(str(base))
        self.body = self.doc.element.body
        els = list(self.body.iterchildren())
        self.sect = els[-1]
        self.portada = els[0:12]
        self.salto = copy.deepcopy(els[12])
        self.h1 = copy.deepcopy(els[13])
        self.p = copy.deepcopy(els[14])
        self.h2 = copy.deepcopy(els[15])
        inicio = next(i for i, e in enumerate(els) if e.tag == qn("w:p") and "CASO DE PRUEBA No. PR-01" in "".join(t.text or "" for t in e.iter(qn("w:t"))))
        self.molde_caso = [copy.deepcopy(e) for e in els[inicio:inicio + 19]]
        for e in els[12:-1]:
            self.body.remove(e)
        self.n_fig = 0
        self._salto = False

    # ----- bloques simples
    def _add(self, el):
        self.sect.addprevious(el)
        return el

    def salto_pagina(self):
        self._salto = True  # el salto se aplica como «saltar de página antes» del siguiente título (no deja páginas en blanco)

    @staticmethod
    def _pb_antes(el):
        ppr = el.find(qn("w:pPr"))
        if ppr is None:
            ppr = el.makeelement(qn("w:pPr"), {})
            el.insert(0, ppr)
        if ppr.find(qn("w:pageBreakBefore")) is None:
            ppr.insert(1 if ppr.find(qn("w:pStyle")) is not None else 0, ppr.makeelement(qn("w:pageBreakBefore"), {}))

    def h1_(self, texto: str):
        el = copy.deepcopy(self.h1)
        pl.set_paragraph_text(Paragraph(el, self.doc._body), texto)
        if self._salto:
            self._pb_antes(el)
            self._salto = False
        self._add(el)

    def h2_(self, texto: str):
        el = copy.deepcopy(self.h2)
        pl.set_paragraph_text(Paragraph(el, self.doc._body), texto)
        self._add(el)

    def p_(self, texto: str, negrita: bool = False, cursiva: bool = False, centrado: bool = False, tam: float | None = None):
        el = copy.deepcopy(self.p)
        par = Paragraph(el, self.doc._body)
        pl.set_paragraph_text(par, f"**{texto}**" if negrita else texto)
        for r in par.runs:
            if cursiva:
                r.italic = True
            if tam:
                r.font.size = Pt(tam)
        if centrado:
            par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        self._add(el)
        return par

    def lista(self, items: list[str]):
        for it in items:
            self.p_("•  " + it)

    def figura(self, ruta: Path, pie: str, ancho_cm: float = 16.0):
        self.n_fig += 1
        el = copy.deepcopy(self.p)
        par = Paragraph(el, self.doc._body)
        for r in list(par._p.findall(qn("w:r"))):
            par._p.remove(r)
        par.add_run().add_picture(str(ruta), width=Cm(ancho_cm))
        par.alignment = WD_ALIGN_PARAGRAPH.CENTER
        self._add(el)
        self.p_(f"Figura {self.n_fig}. {pie}", cursiva=True, centrado=True, tam=9)

    def tabla(self, cabecera: list[str], filas: list[list[str]], anchos: list[int], tam: float = 8.5):
        n = len(cabecera)
        t = self.doc.add_table(rows=1 + len(filas), cols=n)
        tbl = t._tbl
        self.body.remove(tbl)
        tbl_pr = tbl.tblPr
        for h in list(tbl_pr):
            tbl_pr.remove(h)
        w = tbl_pr.makeelement(qn("w:tblW"), {qn("w:type"): "dxa", qn("w:w"): str(sum(anchos))})
        tbl_pr.append(w)
        bordes = tbl_pr.makeelement(qn("w:tblBorders"), {})
        for lado in ("top", "left", "bottom", "right", "insideH", "insideV"):
            bordes.append(bordes.makeelement(qn(f"w:{lado}"), {qn("w:val"): "single", qn("w:color"): "auto", qn("w:sz"): "4"}))
        tbl_pr.append(bordes)
        lay = tbl_pr.makeelement(qn("w:tblLayout"), {qn("w:type"): "fixed"})
        tbl_pr.append(lay)
        grid = tbl.find(qn("w:tblGrid"))
        for gc, a in zip(grid.findall(qn("w:gridCol")), anchos):
            gc.set(qn("w:w"), str(a))
        for i, fila in enumerate([cabecera] + filas):
            for j, valor in enumerate(fila):
                celda = t.rows[i].cells[j]
                celda.width = Cm(anchos[j] / 567)
                pl.set_cell(celda, str(valor))
                for par in celda.paragraphs:
                    par.paragraph_format.space_after = Pt(2)
                    for r in par.runs:
                        r.font.size = Pt(tam)
                        if i == 0:
                            r.bold = True
                if i == 0:
                    tcpr = celda._tc.get_or_add_tcPr()
                    tcpr.append(tcpr.makeelement(qn("w:shd"), {qn("w:fill"): "D9D9D9", qn("w:val"): "clear"}))
        self._add(tbl)
        self._add(self._vacio())

    def _vacio(self):
        el = copy.deepcopy(self.p)
        pl.set_paragraph_text(Paragraph(el, self.doc._body), "")
        return el

    def ficha(self, filas: list[tuple[str, str]], anchos: tuple[int, int] = (2600, 6750)):
        self.tabla(["Campo", "Contenido"], [[a, b] for a, b in filas], list(anchos), tam=9)

    # ----- ficha del caso de prueba (formato del docente)
    def caso(self, c: dict, salto: bool = True):
        els = [copy.deepcopy(e) for e in self.molde_caso[:18]]  # sin el párrafo final de salto de página
        # índices del molde: 0 H1, 1 T info título, 2 T info datos, 3 P vacío, 4 T «1. CASO», 5 «a.», 6 texto,
        # 7 «b.», 8 y 9 pasos, 10 vacío, 11 T campos, 12 vacío, 13 «c.», 14 texto, 15 vacío, 16 T «2. RESULTADOS», 17 T resultados, 18 salto
        par = lambda e: Paragraph(e, self.doc._body)  # noqa: E731
        pl.set_paragraph_text(par(els[0]), f"CASO DE PRUEBA No. {c['id']}")
        if salto:
            self._pb_antes(els[0])
        info = Table(els[2], self.doc._body)
        for i, v in enumerate([c["id"], c.get("version", "1"), FECHA_ISO, c["cu"], c["modulo"], c["desc"]]):
            pl.set_cell(info.rows[i].cells[1], v)
        pl.set_paragraph_text(par(els[6]), c["pre"])
        paso_molde = els[8]
        pl.set_paragraph_text(par(els[8]), c["pasos"][0])
        pl.set_paragraph_text(par(els[9]), c["pasos"][1] if len(c["pasos"]) > 1 else "")
        previo = els[9]
        for extra in c["pasos"][2:]:
            nuevo = copy.deepcopy(paso_molde)
            pl.set_paragraph_text(par(nuevo), extra)
            els.insert(els.index(previo) + 1, nuevo)
            previo = nuevo
        if len(c["pasos"]) < 2:
            els.remove(els[9])
        tbls_caso = [e for e in els if e.tag == qn("w:tbl")]
        tabla = Table(tbls_caso[3], self.doc._body)
        filas = [[campo, valor, escenario, esperada, "X", "", sistema] for (campo, valor, escenario, esperada, sistema) in c["filas"]]
        pl.fill_table(tabla, filas)
        # post condición: el párrafo después de «c. Post condiciones»
        idx_c = next(i for i, e in enumerate(els) if e.tag == qn("w:p") and "c. Post" in "".join(t.text or "" for t in e.iter(qn("w:t"))))
        pl.set_paragraph_text(par(els[idx_c + 1]), c["post"])
        tbls = [e for e in els if e.tag == qn("w:tbl")]
        res = Table(tbls[-1], self.doc._body)
        pl.set_cell(res.rows[1].cells[0], c["defectos"])
        pl.set_cell(res.rows[1].cells[1], "☒ Paso / ☐ Falló")
        pl.set_cell(res.rows[3].cells[0], c["obs"])
        pl.set_cell(res.rows[3].cells[1], f"Firma: ______________________ / Nombre: {c['probador']} / Fecha: {FECHA_ISO}")
        for e in els:
            self._add(e)


def cargar(ev: Path) -> dict:
    j = json.loads((ev / "jest-completo.json").read_text(encoding="utf-8"))
    cov = json.loads((ev / "cobertura-resumen.json").read_text(encoding="utf-8"))["total"]
    s2 = json.loads((ev / "sprint2-resultado.json").read_text(encoding="utf-8"))
    interno = (ev / "interno-resultado.md").read_text(encoding="utf-8")
    ok_int = interno.count("| OK |")
    total_int = ok_int + interno.count("| FALLA |")
    return dict(jest=j, cov=cov, s2=s2, ok_int=ok_int, total_int=total_int)


def construir(base: Path, ev: Path, destino: Path) -> None:
    d = cargar(ev)
    j, cov = d["jest"], d["cov"]
    c = Constructor(base)
    # ------------------------------------------------------------- portada
    textos = {
        1: "Segundo entregable (segundo sprint)",
        2: "ComproYa en Línea — Canal de Venta Digital B2C",
        3: "Sprint 2 · Flujo gerencial: HU-113 a HU-116 (CU-09, CU-10 e ingreso de la cuenta interna) — análisis y diseño UML, "
           "implementación, pruebas de ruta, integración y sistema, y evaluación de usabilidad",
        10: FECHA_DOC,
    }
    for i, t in textos.items():
        pl.set_paragraph_text(Paragraph(c.portada[i], c.doc._body), t)
    c.salto_pagina()

    n_ruta = sum(1 for x in casos.CASOS if x["tipo"] == "ruta")
    n_int = sum(1 for x in casos.CASOS if x["tipo"] == "integración")
    n_sis = sum(1 for x in casos.CASOS if x["tipo"] == "sistema")

    # ------------------------------------------------------------- 1. Introducción
    c.h1_("1. Introducción y trazabilidad")
    c.p_("Este documento es el segundo entregable del proyecto y corresponde al segundo sprint (2 al 13 de noviembre de 2026, "
         "Jira: «Sprint 2 · Flujo gerencial»). Reporta los casos de uso realizados, la documentación de análisis y de diseño "
         "UML, la implementación con sus pantallas de ejecución, las pruebas de ruta, integración y sistema, y la evaluación de "
         "usabilidad como calidad en uso. Las actividades de los diagramas ya fueron explicadas en clase y reportadas en la "
         "primera entrega; aquí se aplican al alcance del sprint 2.")
    c.p_("El alcance del sprint son 4 historias de usuario del Plan de gestión de requisitos (PGR-001): HU-113 Consultar mis "
         "pedidos, HU-114 Consultar ventas, HU-115 Cancelar pedido y HU-116 Ingresar como Coordinador, con 56 de 60 horas-persona "
         "comprometidas. Cada historia se rastrea hasta su caso de uso, su regla de negocio, su prueba de aceptación (TEST-nnn) y su "
         "código (Tabla 3 y Anexo B).")
    c.h2_("Desviaciones documentadas")
    c.p_("1. Defecto D-01 corregido (RN-07). Al preparar este entregable se contrastó el código con la Declaración de alcance y se "
         "encontró que la cancelación aceptaba un pedido ya pagado por la API (aplicaba la regla RN-09 del canon 1.0), aunque la "
         "pantalla no ofrecía el botón. Se corrigió en PedidoService.cancelar y Pedido.puedeCancelarse(), se actualizaron 4 pruebas "
         "que asumían la regla antigua y se agregaron 2 pruebas del caso pagado. Los casos afectados se ejecutaron después de la "
         "corrección y llevan versión de ejecución 2.")
    c.p_("2. Los casos de la primera entrega (Resultados_Pruebas_ComproYa.docx, 17 de septiembre) se ejecutaron contra el canon "
         "1.0 (RN-09, retiro en sucursal). Este entregable aplica el alcance reducido vigente (docs/alcance): una sola sucursal, "
         "venta con envío y regla RN-07.")
    c.p_("3. La evaluación de usabilidad (sección 7) presenta la línea base medida por el equipo y deja el espacio de los "
         "participantes que aplican la sesión; no se reportan resultados de participantes que no hayan realizado la sesión.")
    c.p_("4. Las fechas del sprint 2 terminaron el 13 de noviembre. El sprint se cerró en Jira el 17 de noviembre, con las 4 historias y sus "
         "24 subtareas en estado Finalizado, porque la documentación y las pruebas de este entregable se completaron después de esa fecha "
         "(4 días calendario de desviación; 2 días hábiles del calendario del plan de cronograma).")
    c.p_("5. Esta versión (22 de noviembre de 2026) agrega el Anexo C con el soporte documental de los KPI de la gestión de la ejecución y "
         "corrige el estado del sprint 2 en Jira; las pruebas y las mediciones son las del 17 de noviembre.")
    c.salto_pagina()

    # ------------------------------------------------------------- 2. Casos de uso
    c.h1_("2. Casos de uso realizados")
    c.p_("Los casos de uso del sprint 2 son CU-09 (consulta de pedidos y ventas), CU-10 (cancelación del pedido) y el paquete 1.2.3 "
         "de la EDT (ingreso de la cuenta interna). Se describen con el formato de la asignatura.")
    CU = [
        ("CU-09 · Consulta de pedidos y ventas (HU-113 y HU-114)", [
            ("Actores", "Cliente digital (consulta sus pedidos) y Coordinador de Canal Digital (consulta las ventas)."),
            ("Descripción", "El Cliente digital ve la lista de sus pedidos con productos, total y estado. El Coordinador ve la lista de "
                            "ventas (pedidos pagados y vigentes) filtrada por fecha y estado, con el total vendido."),
            ("Precondiciones", "Cliente: sesión iniciada. Coordinador: sesión interna con rol Coordinador de Canal Digital."),
            ("Flujo principal (cliente)", "1. El cliente abre «Mis pedidos». 2. El sistema valida la sesión y consulta sus pedidos, los más "
                                          "recientes primero. 3. Muestra por pedido el estado en palabras, el total con el descuento del código y la siguiente acción permitida."),
            ("Flujo principal (coordinador)", "1. Abre /admin/ventas con la sesión interna. 2. Elige fechas y estado. 3. El sistema devuelve 20 ventas por "
                                              "página y el total vendido de todo el filtro. 4. Puede abrir «Ver envío» para ver dirección y teléfono."),
            ("Flujos alternos", "Sin sesión: lleva al ingreso. Sin pedidos: mensaje de lista vacía. Sesión de otro cliente: acceso rechazado. "
                                "Sin ventas en el filtro: «No hay ventas con esos filtros». Fechas inventadas o invertidas: mensaje de error."),
            ("Postcondiciones", "Ningún dato cambia."),
            ("Reglas de negocio", "REQ-016: una venta es un pedido con pago confirmado que sigue vigente. Fechas en días de Colombia (UTC−5). Cada cliente solo ve sus pedidos."),
            ("Pantallas y pruebas", "/pedidos y /admin/ventas. TEST-012. Casos S2-PR-01, PR-02, PR-05, PI-03, PI-04, PI-06, PS-01 y PS-03."),
        ]),
        ("CU-10 · Cancelación del pedido (HU-115)", [
            ("Actor", "Cliente digital."),
            ("Descripción", "El cliente cancela un pedido que aún no pagó para liberar las unidades que se reservaron."),
            ("Precondiciones", "Sesión iniciada; pedido propio en estado Creado o Pago fallido."),
            ("Flujo principal", "1. En «Mis pedidos» el pedido sin pagar ofrece «Cancelar pedido». 2. El cliente pulsa y confirma «Sí, cancelar pedido». "
                                "3. El sistema verifica que el pedido es del cliente y que no se ha pagado. 4. Marca el pedido Cancelado, registra el historial y libera "
                                "las unidades reservadas por la interfaz con el ERP (simulada). 5. Registra la auditoría y muestra «Pedido cancelado»."),
            ("Flujos alternos", "Pedido pagado: la pantalla no ofrece el botón y la API responde 400. Pedido de otro cliente: 403. Pedido ya cancelado: 400. Sin sesión: 401."),
            ("Postcondiciones", "El pedido queda Cancelado, las unidades vuelven a estar disponibles y el pedido deja de contar como venta."),
            ("Reglas de negocio", "RN-07: un pedido solo puede cancelarse mientras no se haya pagado; al cancelarlo se liberan sus unidades reservadas."),
            ("Pantallas y pruebas", "/pedidos (diálogo de confirmación). TEST-013. Casos S2-PR-03, PI-01, PI-02, PI-05 y PS-02."),
        ]),
        ("Paquete 1.2.3 · Ingreso de la cuenta interna (HU-116)", [
            ("Actor", "Coordinador de Canal Digital."),
            ("Descripción", "El Coordinador entra al panel con una cuenta interna para publicar productos y ver las ventas."),
            ("Precondiciones", "Cuenta interna activa (sembrada con npm run seed:staff). El acceso es por la dirección /admin; ninguna pantalla de la tienda enlaza a ella."),
            ("Flujo principal", "1. Abre /admin/ingresar. 2. Escribe correo y clave. 3. El sistema verifica la cuenta activa y la clave y emite una sesión interna de 12 horas. "
                                "4. Lo lleva a /admin/publicar y muestra «Coordinador de Canal Digital · correo»."),
            ("Flujos alternos", "Clave equivocada o correo inexistente: el mismo mensaje de error. Cuenta desactivada: no entra y su token deja de servir. "
                                "Sesión de un cliente: no abre el panel. Sin sesión: las rutas internas responden 401."),
            ("Postcondiciones", "Hay una sesión interna que no sirve como sesión de cliente."),
            ("Reglas de negocio", "REQ-017: acceso por sesión y rol; /admin no se indexa (noindex)."),
            ("Pantallas y pruebas", "/admin/ingresar. TEST-007. Casos S2-PR-04, PI-07, PS-03 y PS-04."),
        ]),
    ]
    for titulo, filas in CU:
        c.h2_(titulo)
        c.ficha(filas)
    c.salto_pagina()

    # ------------------------------------------------------------- 3. Análisis UML
    c.h1_("3. Documentación de análisis UML")
    c.h2_("3.1 Identificación de clases (frontera, entidad y control)")
    c.p_("Las clases de frontera son las pantallas con las que interactúan los actores; las de control coordinan cada caso de uso "
         "(en el código son los servicios de aplicación y sus controladores); las de entidad guardan la información persistente "
         "(tablas de Prisma).")
    c.tabla(["Clase", "Tipo", "Responsabilidad", "Código"], [
        ["PantallaMisPedidos", "Frontera", "Muestra los pedidos del cliente, su estado y la acción «Cancelar pedido» con confirmación.", "frontend/src/app/pedidos/page.tsx"],
        ["PantallaIngresoInterno", "Frontera", "Pide correo y clave de la cuenta interna en /admin/ingresar.", "frontend/src/app/admin/ingresar/page.tsx"],
        ["PantallaListaDeVentas", "Frontera", "Filtros por fecha y estado, total vendido, 20 filas por página y «Ver envío».", "frontend/src/app/admin/ventas/page.tsx"],
        ["GestorDeConsultaDePedidos", "Control", "Lista y obtiene los pedidos del cliente autenticado.", "backend/src/pedido/pedido.service.ts (listarPorCliente, obtener)"],
        ["GestorDeCancelacion", "Control", "Valida la regla RN-07, cancela, libera reservas y audita.", "backend/src/pedido/pedido.controller.ts y pedido.service.ts (cancelar)"],
        ["GestorDeVentas", "Control", "Consulta las ventas con filtros, paginación y total vendido.", "backend/src/pedido/ventas.service.ts"],
        ["GestorDeIngresoInterno", "Control", "Autentica la cuenta interna, emite la sesión y verifica el rol.", "backend/src/cuenta/cuenta.service.ts (loginInterno) y auth/acceso-interno.ts"],
        ["Cliente", "Entidad", "Persona que compra; dueña de sus pedidos.", "tabla customers"],
        ["Pedido", "Entidad", "Compra confirmada con estado, datos de envío y fechas.", "tabla orders (clase de dominio Pedido)"],
        ["LineaPedido", "Entidad", "Producto, cantidad y precio unitario congelado.", "tabla order_items"],
        ["ReservaUnidades", "Entidad", "Unidades que el pedido aparta en el ERP; se libera al cancelar o al fallar el pago.", "tabla units_reservations"],
        ["Pago", "Entidad", "Estado del cobro y token de la pasarela (nunca datos de tarjeta, RN-05).", "tabla payments"],
        ["CuentaInterna", "Entidad", "Cuenta del Coordinador: correo, clave con hash, rol y estado activo.", "tabla staff_users"],
        ["RegistroDeAuditoria", "Entidad", "Quién hizo qué sobre un pedido o cliente.", "tabla audit_log"],
    ], [2200, 1000, 3700, 2450])
    c.h2_("3.2 Diagrama de clases inicial")
    c.figura(IMG / "A1_clases_iniciales.png", "Diagrama de clases inicial del sprint 2 con estereotipos de frontera, control y entidad.", 15.5)
    c.h2_("3.3 Diagramas de colaboración")
    c.figura(IMG / "A2_colaboracion_cancelar.png", "Colaboración del caso de uso CU-10 Cancelación del pedido (mensajes numerados).", 16.0)
    c.figura(IMG / "A3a_colaboracion_ingreso.png", "Colaboración del ingreso de la cuenta interna (HU-116, paquete 1.2.3).", 10.5)
    c.figura(IMG / "A3b_colaboracion_ventas.png", "Colaboración de la consulta de ventas del Coordinador (CU-09, HU-114).", 11.5)
    c.h2_("3.4 Modelo entidad–relación")
    c.p_("El modelo muestra las tablas que usan los casos de uso del sprint 2; los nombres de tabla y de columna son los reales de "
         "backend/prisma/schema.prisma (10 migraciones aplicadas). La cuenta interna (staff_users) no se relaciona con customers a propósito: "
         "una sesión interna no sirve como sesión de cliente.")
    c.figura(IMG / "A4_entidad_relacion.png", "Modelo entidad–relación de pedidos, reservas, pagos, auditoría y cuenta interna.", 10.5)
    c.salto_pagina()

    # ------------------------------------------------------------- 4. Diseño UML
    c.h1_("4. Documentación de diseño UML")
    c.h2_("4.1 Diagrama de clases detallado")
    c.p_("Es el diseño tal como está implementado: controladores HTTP de NestJS, servicios de aplicación, clases de dominio, guardas de "
         "acceso y el acceso a datos con Prisma. Un módulo no importa entidades de otro directamente, solo a través de un servicio.")
    c.figura(IMG / "D1a_clases_pedido.png", "Diagrama de clases detallado: consulta y cancelación de pedidos (CU-09 y CU-10, backend).", 14.0)
    c.figura(IMG / "D1b_clases_ventas_e_ingreso.png", "Diagrama de clases detallado: lista de ventas e ingreso de la cuenta interna (HU-114 y HU-116, backend).", 15.0)
    c.h2_("4.2 Diagrama de despliegue")
    c.figura(IMG / "D2_despliegue.png", "Diagrama de despliegue: navegador, frontend, backend, base de datos y pasarela de pagos.", 16.0)
    c.p_("El entorno donde se verificó este entregable es local (Docker para PostgreSQL). El destino previsto es Cloud Run y Cloud SQL "
         "(docs/despliegue-gcp.md); el despliegue por GitHub Actions todavía no autentica contra GCP, por lo que no se reporta "
         "ninguna verificación en la nube.")
    c.h2_("4.3 Diagramas de secuencia")
    c.figura(IMG / "D3_secuencia_cancelar.png", "Secuencia de CU-10 Cancelación del pedido, con los caminos de pedido ajeno y de pedido pagado.", 16.5)
    c.figura(IMG / "D4_secuencia_ventas.png", "Secuencia del ingreso de la cuenta interna y la consulta de ventas.", 16.5)
    c.h2_("4.4 Diagrama de estado del producto (Pedido)")
    c.p_("El producto del canal es el pedido: su ciclo de vida decide cuándo se puede cancelar (RN-07) y cuándo cuenta como venta (REQ-016). "
         "Los estados En alistamiento, Listo para retiro y Entregado se conservan en el modelo pero su operación está fuera del alcance reducido.")
    c.figura(IMG / "D5_estado_pedido.png", "Diagrama de estados del Pedido.", 15.0)
    c.salto_pagina()

    # ------------------------------------------------------------- 5. Implementación
    c.h1_("5. Implementación del entregable")
    c.p_("Tabla 3. Trazabilidad de cada historia hasta su código y sus pruebas.", negrita=True)
    c.tabla(["Historia", "Backend", "Frontend", "Pruebas"], [
        ["HU-113 Consultar mis pedidos (CU-09)", "GET /pedidos y GET /pedidos/:id — pedido.controller.ts, pedido.service.ts (listarPorCliente), dominio/totales.ts",
         "app/pedidos/page.tsx, components/ui/OrderRow.tsx", "S2-PR-05, S2-PI-06, S2-PS-01"],
        ["HU-114 Consultar ventas (CU-09)", "GET /ventas — ventas.controller.ts, ventas.service.ts, dominio/ventas.ts, dto/consultar-ventas.dto.ts",
         "app/admin/ventas/page.tsx, components/PanelInterno.tsx", "S2-PR-01, PR-02, PI-03, PI-04, PS-03"],
        ["HU-115 Cancelar pedido (CU-10)", "POST /pedidos/:id/cancelar — pedido.controller.ts, pedido.service.ts (cancelar), dominio/pedido.ts (puedeCancelarse)",
         "app/pedidos/page.tsx (diálogo «Sí, cancelar pedido»)", "S2-PR-03, PI-01, PI-02, PI-05, PS-02"],
        ["HU-116 Ingresar como Coordinador (1.2.3)", "POST /cuenta/interno/login y GET /cuenta/interno/yo — cuenta.controller.ts, cuenta.service.ts, auth/acceso-interno.ts, auth/jwt-staff.strategy.ts, tabla staff_users (migración add_staff_users), prisma/seed-staff.ts",
         "app/admin/ingresar/page.tsx, app/admin/page.tsx, components/PanelInterno.tsx", "S2-PR-04, PI-07, PS-03, PS-04"],
    ], [1900, 3300, 2300, 1850])
    c.h2_("5.1 Pantallas de ejecución")
    c.p_("Las capturas salen de los recorridos en navegador real de e2e/capturas/verificar-sprint2.mjs y verificar-interno.mjs, "
         "ejecutados el 17 de noviembre de 2026 contra el frontend y el backend locales.")
    cap = [
        (DISENO / "verificacion-sprint2/01-mis-pedidos-1440.png", "Mis pedidos: solo el pedido sin pagar ofrece «Cancelar pedido»; el pagado explica por qué no."),
        (DISENO / "verificacion-sprint2/02-cancelar-confirmacion-1440.png", "Diálogo de confirmación de la cancelación."),
        (DISENO / "verificacion-sprint2/03-cancelar-resultado-1440.png", "Resultado: «Pedido cancelado»."),
        (DISENO / "verificacion-interno/01-ingreso-1440.png", "Ingreso del Coordinador en /admin/ingresar."),
        (DISENO / "verificacion-interno/02-ingreso-error-1440.png", "Clave equivocada: mensaje de error y no entra."),
        (DISENO / "verificacion-interno/04-ventas-1440.png", "Lista de ventas con filtros, total vendido y 20 filas por página."),
        (DISENO / "verificacion-interno/05-ventas-sin-resultados-1440.png", "Filtro sin ventas: «No hay ventas con esos filtros»."),
        (DISENO / "verificacion-interno/06-ventas-envio-1440.png", "«Ver envío»: dirección y teléfono para despachar."),
        (DISENO / "verificacion-interno/04-ventas-390.png", "La lista de ventas a 390 px de ancho (celular)."),
    ]
    for ruta, pie in cap:
        c.figura(ruta, pie, 14.5 if "390" not in ruta.name else 6.5)
    c.salto_pagina()

    # ------------------------------------------------------------- 6. Pruebas
    c.h1_("6. Pruebas del sistema")
    c.p_(f"Se definieron y ejecutaron {len(casos.CASOS)} casos de prueba para el sprint 2: {n_ruta} de ruta, {n_int} de integración y "
         f"{n_sis} de sistema. Las pruebas de ruta y de integración son automatizadas (Jest, PostgreSQL de pruebas) y las de sistema "
         "recorren el portal en un navegador real (Playwright). Cada caso usa la ficha del docente; la columna «Respuesta del sistema» "
         "es lo que devolvió la ejecución real del 17 de noviembre de 2026.")
    c.p_("Resumen de la ejecución completa del backend (todas las pruebas del proyecto, no solo las del sprint):", negrita=True)
    c.tabla(["Medida", "Resultado", "Fuente"], [
        ["Suites de prueba", f"{j['numPassedTestSuites']} de {j['numTotalTestSuites']} aprobadas", "jest --runInBand"],
        ["Pruebas", f"{j['numPassedTests']} de {j['numTotalTests']} aprobadas, {j['numFailedTests']} fallidas", "jest --runInBand"],
        ["Cobertura de sentencias", f"{cov['statements']['pct']:.2f} % ({cov['statements']['covered']} de {cov['statements']['total']})", "jest --coverage (src, sin specs ni módulos)"],
        ["Cobertura de ramas", f"{cov['branches']['pct']:.2f} % ({cov['branches']['covered']} de {cov['branches']['total']})", "jest --coverage"],
        ["Cobertura de funciones", f"{cov['functions']['pct']:.2f} % ({cov['functions']['covered']} de {cov['functions']['total']})", "jest --coverage"],
        ["Cobertura de líneas", f"{cov['lines']['pct']:.2f} % ({cov['lines']['covered']} de {cov['lines']['total']})", "jest --coverage"],
        ["Pruebas de sistema del sprint 2", f"{d['s2']['ok']} de {d['s2']['total']} comprobaciones", "e2e/capturas/verificar-sprint2.mjs"],
        ["Panel interno en navegador", f"{d['ok_int']} de {d['total_int']} comprobaciones", "e2e/capturas/verificar-interno.mjs"],
    ], [2900, 3300, 3150])
    titulos = {"ruta": "6.1 Pruebas de ruta (unidad)", "integración": "6.2 Pruebas de integración", "sistema": "6.3 Pruebas de sistema"}
    for tipo in ("ruta", "integración", "sistema"):
        c.salto_pagina()
        c.h1_(titulos[tipo])
        for k, caso in enumerate([x for x in casos.CASOS if x["tipo"] == tipo]):
            c.caso(caso, salto=k > 0)

    # ------------------------------------------------------------- 7. Usabilidad
    c.h1_("7. Evaluación de usabilidad (calidad en uso)")
    c.h2_("7.1 Marco y métricas")
    c.p_("La calidad en uso se evalúa con las tres medidas de ISO/IEC 9126-4 (equivalentes a ISO/IEC 25022) y los casos del material de clase "
         "«Métricas externas de usabilidad»:")
    c.tabla(["Medida", "Métrica y fórmula", "Meta", "Fuente de la meta"], [
        ["Efectividad", "Tareas completadas / tareas intentadas × 100, por tarea y por persona", "≥ 80 % por tarea", "TEST-017 y plan de calidad (M-07)"],
        ["Eficiencia", "Tiempo por tarea (s) y número de clics, comparados con la línea base del equipo", "Tiempo ≤ 3 × el tiempo del equipo", "TEST-017"],
        ["Satisfacción", "Pregunta de facilidad de uso (SEQ) de 1 (muy difícil) a 7 (muy fácil), una por tarea", "Promedio ≥ 5,0 (propuesta del equipo)", "Plan de calidad (M-08)"],
    ], [1400, 3800, 2000, 2150])
    c.h2_("7.2 Instrumentos")
    c.lista(["Guía del participante (docs/usabilidad/Guia_Participante_CU2_ComproYa.docx): consentimiento, datos de prueba y las tareas del caso de uso 2, con la escala de 1 a 7 debajo de cada tarea.",
             "Registro de medición (docs/usabilidad/Registro_Medicion_CU2_ComproYa.xlsx): una hoja por persona y tarea; calcula efectividad, eficiencia y satisfacción por caso y por tarea.",
             "Grabador de sesión (e2e/usabilidad/grabar-sesion.mjs): registra cada clic con su posición, el tiempo y los clics por tarea, la dificultad de 1 a 7, genera el mapa de calor y graba el video de la sesión."])
    c.h2_("7.3 Línea base del equipo (corrida guionada)")
    c.p_("La línea base se midió ejecutando cada tarea con un guion en el portal real (modelo de nivel de pulsación de Card, Moran y Newell, 1980, "
         "más la espera medida del sistema; archivo e2e/usabilidad/linea-base.json, generado el 2026-10-09). El tiempo objetivo de una persona nueva es el tiempo del equipo por 3. "
         "No es una medición con personas: sirve de referencia para juzgar a los participantes.")
    lb = json.loads((RAIZ.parent / "e2e/usabilidad/linea-base.json").read_text(encoding="utf-8"))["tareas"]
    tareas = [("T2", "Encontrar y agregar una licuadora al carrito", "T19"), ("T3", "Agregar un televisor por categorías", "T20"),
              ("T4", "Buscar un refrigerador y agregar 2 unidades", "T21"), ("T6", "Compra completa de una licuadora con envío y pago", "T07"),
              ("T7", "Compra de 2 televisores por categorías", "T08"), ("T8", "Compra de lavadora y licuadora", "T09"),
              ("T9", "Aplicar el código de descuento", "T25"), ("T10", "Quitar y volver a aplicar el descuento", "T26"),
              ("T11", "Descuento, datos de envío y pago con el televisor en el carrito", "T27")]
    filas = []
    for t, nombre, ref in tareas:
        r = lb[ref]
        filas.append([t, nombre, str(r["clics"]), str(r["teclas"]), f"{r['referenciaExpertoS']:.1f}".replace(".", ","), str(r["objetivoNovatoS"])])
    c.tabla(["Tarea", "Descripción", "Clics", "Teclas", "Tiempo del equipo (s)", "Tiempo objetivo (s)"], filas, [700, 4100, 800, 800, 1500, 1450])
    guion = sorted((RAIZ / "usabilidad/sesiones").glob("*.json")) if (RAIZ / "usabilidad/sesiones").exists() else []
    for f in guion:
        g = json.loads(f.read_text(encoding="utf-8"))
        if g.get("modo") != "guionado":
            continue
        carpeta_g = RAIZ / "usabilidad/sesiones" / f.stem
        c.p_(f"Corrida guionada grabada ({g['codigo']}, {g['fecha'][:10]}). {g['aviso']} El grabador de sesión ejecutó las tareas con Playwright, contó los clics de cada una y "
             "dibujó el mapa de calor de los clics sobre la pantalla; el video de la corrida queda en el equipo (no se sube al repositorio). Los tiempos son los de la "
             "automatización, no los de una persona.")
        c.tabla(["Tarea", "Completada", "Tiempo (s)", "Clics", "Clics de la línea base"], [
            [t["id"], "sí" if t["completada"] else "no", str(t["duracionS"]).replace(".", ","), str(t["clics"]),
             str({"T2": 2, "T3": 2, "T4": 4}.get(t["id"], "—"))] for t in g["tareas"]], [900, 1500, 1500, 1200, 3200])
        for t in g["tareas"][-1:]:
            png = carpeta_g / f"mapa-calor-{t['id']}.png"
            if png.exists():
                c.figura(png, f"Mapa de calor de los clics de la tarea {t['id']} en la corrida guionada automatizada (rojo: más clics). El panel muestra el contador de clics y el tiempo.", 14.5)
    c.h2_("7.4 Resultados con participantes")
    sesiones = sorted((RAIZ / "usabilidad/sesiones").glob("*.json")) if (RAIZ / "usabilidad/sesiones").exists() else []
    reales = []
    for f in sesiones:
        s = json.loads(f.read_text(encoding="utf-8"))
        if s.get("modo") == "participante":
            reales.append(s)
    if reales:
        filas = []
        for s in reales:
            ok = sum(1 for t in s["tareas"] if t.get("completada"))
            n = len(s["tareas"])
            dif = [t["dificultad"] for t in s["tareas"] if t.get("dificultad")]
            clics = sum(t["clics"] for t in s["tareas"])
            seg = sum(t["duracionS"] for t in s["tareas"])
            filas.append([s["codigo"], s["fecha"][:10], f"{ok} de {n} ({100 * ok / n:.0f} %)", str(clics), f"{seg:.0f}",
                          f"{sum(dif) / len(dif):.1f}".replace(".", ",") if dif else "—"])
        c.p_(f"Se aplicó la sesión a {len(reales)} participante(s). Cada fila sale del archivo de sesión grabado (docs/usabilidad/sesiones).")
        c.tabla(["Participante", "Fecha", "Efectividad", "Clics", "Tiempo total (s)", "Satisfacción (1–7)"], filas, [1400, 1400, 2200, 1000, 1700, 1650])
    else:
        c.p_("Estado: la sesión con participantes está pendiente. Las sesiones de los participantes P01 a P05 se registran con el grabador de "
             "sesión y sus archivos se guardan en docs/usabilidad/sesiones; al regenerar este documento (python docs/_generadores/build_entrega2.py) "
             "esta sección se llena sola con la efectividad, la eficiencia y la satisfacción medidas. Hasta entonces no se informa ningún "
             "resultado de participantes.")
    c.h2_("7.5 Conclusión")
    c.p_("Con la línea base, la compra completa (T6) exige 22 clics y unos 106 segundos al equipo, así que el tiempo objetivo para una persona "
         "nueva es de 320 segundos. La efectividad, la eficiencia y la satisfacción de los participantes se concluyen cuando se registren sus sesiones; "
         "las metas son las de la tabla 7.1.")
    c.salto_pagina()

    # ------------------------------------------------------------- Anexos
    c.h1_("Anexo A. Evidencia de ejecución")
    c.p_("Los archivos de evidencia están en docs/entrega-2/evidencia y se generaron con estos comandos:")
    c.lista(["cd backend && npx jest --runInBand --coverage — resultado por prueba (jest-completo.json) y cobertura (cobertura-resumen.json).",
             "cd e2e && node capturas/verificar-sprint2.mjs — sprint2-resultado.json y sprint2-resultado.md, con capturas en design/verificacion-sprint2.",
             "cd e2e && node capturas/verificar-interno.mjs — interno-resultado.md, con capturas en design/verificacion-interno."])
    c.p_("Resultado de las comprobaciones de sistema del sprint 2:", negrita=True)
    c.tabla(["Id", "Comprobación", "Resultado", "Detalle"], [[f["id"], f["nombre"], "OK" if f["ok"] else "FALLA", f["detalle"]] for f in d["s2"]["filas"]],
            [900, 4900, 900, 2650], tam=8)
    c.h1_("Anexo B. Matriz de trazabilidad")
    c.tabla(["Historia", "Caso de uso", "Regla", "Prueba de aceptación", "Casos de este entregable"], [
        ["HU-113", "CU-09", "Solo ve sus pedidos", "TEST-012", "S2-PR-05, PI-06, PS-01"],
        ["HU-114", "CU-09", "REQ-016", "TEST-012", "S2-PR-01, PR-02, PI-03, PI-04, PS-03"],
        ["HU-115", "CU-10", "RN-07", "TEST-013", "S2-PR-03, PI-01, PI-02, PI-05, PS-02"],
        ["HU-116", "1.2.3", "REQ-017", "TEST-007", "S2-PR-04, PI-07, PS-03, PS-04"],
    ], [1000, 1200, 2100, 2200, 2850])

    c.h1_("Anexo C. Soporte documental de los KPI de la gestión de la ejecución")
    c.p_("Los KPI de gobernanza, ingeniería de software y agilidad del documento de gestión de la ejecución "
         "(docs/ejecucion/Gestion_Ejecucion_ComproYa.docx) se calcularon con la documentación de este entregable, con corte al 17 de noviembre de 2026. "
         "Cada fila indica el cálculo con su resultado y el soporte donde está el dato: las secciones y anexos de este documento, los archivos de "
         "docs/entrega-2/evidencia, las mediciones propias de docs/ejecucion/soporte/kpi-medidas.json (arquitectura, configuración, npm audit, "
         "Jira y GitHub Actions) o los demás planes del proyecto. Un KPI «No medible» o «No aplica» se justifica en el documento de ejecución y no "
         "se estima.")
    K = ejecucion.definir(ejecucion.cargar())
    filas_kpi = []
    for pref, clave in (("GOB", "gob"), ("ING", "ing"), ("AGI", "agi")):
        for i, it in enumerate(K[clave], start=1):
            filas_kpi.append([f"{pref}-{i:02d} {it[0]}", it[1].replace("**", ""), it[2], it[3]])
    for i, (nombre, calculo, _nota) in enumerate(K["extra"], start=1):
        filas_kpi.append([f"ING-X{i} {nombre}", calculo.replace("**", ""), "docs/entrega-2/evidencia y docs/calidad", ejecucion.D])
    c.tabla(["Código y KPI", "Cálculo y resultado", "Soporte documental", "Responsable"], filas_kpi, [2000, 3500, 2750, 1100], tam=7.5)

    destino.parent.mkdir(parents=True, exist_ok=True)
    c.doc.save(str(destino))


if __name__ == "__main__":
    construir(Path(sys.argv[1]), Path(sys.argv[2]), SALIDA / "Segundo_Entregable_ComproYa.docx")
    print("listo", SALIDA)
