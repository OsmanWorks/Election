window.ELECTION_CONFIG = {
  refreshMs: 60000,
  resultsUrl: "data/results.json",
  newsFallbackUrl: "data/news-fallback.json",
  sourcesUrl: "data/sources.json",
  // Browser-only feed fetching can be blocked by CORS. Add or remove proxy endpoints here.
  liveFeeds: [
    {
      name: "Dawn",
      feed: "https://www.dawn.com/feeds/home",
      proxy: "https://api.allorigins.win/raw?url="
    }
  ],
  keywords: [
    "AJK", "Azad Kashmir", "Azad Jammu Kashmir", "Kashmir election",
    "آزاد کشمیر", "انتخابات", "الیکشن", "میرپور", "کوٹلی", "بھمبر", "مظفرآباد"
  ]
};