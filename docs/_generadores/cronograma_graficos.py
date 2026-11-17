"""Dibuja la red del proyecto y el diagrama de Gantt con la ruta crítica (Pillow, sin dependencias externas)."""
from __future__ import annotations

import datetime as dt
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import cronograma_modelo as m

FUENTE = "C:/Windows/Fonts/arial.ttf"
FUENTE_B = "C:/Windows/Fonts/arialbd.ttf"
ESC = 2  # factor de escala para nitidez

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


def _texto(d: ImageDraw.ImageDraw, xy, txt, fuente, color=NEGRO, anchor="la"):
    d.text((xy[0] * ESC, xy[1] * ESC), txt, font=fuente, fill=color, anchor=anchor)


def _rect(d, x0, y0, x1, y1, fill=None, outline=None, w=1, r=6):
    d.rounded_rectangle([x0 * ESC, y0 * ESC, x1 * ESC, y1 * ESC], radius=r * ESC, fill=fill, outline=outline,
                        width=w * ESC)


def _flecha(d, p0, p1, color=GRIS, w=1.5):
    d.line([p0[0] * ESC, p0[1] * ESC, p1[0] * ESC, p1[1] * ESC], fill=color, width=int(w * ESC))
    import math
    ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    L = 8
    for da in (math.radians(155), -math.radians(155)):
        q = (p1[0] + L * math.cos(ang + da), p1[1] + L * math.sin(ang + da))
        d.line([p1[0] * ESC, p1[1] * ESC, q[0] * ESC, q[1] * ESC], fill=color, width=int(w * ESC))


def _fmt(x: float) -> str:
    return f"{x:.1f}".replace(".", ",")


# ----------------------------------------------------------------------------- red
def _niveles(sprint: int) -> list[list[str]]:
    """Niveles (filas) de las historias de un sprint según sus dependencias dentro del mismo sprint."""
    hs = {h[0]: h for h in m.HISTORIAS if h[4] == sprint}
    nivel: dict[str, int] = {}

    def n(hid: str) -> int:
        if hid not in nivel:
            ps = [p for p in hs[hid][7] if p in hs]
            nivel[hid] = 0 if not ps else 1 + max(n(p) for p in ps)
        return nivel[hid]

    for hid in hs:
        n(hid)
    filas: list[list[str]] = [[] for _ in range(max(nivel.values()) + 1)]
    for hid in hs:  # respeta el orden de la lista de historias
        filas[nivel[hid]].append(hid)
    return filas


def _ajustar(texto: str, fuente, ancho_px: float) -> list[str]:
    palabras, lineas, actual = texto.split(), [], ""
    for w in palabras:
        prueba = (actual + " " + w).strip()
        if fuente.getlength(prueba) / ESC <= ancho_px:
            actual = prueba
        else:
            lineas.append(actual)
            actual = w
    if actual:
        lineas.append(actual)
    return lineas[:2]


