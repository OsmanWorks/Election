const feed = document.querySelector("#feed");
const template = document.querySelector("#cardTemplate");
const search = document.querySelector("#search");
const sourceFilter = document.querySelector("#sourceFilter");
const refreshBtn = document.querySelector("#refreshBtn");
const lastUpdated = document.querySelector("#lastUpdated");
const count = document.querySelector("#count");
const alerts = document.querySelector("#alerts");
const dot = document.querySelector("#dot");
const statusText = document.querySelector("#statusText");

let allItems = [];
let timer;

function formatDate(value) {
  if (!value) return "وقت دستیاب نہیں";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ur-PK", {
    dateStyle: "medium", timeStyle: "short"
  }).format(d);
}

function render() {
  const q = search.value.trim().toLowerCase();
  const source = sourceFilter.value;
  const items = allItems.filter(item => {
    const text = `${item.title} ${item.summary} ${item.source}`.toLowerCase();
    return (!q || text.includes(q)) && (!source || item.source === source);
  });

  feed.innerHTML = "";
  count.textContent = `${items.length} اپڈیٹس`;

  if (!items.length) {
    feed.innerHTML = '<div class="empty">کوئی متعلقہ اپڈیٹ نہیں ملی۔</div>';
    return;
  }

  items.forEach(item => {
    const node = template.content.cloneNode(true);
    const badge = node.querySelector(".badge");
    badge.textContent = item.official ? "سرکاری ذریعہ" : "غیر سرکاری / میڈیا";
    if (!item.official) badge.classList.add("unofficial");
    node.querySelector("time").textContent = formatDate(item.publishedAt);
    node.querySelector("h2").textContent = item.title;
    node.querySelector("p").textContent = item.summary || "تفصیل کے لیے اصل لنک کھولیں۔";
    node.querySelector(".source").textContent = item.source;
    node.querySelector("a").href = item.link;
    feed.appendChild(node);
  });
}

function setSources(items) {
  const current = sourceFilter.value;
  const sources = [...new Set(items.map(x => x.source))].sort();
  sourceFilter.innerHTML = '<option value="">تمام ذرائع</option>';
  sources.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s;
    sourceFilter.appendChild(option);
  });
  sourceFilter.value = current;
}

async function loadData() {
  refreshBtn.disabled = true;
  statusText.textContent = "اپڈیٹ ہو رہا ہے…";
  try {
    const res = await fetch("/api/updates", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allItems = data.items || [];
    setSources(allItems);
    render();

    alerts.innerHTML = (data.errors || []).map(e =>
      `<div class="alert">${e.source}: عارضی طور پر ڈیٹا حاصل نہیں ہو سکا۔</div>`
    ).join("");

    lastUpdated.textContent = `آخری اپڈیٹ: ${formatDate(data.generatedAt)}`;
    dot.classList.add("live");
    statusText.textContent = "لائیو";
    clearTimeout(timer);
    timer = setTimeout(loadData, (data.refreshSeconds || 60) * 1000);
  } catch (err) {
    dot.classList.remove("live");
    statusText.textContent = "کنکشن مسئلہ";
    alerts.innerHTML = `<div class="alert">ڈیٹا لوڈ نہیں ہوا: ${err.message}</div>`;
  } finally {
    refreshBtn.disabled = false;
  }
}

search.addEventListener("input", render);
sourceFilter.addEventListener("change", render);
refreshBtn.addEventListener("click", loadData);
loadData();
