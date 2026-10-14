(function (root) {
  "use strict";
  const zone = "America/Santiago";
  const cacheKey = "sotofrau-uf-v1";
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
      if (validLatestRate(cached, today)) return (current = cached);
    } catch (_) { /* Storage may be blocked. */ }
    if (pending) return pending;
    pending = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await root.fetch("https://mindicador.cl/api/uf", { signal: controller.signal });
        if (!response.ok) throw new Error("UF unavailable");
        const data = await response.json();
        if (data.codigo !== "uf" || !Array.isArray(data.serie)) throw new Error("Invalid UF response");
        // Some dates, including non-business days, have no new UF value.
        // Show the date of the most recent published value used for conversion.
        const entry = data.serie.find(item =>
          typeof item.fecha === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(item.fecha) &&
          item.fecha.slice(0, 10) <= today &&
          Number.isFinite(item.valor) &&
          item.valor > 0
        );
        const rate = entry && { date: entry.fecha.slice(0, 10), value: entry.valor };
        if (!validLatestRate(rate, today)) throw new Error("UF unavailable");
        current = rate;
        try { root.localStorage.setItem(cacheKey, JSON.stringify(rate)); } catch (_) {}
        return rate;
      } finally { clearTimeout(timeout); }
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

  async function refresh() {
    let rate;
    try { rate = await fetchRate(); } catch (_) {}
    for (const [element, price] of targets) {
      if (!element.isConnected) { targets.delete(element); continue; }
      element.textContent = validLatestRate(rate, day()) ? equivalence(price, rate) : "Equivalencia no disponible · UF sin confirmar";
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