def dibujar_red(ruta: Path) -> None:
    acts = {a.id: a for a in m.modelo()}
    hist = {h[0]: h for h in m.HISTORIAS}
    niveles = {n: _niveles(n) for n in (1, 2, 3)}
    nodo_w, nodo_h, sep_y = 138, 96, 38
    col_x = {1: 30, 2: 540, 3: 1010}
    col_w = {1: 470, 2: 440, 3: 450}
    filas_max = max(len(v) for v in niveles.values())
    H = 190 + filas_max * (nodo_h + sep_y) + 110
    W = 1500
    img = Image.new("RGB", (W * ESC, H * ESC), "white")
    d = ImageDraw.Draw(img)

    _texto(d, (W / 2, 20), "Red del proyecto — ComproYa en Línea (nivel de historias de usuario)", f(20, True), anchor="ma")
    _texto(d, (W / 2, 50), "Cada historia encadena Requerimientos → Modelado → Diseño → Implementación → Pruebas → Entrega. "
                           "Rojo: ruta crítica del proyecto (cajas de tiempo de los sprints).", f(12), GRIS, anchor="ma")
    for n, sp in m.SPRINTS.items():
        a = acts[f"TB{n}"]
        _rect(d, col_x[n], 84, col_x[n] + col_w[n], 144, fill=ROJO_CLARO, outline=ROJO, w=2)
        _texto(d, (col_x[n] + col_w[n] / 2, 94), sp["nombre"], f(14, True), ROJO, anchor="ma")
        _texto(d, (col_x[n] + col_w[n] / 2, 116),
               f"{sp['inicio']:%d-%b} a {sp['fin']:%d-%b-%Y} · {int(a.duracion)} días hábiles · holgura 0",
               f(11), NEGRO, anchor="ma")
        if n < 3:
            _flecha(d, (col_x[n] + col_w[n], 114), (col_x[n + 1], 114), ROJO, 3)

    pos: dict[str, tuple[float, float, float, float]] = {}
    for n in (1, 2, 3):
        for r, fila in enumerate(niveles[n]):
            ancho_total = col_w[n]
            hueco = (ancho_total - len(fila) * nodo_w) / (len(fila) + 1)
            for k, hid in enumerate(fila):
                x0 = col_x[n] + hueco + k * (nodo_w + hueco)
                y0 = 170 + r * (nodo_h + sep_y)
                pos[hid] = (x0, y0, x0 + nodo_w, y0 + nodo_h)

    # flechas solo dentro del mismo sprint
    for h in m.HISTORIAS:
        for p in h[7]:
            if hist[p][4] != h[4]:
                continue
            x0, y0, x1, y1 = pos[p]
            a0, b0, a1, b1 = pos[h[0]]
            _flecha(d, ((x0 + x1) / 2 + (a0 - x0) * 0.08, y1), ((a0 + a1) / 2 - (a0 - x0) * 0.08, b0), GRIS)

    for hid, (x0, y0, x1, y1) in pos.items():
        h = hist[hid]
        horas = sum(acts[f"{hid}-{c}"].horas for c, _ in m.FASES)
        holg = min(acts[f"{hid}-{c}"].holgura for c, _ in m.FASES)
        _rect(d, x0, y0, x1, y1, fill=AZUL_CLARO, outline=AZUL, w=2)
        _texto(d, (x0 + 6, y0 + 5), f"{hid} · {h[3]}", f(11, True), AZUL)
        y = y0 + 22
        for ln in _ajustar(h[2].split(" (")[0], f(10), nodo_w - 12):
            _texto(d, (x0 + 6, y), ln, f(10), NEGRO)
            y += 12
        _texto(d, (x0 + 6, y + 1), f"{_fmt(horas)} h · {h[5].split()[0]}", f(10), GRIS)
        _texto(d, (x0 + 6, y + 14), f"holgura mín. {_fmt(holg)} d", f(9), GRIS)
        externas = [p for p in h[7] if hist[p][4] != h[4]]
        if externas:
            _texto(d, (x0 + 6, y + 26), "pred.: " + ", ".join(externas), f(9), NARANJA)

    ly = H - 84
    _rect(d, 30, ly, 1470, ly + 70, fill=GRIS_CLARO, outline=(203, 213, 225))
    _texto(d, (44, ly + 8), "Leyenda:", f(12, True))
    _rect(d, 120, ly + 7, 150, ly + 24, fill=AZUL_CLARO, outline=AZUL, w=2, r=3)
    _texto(d, (158, ly + 8), "historia de usuario (HU), su caso de uso o paquete, horas y responsable", f(11))
    _rect(d, 650, ly + 7, 680, ly + 24, fill=ROJO_CLARO, outline=ROJO, w=2, r=3)
    _texto(d, (688, ly + 8), "caja de tiempo del sprint (ruta crítica, holgura 0)", f(11))
    _flecha(d, (1030, ly + 16), (1068, ly + 16), GRIS)
    _texto(d, (1076, ly + 8), "dependencia fin–inicio (mismo sprint)", f(11))
    _texto(d, (44, ly + 30), "pred.: (naranja) dependencia con historias de un sprint anterior, ya terminadas cuando empieza la historia.",
           f(10), NARANJA)
    _texto(d, (44, ly + 48), "El método de la ruta crítica (CPM) no nivela la carga de los dos integrantes; las horas por fase salen de Jira "
                             "(sprints 2 y 3) y se reconstruyen para el sprint 1.", f(10), GRIS)
    img = img.resize((W, H), Image.LANCZOS)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img.save(ruta, optimize=True)


