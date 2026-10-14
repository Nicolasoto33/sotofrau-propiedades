(function (root) {
  "use strict";
  const zone = "America/Santiago";
  const cacheKey = "sotofrau-uf-v2";
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
      rate.date <= today && Number.isFinite(rate.value) && rate.value > 0;
  }

  async function fetchRate() {
    const today = day();
    if (validLatestRate(current, today)) return current;
    try {
      const cached = JSON.parse(root.localStorage.getItem(cacheKey));
      if (validLatestRate(cached, today) && cached.source) return (current = cached);
    } catch (_) { /* Storage may be blocked. */ }
    if (pending) return pending;
    pending = (async () => {
      const providers = [
        async signal => {
          const response = await root.fetch("https://indicadores.cl/api/v1/uf.json", { signal });
          if (!response.ok) throw new Error("UF unavailable");
          const data = await response.json();
          const rate = data && data.indicador === "uf"
            ? { date: data.fecha, value: Number(data.valor), source: "indicadores.cl" }
            : null;
          if (!validLatestRate(rate, today)) throw new Error("Invalid UF response");
          return rate;
        },
        async signal => {
          const response = await root.fetch("https://mindicador.cl/api/uf", { signal });
          if (!response.ok) throw new Error("UF unavailable");
          const data = await response.json();
          if (data.codigo !== "uf" || !Array.isArray(data.serie)) throw new Error("Invalid UF response");
          const entry = data.serie.find(item => {
            const date = typeof item.fecha === "string" && item.fecha.match(/^(\d{4}-\d{2}-\d{2})(?:T.*)?$/);
            return date && date[1] <= today && Number.isFinite(Number(item.valor)) && Number(item.valor) > 0;
          });
          const rate = entry && {
            date: entry.fecha.slice(0, 10),
            value: Number(entry.valor),
            source: "mindicador.cl"
          };
          if (!validLatestRate(rate, today)) throw new Error("UF unavailable");
          return rate;
        }
      ];
      let lastError;
      for (const provider of providers) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const rate = await provider(controller.signal);
          current = rate;
          try { root.localStorage.setItem(cacheKey, JSON.stringify(rate)); } catch (_) {}
          return rate;
        } catch (error) {
          lastError = error;
        } finally {
          clearTimeout(timeout);
        }
      }
      throw lastError || new Error("UF unavailable");
    })();
    try { return await pending; } finally { pending = null; }
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
    dateLink.href = rate.source === "mindicador.cl"
      ? "https://mindicador.cl/"
      : "https://indicadores.cl/api/";
    dateLink.target = "_blank";
    dateLink.rel = "noopener noreferrer";
    dateLink.title = "Consultar el valor UF usado";
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

  const api = { mount, parsePrice, propertyPrice, day, equivalence, validRate, validLatestRate, fetchRate, refresh };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.PreciosUF = api;
    // Refresh on return to the page and across midnight without a new deployment.
    root.document.addEventListener("visibilitychange", () => {
      if (!root.document.hidden && targets.size) refresh();
    });
    root.setInterval(() => { if (!root.document.hidden && targets.size) refresh(); }, 60000);
  }
})(typeof window !== "undefined" ? window : globalThis);
