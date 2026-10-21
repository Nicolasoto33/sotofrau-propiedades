(function (root) {
  "use strict";
  const zone = "America/Santiago";
  const cacheKey = "sotofrau-uf-v4";
  let published = {};
  const targets = new Map();
  let pending;
  let current;

  function day(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const part = type => parts.find(p => p.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }

  // Chilean notation: dots group thousands and commas separate decimals.
  // Bare amounts are deliberately excluded because their currency is unknown.
  function parsePrice(text) {
    if (typeof text !== "string") return null;
    const match = text.trim().match(/^(Desde\s+)?(?:(UF|CLP|\$)\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)\s*(UF|CLP)?(\s+mensuales)?\.?$/i);
    if (!match) return null;
    const currencies = [match[2], match[4]].filter(Boolean).map(c => c.toUpperCase() === "$" ? "CLP" : c.toUpperCase());
    if (!currencies.length || currencies.some(c => c !== currencies[0])) return null;
    const amount = Number(match[3].replace(/\./g, "").replace(",", "."));
    return Number.isFinite(amount) && amount > 0
      ? { amount, currency: currencies[0], from: !!match[1], monthly: !!match[5] } : null;
  }

  function validRate(rate, date) {
    return rate && rate.date === date && Number.isFinite(rate.value) && rate.value > 0;
  }

  function validLatestRate(rate, today = day()) {
    return rate && /^\d{4}-\d{2}-\d{2}$/.test(rate.date) &&
      rate.date === today && Number.isFinite(rate.value) && rate.value > 0;
  }

  function readSeries(data, source) {
    if (!data || (data.indicador !== "uf" && data.codigo !== "uf")) throw new Error("Invalid UF response");
    const rows = Array.isArray(data.serie) ? data.serie.concat(data) : [data];
    for (const item of rows) {
      const date = String(item.fecha || "").slice(0, 10);
      const value = Number(item.valor);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(value) && value > 0) {
        published[date] = { date, value, source };
      }
    }
  }

  async function fetchRate() {
    const today = day();
    if (validLatestRate(current, today)) return current;
    try {
      const cached = JSON.parse(root.localStorage.getItem(cacheKey));
      if (cached && typeof cached === "object") published = { ...cached, ...published };
    } catch (_) { /* Storage may be blocked. */ }
    if (validLatestRate(published[today], today)) return (current = published[today]);
    if (pending) return pending;
    pending = (async () => {
      // The annual series includes future dates already published by the SII.
      // Never estimate tomorrow's UF from yesterday's value.
      const providers = [
        ["https://indicadores.cl/api/v1/historico/uf/" + today.slice(0, 4) + ".json", "indicadores.cl"],
        ["https://mindicador.cl/api/uf", "mindicador.cl"],
        ["https://indicadores.cl/api/v1/uf.json", "indicadores.cl"]
      ];
      let lastError;
      for (const [url, source] of providers) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await root.fetch(url + "?ts=" + Date.now(), { signal: controller.signal, cache: "no-store" });
          if (!response.ok) throw new Error("UF unavailable");
          readSeries(await response.json(), source);
          // Retain only this month and upcoming published dates, bounded to 62 days.
          const limit = new Date(Date.now() + 62 * 86400000).toISOString().slice(0, 10);
          published = Object.fromEntries(Object.entries(published).filter(([date]) => date >= today && date <= limit));
          const rate = published[day()];
          if (!validLatestRate(rate, day())) throw new Error("UF del día no disponible");
          current = rate;
          try { root.localStorage.setItem(cacheKey, JSON.stringify(published)); } catch (_) {}
          return rate;
        } catch (error) { lastError = error; }
        finally { clearTimeout(timeout); }
      }
      throw lastError || new Error("UF unavailable");
    })();
    try { return await pending; } finally { pending = null; }
  }

  function officialLink() {
    return "https://www.sii.cl/valores_y_fechas/uf/uf" + day().slice(0, 4) + ".htm";
  }

  function equivalence(price, rate) {
    const value = price.currency === "UF" ? price.amount * rate.value : price.amount / rate.value;
    const formatted = new Intl.NumberFormat("es-CL", {
      minimumFractionDigits: price.currency === "UF" ? 0 : 2,
      maximumFractionDigits: price.currency === "UF" ? 0 : 2
    }).format(value);
    const date = rate.date.split("-").reverse().join("/");
    return `${price.from ? "Desde " : ""}≈ ${price.currency === "UF" ? "$" + formatted + " CLP" : formatted + " UF"}${price.monthly ? " mensuales" : ""} · UF del ${date}`;
  }

  function renderEquivalence(element, price, rate) {
    const text = equivalence(price, rate);
    const marker = " · UF del ";
    const dateStart = text.lastIndexOf(marker);
    if (dateStart < 0) {
      element.textContent = text;
      return;
    }
    element.replaceChildren(
      root.document.createTextNode(text.slice(0, dateStart) + marker)
    );
    const date = text.slice(dateStart + marker.length);
    const dateLink = root.document.createElement("a");
    dateLink.href = officialLink();
    dateLink.target = "_blank";
    dateLink.rel = "noopener noreferrer";
    dateLink.title = "Consultar UF oficial en el SII. Datos: " + rate.source;
    dateLink.textContent = date;
    element.appendChild(dateLink);
  }

  async function refresh() {
    let rate;
    try { rate = await fetchRate(); } catch (_) {}
    for (const [element, price] of targets) {
      if (!element.isConnected) { targets.delete(element); continue; }
      if (validLatestRate(rate, day())) renderEquivalence(element, price, rate);
      else element.textContent = "Equivalencia no disponible · UF sin confirmar";
    }
  }

  function propertyPrice(text, id) {
    // Owner confirmed property 36's bare amount is CLP; keep stored/displayed text intact.
    const value = String(text ?? "").trim();
    if (String(id) === "36" && /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?$/.test(value)) {
      return parsePrice("CLP " + value);
    }
    return parsePrice(value);
  }

  function mount(original, text, id, options = {}) {
    const price = propertyPrice(text, id);
    const operation = String(options.operation || "").toLowerCase();
    if (!original || !price || (options.salesOnly && operation !== "venta")) return;
    const element = root.document.createElement("div");
    element.className = "price-equivalence";
    element.setAttribute("aria-live", "polite");
    element.textContent = "Consultando equivalencia UF…";
    original.insertAdjacentElement("afterend", element);
    targets.set(element, price);
    refresh();
  }

  function bind(element, text, id) {
    const price = propertyPrice(text, id);
    if (!element || !price) return;
    element.style.display = "block";
    targets.set(element, price);
    refresh();
  }

  const api = { bind, mount, parsePrice, propertyPrice, day, equivalence, validRate, validLatestRate, fetchRate, refresh };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.PreciosUF = api;
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", refresh);
    else refresh();
    root.addEventListener("online", refresh);
    // Refresh on return to the page and across midnight without a new deployment.
    root.document.addEventListener("visibilitychange", () => {
      if (!root.document.hidden && targets.size) refresh();
    });
    root.setInterval(() => { if (!root.document.hidden && targets.size) refresh(); }, 60000);
  }
})(typeof window !== "undefined" ? window : globalThis);