# ----------------------------------------------------------------------------- gantt
def dibujar_gantt(ruta: Path) -> None:
    acts = m.modelo()
    por_id = {a.id: a for a in acts}
    filas: list[tuple[str, str, float, float, str]] = []  # etiqueta, rol, es, ef, color

    filas.append(("Gerencia · G-01 Acta, alcance y declaración (1.5.1)", "G", por_id["G-01"].es, por_id["G-01"].ef, "g"))
    for n in (1, 2, 3):
        a = por_id[f"TB{n}"]
        filas.append((a.nombre.split(" (")[0], "TB", a.es, a.ef, "c"))
        for h in m.HISTORIAS:
            if h[4] != n:
                continue
            fases = [por_id[f"{h[0]}-{c}"] for c, _ in m.FASES]
            es, ef = min(x.es for x in fases), max(x.ef for x in fases)
            filas.append((f"  {h[0]} {h[2].split(" (")[0][:40]}", "H", es, ef, "w"))
        if n == 2:
            for gid in ("G-02", "G-03"):
                g = por_id[gid]
                filas.append((f"Gerencia · {g.nombre.split(' — ')[0]}", "G", g.es, g.ef, "g"))
    for gid in ("G-04", "G-05", "G-06"):
        g = por_id[gid]
        filas.append((f"Gerencia · {g.nombre.split(' — ')[0][:52]}", "G", g.es, g.ef, "g"))
    filas.append(("Cierre del proyecto (1.5.4) — 27-nov-2026", "M", por_id["CIE"].es, por_id["CIE"].ef, "c"))

    n_dias = 30
    izq, ancho_dia, alto = 430, 26, 24
    top = 110
    W = izq + n_dias * ancho_dia + 30
    H = top + len(filas) * alto + 90
    img = Image.new("RGB", (W * ESC, H * ESC), "white")
    d = ImageDraw.Draw(img)
    _texto(d, (16, 12), "Cronograma del proyecto — ComproYa en Línea (19-oct a 27-nov de 2026)", f(18, True))
    _texto(d, (16, 40), "Calendario: lunes a viernes, 10 días hábiles por sprint (festivos 02-nov y 16-nov registrados como riesgo). "
                        "Rojo: ruta crítica; azul: trabajo con holgura; verde: gerencia.", f(11), GRIS)

    # encabezado de semanas y días
    dias = m.CALENDARIO[:n_dias]
    for i, dia in enumerate(dias):
        x = izq + i * ancho_dia
        if dia.weekday() == 0 or i == 0:
            _texto(d, (x + 2, top - 36), f"{dia:%d-%b}", f(10, True), GRIS)
        _texto(d, (x + ancho_dia / 2, top - 18), "LMXJV"[dia.weekday()], f(10), GRIS, anchor="ma")
        d.line([x * ESC, (top - 4) * ESC, x * ESC, (top + len(filas) * alto) * ESC], fill=(226, 232, 240), width=ESC)
    # sprints como fondo
    ini_sp = {1: 0, 2: 10, 3: 20}
    fin_sp = {1: 10, 2: 20, 3: 30}
    for n, col in ((1, (239, 246, 255)), (2, (254, 252, 232)), (3, (240, 253, 244))):
        x0, x1 = izq + ini_sp[n] * ancho_dia, izq + fin_sp[n] * ancho_dia
        d.rectangle([x0 * ESC, (top - 4) * ESC, x1 * ESC, (top + len(filas) * alto) * ESC], fill=col)
        _texto(d, ((x0 + x1) / 2, top - 52), f"Sprint {n}", f(11, True), GRIS, anchor="ma")
    for i, dia in enumerate(dias):  # líneas verticales sobre el fondo
        x = izq + i * ancho_dia
        d.line([x * ESC, (top - 4) * ESC, x * ESC, (top + len(filas) * alto) * ESC], fill=(226, 232, 240), width=ESC)

    colores = {"c": ROJO, "w": AZUL, "g": VERDE}
    for r, (etq, rol, es, ef, col) in enumerate(filas):
        y = top + r * alto
        if r % 2 == 0:
            d.rectangle([0, y * ESC, izq * ESC - 2, (y + alto) * ESC], fill=(250, 250, 252))
        _texto(d, (10, y + 5), etq[:60], f(11, rol in ("TB", "M")), NEGRO)
        x0 = izq + es * ancho_dia
        x1 = izq + max(ef, es + 0.15) * ancho_dia
        if rol == "M":
            cx = izq + ef * ancho_dia
            d.polygon([(cx * ESC, (y + 4) * ESC), ((cx + 9) * ESC, (y + 12) * ESC), (cx * ESC, (y + 20) * ESC),
                       ((cx - 9) * ESC, (y + 12) * ESC)], fill=ROJO)
        else:
            _rect(d, x0, y + 5, x1, y + 19, fill=colores[col], r=3)

    # hito FS1.. y entregas académicas
    yb = top + len(filas) * alto + 12
    _texto(d, (10, yb), "Entregas académicas (Aula virtual): requisitos 10-nov · cronograma 18-nov · calidad, segundo entregable y "
                        "ejecución 24-nov.", f(11), GRIS)
    _texto(d, (10, yb + 20), "Horas de trabajo planificadas: S1 60 h (reconstruidas) · S2 56 h · S3 43 h = 159 h-persona; "
                             "1 día de un integrante = 3 horas.", f(11), GRIS)
    # líneas de entrega
    for dia, txt in ((dt.date(2026, 11, 24), "24-nov"),):
        i = m.INDICE[dia]
        x = izq + (i + 1) * ancho_dia
        d.line([x * ESC, (top - 4) * ESC, x * ESC, (top + len(filas) * alto) * ESC], fill=NARANJA, width=2 * ESC)
        _texto(d, (x, top + len(filas) * alto + 2), "24-nov", f(10, True), NARANJA, anchor="ma")
    img = img.resize((W, H), Image.LANCZOS)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img.save(ruta, optimize=True)


if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent / "cronograma" / "img"
    dibujar_red(base / "Red_del_Proyecto_ComproYa.png")
    dibujar_gantt(base / "Gantt_ComproYa.png")
    print("ok", base)
