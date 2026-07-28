const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, "sources.json");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
}

function normalizeText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function matchesKeywords(text, keywords) {
  const haystack = text.toLowerCase();
  return keywords.some(k => haystack.includes(k.toLowerCase()));
}

function absoluteUrl(base, href) {
  try { return new URL(href, base).toString(); } catch { return base; }
}

async function fetchRSS(source, keywords) {
  const feed = await parser.parseURL(source.url);
  return (feed.items || []).map(item => ({
    id: `${source.id}:${item.guid || item.link || item.title}`,
    title: normalizeText(item.title),
    summary: normalizeText(item.contentSnippet || item.content || ""),
    link: item.link || source.url,
    publishedAt: item.isoDate || item.pubDate || null,
    source: source.name,
    sourceId: source.id,
    priority: source.priority || 0,
    official: (source.priority || 0) >= 90,
    kind: "news"
  })).filter(item => matchesKeywords(`${item.title} ${item.summary}`, keywords));
}

async function fetchHTML(source, keywords) {
  const response = await axios.get(source.url, {
    timeout: 15000,
    headers: { "User-Agent": "Mozilla/5.0 ElectionDashboard/1.0" }
  });
  const $ = cheerio.load(response.data);
  const s = source.selectors || {};
  const items = [];

  $(s.item || "article").each((index, el) => {
    const title = normalizeText($(el).find(s.title || "h1,h2,h3").first().text());
    if (!title) return;
    const href = $(el).find(s.link || "a").first().attr("href");
    const date = normalizeText($(el).find(s.date || "time").first().attr("datetime") ||
                               $(el).find(s.date || "time").first().text());
    const summary = normalizeText($(el).text()).slice(0, 500);

    const item = {
      id: `${source.id}:${href || title}`,
      title,
      summary,
      link: absoluteUrl(source.url, href || ""),
      publishedAt: date || null,
      source: source.name,
      sourceId: source.id,
      priority: source.priority || 0,
      official: (source.priority || 0) >= 90,
      kind: "update"
    };
    if (matchesKeywords(`${title} ${summary}`, keywords)) items.push(item);
  });

  return items;
}

async function fetchSource(source, keywords) {
  if (!source.enabled) return [];
  if (source.type === "rss") return fetchRSS(source, keywords);
  if (source.type === "html") return fetchHTML(source, keywords);
  if (source.type === "json") {
    const response = await axios.get(source.url, { timeout: 15000 });
    const rows = Array.isArray(response.data) ? response.data : (response.data.items || []);
    return rows.map((row, i) => ({
      id: `${source.id}:${row.id || i}`,
      title: normalizeText(row.title || row.name || "Update"),
      summary: normalizeText(row.summary || row.description || ""),
      link: row.link || row.url || source.url,
      publishedAt: row.publishedAt || row.date || null,
      source: source.name,
      sourceId: source.id,
      priority: source.priority || 0,
      official: (source.priority || 0) >= 90,
      kind: row.kind || "result"
    })).filter(item => matchesKeywords(`${item.title} ${item.summary}`, keywords));
  }
  return [];
}

function deduplicate(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, "")}|${item.link}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

app.get("/api/updates", async (req, res) => {
  const config = loadConfig();
  const results = await Promise.allSettled(
    config.sources.map(source => fetchSource(source, config.keywords || []))
  );

  const errors = [];
  let items = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") items.push(...result.value);
    else errors.push({
      source: config.sources[i].name,
      message: result.reason?.message || "Fetch failed"
    });
  });

  items = deduplicate(items).sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
  });

  res.json({
    generatedAt: new Date().toISOString(),
    refreshSeconds: config.refreshSeconds || 60,
    count: items.length,
    items,
    errors
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AJK Election Dashboard: http://localhost:${PORT}`);
});
