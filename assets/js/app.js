(() => {
  const cfg = window.ELECTION_CONFIG;
  let results = [];
  let fallbackNews = [];
  const $ = s => document.querySelector(s);

  const statusLabels = {
    declared:"اعلان شدہ",
    leading:"برتری",
    pending:"زیر التوا"
  };

  function escapeHTML(value="") {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  }

  async function getJSON(url) {
    const res = await fetch(`${url}?v=${Date.now()}`, {cache:"no-store"});
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }

  function formatDate(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) return value || "—";
    return new Intl.DateTimeFormat("ur-PK",{dateStyle:"medium",timeStyle:"short"}).format(d);
  }

  function renderStats() {
    const total = results.length;
    const declared = results.filter(r => r.status === "declared").length;
    const pending = results.filter(r => r.status === "pending").length;
    const turnoutRows = results.filter(r => Number(r.turnout)>0 && r.status !== "pending");
    const avg = turnoutRows.length ? turnoutRows.reduce((a,r)=>a+Number(r.turnout),0)/turnoutRows.length : 0;
    $("#totalSeats").textContent = total;
    $("#declaredSeats").textContent = declared;
    $("#pendingSeats").textContent = pending;
    $("#declaredPercent").textContent = total ? `${Math.round(declared/total*100)}% مکمل` : "0%";
    $("#averageTurnout").textContent = `${avg.toFixed(1)}%`;
  }

  function populatePartyFilter() {
    const parties = [...new Set(results.map(r=>r.party).filter(Boolean))].sort();
    $("#partyFilter").innerHTML = '<option value="">تمام پارٹیاں</option>' +
      parties.map(p=>`<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`).join("");
  }

  function renderResults() {
    const q = $("#searchInput").value.trim().toLowerCase();
    const party = $("#partyFilter").value;
    const status = $("#statusFilter").value;
    const filtered = results.filter(r => {
      const hay = `${r.constituency} ${r.area} ${r.candidate} ${r.party}`.toLowerCase();
      return (!q || hay.includes(q)) && (!party || r.party===party) && (!status || r.status===status);
    });
    $("#resultsBody").innerHTML = filtered.map(r=>`
      <tr>
        <td><strong>${escapeHTML(r.constituency)}</strong></td>
        <td>${escapeHTML(r.area)}</td>
        <td>${escapeHTML(r.candidate || "—")}</td>
        <td><span class="party-dot" style="background:${escapeHTML(r.color || "#66746f")}"></span>${escapeHTML(r.party || "—")}</td>
        <td>${Number(r.votes||0).toLocaleString("en-US")}</td>
        <td>${r.turnout ? `${escapeHTML(r.turnout)}%` : "—"}</td>
        <td><span class="status-badge ${escapeHTML(r.status)}">${statusLabels[r.status] || r.status}</span></td>
      </tr>`).join("");
    $("#emptyResults").classList.toggle("hidden", filtered.length>0);
  }

  function parseRSS(xmlText, sourceName) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    return [...doc.querySelectorAll("item")].map(item => ({
      title:item.querySelector("title")?.textContent?.trim() || "",
      link:item.querySelector("link")?.textContent?.trim() || "#",
      description:(item.querySelector("description")?.textContent || "").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,220),
      date:item.querySelector("pubDate")?.textContent || new Date().toISOString(),
      source:sourceName
    }));
  }

  function relevant(item) {
    const text = `${item.title} ${item.description}`.toLowerCase();
    return cfg.keywords.some(k=>text.includes(k.toLowerCase()));
  }

  async function fetchLiveNews() {
    const all = [];
    for (const feed of cfg.liveFeeds) {
      try {
        const url = feed.proxy + encodeURIComponent(feed.feed);
        const res = await fetch(url, {cache:"no-store"});
        if (!res.ok) throw new Error(res.status);
        const text = await res.text();
        all.push(...parseRSS(text, feed.name).filter(relevant));
      } catch (e) {
        console.warn("Live feed unavailable:", feed.name, e);
      }
    }
    return all;
  }

  function renderNews(items) {
    const unique = [];
    const seen = new Set();
    [...items, ...fallbackNews].forEach(i => {
      const key=(i.title||"").toLowerCase();
      if (key && !seen.has(key)) {seen.add(key);unique.push(i);}
    });
    const chosen = unique.slice(0,9);
    $("#newsGrid").innerHTML = chosen.length ? chosen.map(i=>`
      <article class="news-card">
        <span class="source-label">${escapeHTML(i.source || "Update")}</span>
        <h3>${escapeHTML(i.title)}</h3>
        <p>${escapeHTML(i.description || "مزید تفصیل کے لیے اصل لنک کھولیں۔")}</p>
        <a href="${escapeHTML(i.link || "#")}" target="_blank" rel="noopener">اصل خبر دیکھیں ←</a>
        <time>${formatDate(i.date)}</time>
      </article>`).join("") : '<div class="empty">اس وقت کوئی اپڈیٹ دستیاب نہیں۔</div>';
  }

  async function loadSources() {
    try {
      const sources = await getJSON(cfg.sourcesUrl);
      $("#sourceList").innerHTML = sources.map(s=>`
        <div class="source-item"><strong>${escapeHTML(s.name)}</strong><small>${escapeHTML(s.type)} · ${escapeHTML(s.note)}</small></div>
      `).join("");
    } catch(e) {
      $("#sourceList").innerHTML = '<div class="source-item">ذرائع کی فہرست دستیاب نہیں۔</div>';
    }
  }

  async function loadAll() {
    $("#connectionText").textContent = "اپڈیٹ ہو رہا ہے";
    try {
      [results, fallbackNews] = await Promise.all([
        getJSON(cfg.resultsUrl),
        getJSON(cfg.newsFallbackUrl)
      ]);
      renderStats();
      populatePartyFilter();
      renderResults();
      window.ElectionCharts.render(results);
      const live = await fetchLiveNews();
      renderNews(live);
      $("#lastUpdated").textContent = formatDate(new Date());
      $("#connectionText").textContent = live.length ? "لائیو فیڈ فعال" : "Fallback ڈیٹا فعال";
    } catch(e) {
      console.error(e);
      $("#connectionText").textContent = "ڈیٹا لوڈ نہیں ہوا";
      $("#dataNotice").innerHTML = "<strong>خرابی:</strong> data فولڈر موجود ہونا چاہیے۔ GitHub پر ZIP نہیں بلکہ اس کے اندر کی تمام فائلیں اپلوڈ کریں۔";
    }
  }

  ["searchInput","partyFilter","statusFilter"].forEach(id => {
    document.addEventListener("DOMContentLoaded",()=>$("#"+id).addEventListener("input",renderResults));
  });
  document.addEventListener("DOMContentLoaded",()=>{
    $("#refreshButton").addEventListener("click",loadAll);
    loadSources();
    loadAll();
    setInterval(loadAll,cfg.refreshMs);
  });
})();