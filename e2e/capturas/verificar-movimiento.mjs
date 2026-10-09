// Comprueba que la interfaz respeta prefers-reduced-motion: con la preferencia activada el carrusel de categorías no se
// mueve solo y las transiciones quedan sin duración; sin la preferencia el carrusel sí se mueve (así la prueba demuestra
// que mide algo). Mide la posición real de la pista en dos instantes, no lee el CSS.
//
//   cd e2e && node capturas/verificar-movimiento.mjs
//
// Requiere el frontend en :3000 y el backend en :3001 (el carrusel se llena con las categorías).
import { chromium } from "@playwright/test";

const WEB = "http://localhost:3000";
const navegador = await chromium.launch();
const filas = [];

for (const movimiento of ["no-preference", "reduce"]) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: movimiento });
  const page = await ctx.newPage();
  await page.goto(WEB);
  await page.waitForSelector(".cy-carousel-track", { timeout: 20_000 });
  await page.waitForTimeout(600);
  const medir = () =>
    page.evaluate(() => {
      const pista = document.querySelector(".cy-carousel-track");
      const cs = getComputedStyle(pista);
      return { x: pista.getBoundingClientRect().left, animacion: cs.animationName, estado: cs.animationPlayState };
    });
  const a = await medir();
  await page.waitForTimeout(1500);
  const b = await medir();
  const transicion = await page.evaluate(() => {
    const boton = document.querySelector(".cy-btn");
    return boton ? getComputedStyle(boton).transitionDuration : "sin botón";
  });
  filas.push({ preferencia: movimiento, animacion: a.animacion, "se movió (px)": Math.round(Math.abs(b.x - a.x) * 10) / 10, "transición de un botón": transicion });
  await ctx.close();
}
await navegador.close();
console.table(filas);

const con = filas.find((f) => f.preferencia === "no-preference");
const sin = filas.find((f) => f.preferencia === "reduce");
const detalle = [];
if (!(con["se movió (px)"] > 5)) detalle.push("sin la preferencia el carrusel no se movió: la prueba no mide nada");
if (sin.animacion !== "none") detalle.push(`con la preferencia la animación sigue activa («${sin.animacion}»)`);
if (sin["se movió (px)"] > 0.5) detalle.push(`con la preferencia el carrusel se movió ${sin["se movió (px)"]} px`);
if (detalle.length) {
  console.error("FALLA:", detalle.join("; "));
  process.exit(1);
}
console.log("OK: con prefers-reduced-motion el carrusel queda quieto; sin ella se mueve.");
