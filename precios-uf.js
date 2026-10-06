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
    const match = text.trim().match(/^(Desde\s+)?(?:(UF|CLP|\$)\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)\s*(UF|CLP)?(\s+mensuales\.?)?$/i);
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

  async function fetchRate() {
    const today = day();
    if (validRate(current, today)) return current;
    try {
      const cached = JSON.parse(root.localStorage.getItem(cacheKey));
      if (validRate(cached, today)) return (current = cached);
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
        // The API date identifies the economic day; do not shift its midnight UTC to Chile.
        const entry = data.serie.find(item => typeof item.fecha === "string" && item.fecha.slice(0, 10) === today);
        const rate = entry && { date: today, value: entry.valor };
        if (!validRate(rate, today)) throw new Error("Today's UF unavailable");
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
      element.textContent = validRate(rate, day()) ? equivalence(price, rate) : "Equivalencia no disponible · UF del día sin confirmar";
    }
  }

  function propertyPrice(text, id) {
    // Owner confirmed property 36's bare amount is CLP; keep stored/displayed text intact.
    return parsePrice(text) || (String(id) === "36" ? parsePrice("CLP " + text) : null);
  }

  function mount(original, text, id) {
    const price = propertyPrice(text, id);
    if (!original || !price) return;
    const element = root.document.createElement("div");
    element.className = "price-equivalence";
    element.setAttribute("aria-live", "polite");
    element.textContent = "Consultando equivalencia UF del día…";
    original.insertAdjacentElement("afterend", element);
    targets.set(element, price);
    refresh();
  }

  const api = { mount, parsePrice, propertyPrice, day, equivalence, validRate, fetchRate, refresh };
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
