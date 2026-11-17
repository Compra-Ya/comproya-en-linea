"""Dibuja la red del proyecto y el diagrama de Gantt con la ruta crítica (Pillow, sin dependencias externas)."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import cronograma_modelo as m

FUENTE = "C:/Windows/Fonts/arial.ttf"
FUENTE_B = "C:/Windows/Fonts/arialbd.ttf"
ESC = 2

AZUL = (36, 99, 235)
AZUL_CLARO = (219, 234, 254)
ROJO = (220, 38, 38)
ROJO_CLARO = (254, 226, 226)
GRIS = (100, 116, 139)
GRIS_CLARO = (241, 245, 249)
VERDE = (22, 163, 74)
NARANJA = (234, 88, 12)
NEGRO = (15, 23, 42)


def f(tam: int, negrita: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FUENTE_B if negrita else FUENTE, tam * ESC)


def _t(d, xy, txt, fuente, color=NEGRO, anchor="la"):
    d.text((xy[0] * ESC, xy[1] * ESC), txt, font=fuente, fill=color, anchor=anchor)


def _r(d, x0, y0, x1, y1, fill=None, outline=None, w=1, r=6):
    d.rounded_rectangle([x0 * ESC, y0 * ESC, x1 * ESC, y1 * ESC], radius=r * ESC, fill=fill, outline=outline, width=int(w * ESC))


def _flecha(d, p0, p1, color=GRIS, w=1.5, discontinua=False):
    if discontinua:
        n = max(1, int(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) // 10))
        for i in range(0, n, 2):
            a = (p0[0] + (p1[0] - p0[0]) * i / n, p0[1] + (p1[1] - p0[1]) * i / n)
            b = (p0[0] + (p1[0] - p0[0]) * min(i + 1, n) / n, p0[1] + (p1[1] - p0[1]) * min(i + 1, n) / n)
            d.line([a[0] * ESC, a[1] * ESC, b[0] * ESC, b[1] * ESC], fill=color, width=int(w * ESC))
    else:
        d.line([p0[0] * ESC, p0[1] * ESC, p1[0] * ESC, p1[1] * ESC], fill=color, width=int(w * ESC))
    ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    for da in (math.radians(155), -math.radians(155)):
        q = (p1[0] + 8 * math.cos(ang + da), p1[1] + 8 * math.sin(ang + da))
        d.line([p1[0] * ESC, p1[1] * ESC, q[0] * ESC, q[1] * ESC], fill=color, width=int(w * ESC))


def _n1(x: float) -> str:
    return f"{x:.1f}".replace(".", ",")


def _ajustar(texto: str, fuente, ancho: float) -> list[str]:
    lineas, actual = [], ""
    for w in texto.split():
        prueba = (actual + " " + w).strip()
        if fuente.getlength(prueba) / ESC <= ancho:
            actual = prueba
        else:
            lineas.append(actual)
            actual = w
    if actual:
        lineas.append(actual)
    return lineas[:2]


def _fmt(h: float, fin: bool = False) -> str:
    return (m.fecha_fin(h) if fin else m.fecha_inicio(h)).strftime("%d/%m")


# ----------------------------------------------------------------------------- red
def dibujar_red(ruta: Path) -> None:
    lista = m.modelo()
    acts = {a.id: a for a in lista}
    W, H = 1500, 960
    img = Image.new("RGB", (W * ESC, H * ESC), "white")
    d = ImageDraw.Draw(img)
    _t(d, (W / 2, 20), "Red del proyecto — ComproYa en Línea (historias de usuario, dependencias y ruta crítica)", f(19, True), anchor="ma")
    _t(d, (W / 2, 48), "Cada historia de los sprints 2 y 3 encadena sus 6 subtareas de Jira: Modelado → Requerimientos → Diseño → Implementación → Pruebas → Entrega.",
       f(12), GRIS, anchor="ma")
    col = {1: (30, 470), 2: (530, 520), 3: (1070, 400)}
    for n, sp in m.SPRINTS.items():
        x0, w = col[n]
        _r(d, x0, 80, x0 + w, 138, fill=GRIS_CLARO, outline=GRIS, w=2)
        _t(d, (x0 + w / 2, 90), sp["nombre"], f(14, True), NEGRO, anchor="ma")
        _t(d, (x0 + w / 2, 113), f"{sp['inicio']:%d-%b} a {sp['fin']:%d-%b-%Y} · 10 días hábiles · 30 h por integrante", f(11), GRIS, anchor="ma")
        if n < 3:
            _flecha(d, (x0 + w, 109), (col[n + 1][0], 109), GRIS, 2.5)

    pos: dict[str, tuple[float, float, float, float]] = {}
    nw, nh = 138, 106

    def poner(hid: str, x: float, y: float) -> None:
        pos[hid] = (x, y, x + nw, y + nh)

    s1 = [h[0] for h in m.HISTORIAS if h[4] == 1]
    for i, hid in enumerate(s1):
        poner(hid, 40 + (i % 3) * (nw + 22), 165 + (i // 3) * (nh + 24))
    poner("HU-115", 545, 165)
    poner("HU-114", 545, 165 + nh + 70)
    poner("HU-116", 725, 165)
    poner("HU-113", 725, 165 + nh + 70)
    poner("HU-101", 1085, 165)
    poner("HU-117", 1250, 165)
    cx0, cy0 = 1085, 165 + nh + 70

    for (hid, jira, nombre, cu, sp, resp, deps) in m.HISTORIAS:  # dependencias técnicas del mismo sprint (sprints 2 y 3)
        for p in deps:
            if sp == 1 or m.POR_HU[p][4] != sp:
                continue
            a, b = pos[p], pos[hid]
            _flecha(d, ((a[0] + a[2]) / 2 + 20, a[3]), ((b[0] + b[2]) / 2 + 20, b[1]), GRIS)
    for resp, orden in m.ORDEN_RECURSO.items():  # dependencias de recurso del mismo sprint
        for a_id, b_id in zip(orden, orden[1:]):
            if m.POR_HU[a_id][4] == m.POR_HU[b_id][4]:
                a, b = pos[a_id], pos[b_id]
                _flecha(d, (a[0] + 30, a[3]), (b[0] + 30, b[1]), NARANJA, 1.8, True)

    for hid, (x0, y0, x1, y1) in pos.items():
        h = m.POR_HU[hid]
        hist = [a for a in lista if a.historia == hid]
        s1_ = h[4] == 1
        crit = any(a.critica for a in hist)
        _r(d, x0, y0, x1, y1, fill=ROJO_CLARO if crit else (GRIS_CLARO if s1_ else AZUL_CLARO), outline=ROJO if crit else (GRIS if s1_ else AZUL), w=2)
        _t(d, (x0 + 6, y0 + 5), f"{hid} · {h[3]}", f(11, True), ROJO if crit else (GRIS if s1_ else AZUL))
        y = y0 + 21
        for ln in _ajustar(h[2].split(" (")[0], f(10), nw - 12):
            _t(d, (x0 + 6, y), ln, f(10), NEGRO)
            y += 12
        _t(d, (x0 + 6, y + 1), f"Resp.: {m.CORTO[h[5]]}", f(10), GRIS)
        if s1_:
            _t(d, (x0 + 6, y + 14), "finalizada; horas no", f(9), GRIS)
            _t(d, (x0 + 6, y + 26), "registradas en Jira", f(9), GRIS)
        else:
            es, ef = m.span_historia(lista, hid)
            _t(d, (x0 + 6, y + 14), f"{_n1(m.horas_historia(lista, hid))} h · {_fmt(es)} a {_fmt(ef, True)}", f(10), GRIS)
            holg = min(a.holgura for a in hist)
            _t(d, (x0 + 6, y + 27), f"holgura {_n1(holg)} h" + (" · CRÍTICA" if crit else ""), f(9, True) if crit else f(9), ROJO if crit else GRIS)
            ext = [p for p in h[6] if m.POR_HU[p][4] != h[4]]
            if ext:
                _t(d, (x0 + 6, y0 + nh - 14), "pred.: " + ", ".join(ext), f(9), NARANJA)

    ac4 = acts["ACT-04"]
    _r(d, cx0, cy0, cx0 + 320, cy0 + 70, fill=ROJO_CLARO, outline=ROJO, w=2)
    _t(d, (cx0 + 8, cy0 + 6), "ACT-04 · Cierre del proyecto", f(12, True), ROJO)
    _t(d, (cx0 + 8, cy0 + 26), f"12 h-persona · {_fmt(ac4.es)} a {_fmt(ac4.ef, True)} · holgura 0 h · CRÍTICA", f(10), NEGRO)
    _t(d, (cx0 + 8, cy0 + 46), "Espera la Entrega de HU-101 y de HU-117 (supuesto del equipo)", f(9), GRIS)
    for hid, dx in (("HU-101", 60), ("HU-117", 250)):
        a = pos[hid]
        _flecha(d, ((a[0] + a[2]) / 2, a[3]), (cx0 + dx, cy0), GRIS)

    ly = H - 150
    _r(d, 30, ly, 1470, ly + 134, fill=GRIS_CLARO, outline=(203, 213, 225))
    _t(d, (44, ly + 8), "Leyenda:", f(12, True))
    _r(d, 120, ly + 7, 150, ly + 24, fill=ROJO_CLARO, outline=ROJO, w=2, r=3)
    _t(d, (158, ly + 8), "ruta crítica (holgura 0 h)", f(11))
    _r(d, 390, ly + 7, 420, ly + 24, fill=AZUL_CLARO, outline=AZUL, w=2, r=3)
    _t(d, (428, ly + 8), "con holgura (sprints 2 y 3)", f(11))
    _r(d, 690, ly + 7, 720, ly + 24, fill=GRIS_CLARO, outline=GRIS, w=2, r=3)
    _t(d, (728, ly + 8), "sprint 1 (ventana del sprint)", f(11))
    _flecha(d, (1000, ly + 16), (1040, ly + 16), GRIS)
    _t(d, (1048, ly + 8), "dependencia técnica", f(11))
    _flecha(d, (1000, ly + 38), (1040, ly + 38), NARANJA, 1.8, True)
    _t(d, (1048, ly + 30), "dependencia de recurso (una persona, una historia a la vez)", f(11))
    _t(d, (44, ly + 38), "pred.: (naranja) historia de un sprint anterior de la que depende; ya estaba terminada al empezar.", f(10), NARANJA)
    _t(d, (44, ly + 58), "Orden por integrante: Nicolás hace HU-115 → HU-114 → HU-101; Duván hace HU-116 → HU-113 → HU-117. Cada Sprint Review fija el fin de su sprint.", f(10), GRIS)
    _t(d, (44, ly + 76), "Ruta crítica: HU-115 y HU-114 (sprint 2, 30 h) y HU-117 con ACT-04 (sprint 3, 30 h); las demás historias tienen 4 a 5 h de holgura.", f(10), GRIS)
    _t(d, (44, ly + 94), "El sprint 1 se muestra como ventana del sprint: Jira no registró sus horas y no se inventan.", f(10), GRIS)
    _t(d, (44, ly + 112), "Dependencias técnicas del sprint 1 no se dibujan: sus 11 historias ya están finalizadas.", f(10), GRIS)
    img = img.resize((W, H), Image.LANCZOS)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img.save(ruta, optimize=True)


# ----------------------------------------------------------------------------- gantt
def dibujar_gantt(ruta: Path) -> None:
    acts = {a.id: a for a in m.modelo()}
    filas: list[tuple] = [
        ("ACT-01 Acta de constitución", "hito", [(0, 0, False)]),
        ("ACT-02 Plan de trabajo y backlog", "ger", [(acts["ACT-02"].es, acts["ACT-02"].ef, False)]),
        ("ACT-03 Seguimiento y control de sprints", "ger", [(acts["ACT-03"].es, acts["ACT-03"].ef, False)]),
        ("Sprint 1 · Flujo de compra (completado)", "sprint", [(0, 30, False)]),
    ]
    for h in m.HISTORIAS:
        if h[4] == 1:
            filas.append((f"   {h[0]} {h[2].split(' (')[0][:34]}", "ventana", [(0, 30, False)]))
    codigos = [c for c, _ in m.FASES]
    for n, orden in ((2, ["HU-115", "HU-114", "HU-116", "HU-113"]), (3, ["HU-117", "HU-101"])):
        filas.append((m.SPRINTS[n]["nombre"], "sprint", [(m.SPRINTS[n]["ini_h"], m.SPRINTS[n]["fin_h"], False)]))
        for hid in orden:
            segs = []
            for cod in codigos:
                a = acts[f"SCRUM-{m.SUBTAREAS[hid][0] + codigos.index(cod)}"]
                segs.append((a.es, a.ef, a.critica))
            filas.append((f"   {hid} {m.POR_HU[hid][2].split(' (')[0][:28]} ({m.CORTO[m.POR_HU[hid][5]]})", "hist", segs))
    filas.append(("ACT-04 Cierre del proyecto", "cierre", [(acts["ACT-04"].es, acts["ACT-04"].ef, True)]))

    dias = 30
    izq, ancho_dia, alto, top = 390, 26, 24, 118
    W = izq + dias * ancho_dia + 30
    H = top + len(filas) * alto + 80
    img = Image.new("RGB", (W * ESC, H * ESC), "white")
    d = ImageDraw.Draw(img)
    _t(d, (16, 12), "Cronograma del proyecto — ComproYa en Línea (19-oct a 27-nov de 2026)", f(18, True))
    _t(d, (16, 40), "Calendario del equipo: lunes a viernes, 3 h por día y 10 días hábiles por sprint. Rojo: ruta crítica; azul: trabajo con holgura; gris: sprint 1 (ventana).",
       f(11), GRIS)

    def px(h: float) -> float:
        return izq + h / m.HORAS_POR_DIA * ancho_dia

    for n, colr in ((1, (239, 246, 255)), (2, (254, 252, 232)), (3, (240, 253, 244))):
        x0, x1 = px(m.SPRINTS[n]["ini_h"]), px(m.SPRINTS[n]["fin_h"])
        d.rectangle([x0 * ESC, (top - 4) * ESC, x1 * ESC, (top + len(filas) * alto) * ESC], fill=colr)
        _t(d, ((x0 + x1) / 2, top - 56), f"Sprint {n}", f(11, True), GRIS, anchor="ma")
    for i, dia in enumerate(m.CALENDARIO[:dias]):
        x = izq + i * ancho_dia
        d.line([x * ESC, (top - 4) * ESC, x * ESC, (top + len(filas) * alto) * ESC], fill=(226, 232, 240), width=ESC)
        if dia.weekday() == 0 or i == 0:
            _t(d, (x + 2, top - 38), f"{dia:%d-%b}", f(10, True), GRIS)
        _t(d, (x + ancho_dia / 2, top - 20), "LMXJV"[dia.weekday()], f(10), GRIS, anchor="ma")
    for r, (etq, tipo, segs) in enumerate(filas):
        y = top + r * alto
        if r % 2 == 0:
            d.rectangle([0, y * ESC, (izq - 4) * ESC, (y + alto) * ESC], fill=(250, 250, 252))
        _t(d, (10, y + 5), etq[:62], f(11, tipo in ("sprint", "cierre")), NEGRO)
        for (es, ef, crit) in segs:
            if tipo == "hito":
                cx = px(es)
                d.polygon([(cx * ESC, (y + 4) * ESC), ((cx + 9) * ESC, (y + 12) * ESC), (cx * ESC, (y + 20) * ESC), ((cx - 9) * ESC, (y + 12) * ESC)], fill=ROJO)
                continue
            color = {"sprint": (148, 163, 184), "ventana": (148, 163, 184), "ger": VERDE}.get(tipo, ROJO if crit else AZUL)
            alto_b = 8 if tipo == "sprint" else 14
            y0 = y + (8 if tipo == "sprint" else 5)
            d.rectangle([px(es) * ESC, y0 * ESC, (px(ef) - 1) * ESC, (y0 + alto_b) * ESC], fill=color)
    yb = top + len(filas) * alto + 12
    _t(d, (10, yb), "Entregas del Aula virtual: requisitos 10-nov · cronograma 18-nov · calidad, segundo entregable y ejecución 24-nov. Jira: sprint 2 cerrado el 17-nov.", f(11), GRIS)
    _t(d, (10, yb + 20), "Horas en Jira: sprint 2, 56 h · sprint 3, 43 h (99 h en 36 subtareas) más 12 h de cierre (supuesto); el sprint 1 no tiene horas registradas.", f(11), GRIS)
    x24 = px((m.INDICE[m.CALENDARIO[26]] + 1) * 3)
    d.line([x24 * ESC, (top - 4) * ESC, x24 * ESC, (top + len(filas) * alto) * ESC], fill=NARANJA, width=2 * ESC)
    _t(d, (x24, top + len(filas) * alto + 1), "24-nov", f(10, True), NARANJA, anchor="ma")
    img = img.resize((W, H), Image.LANCZOS)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img.save(ruta, optimize=True)


if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent / "cronograma" / "img"
    dibujar_red(base / "Red_del_Proyecto_ComproYa.png")
    dibujar_gantt(base / "Gantt_ComproYa.png")
    print("ok", base)
