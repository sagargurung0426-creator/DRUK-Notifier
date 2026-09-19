const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');

const app = express();
const parser = new Parser();

app.use(express.json());
app.use(cors());

// ============================================================================
// CONFIGURATION: Verified Live RSS Feeds for Bhutan
// Note: Ministries without RSS feeds are omitted. See "Custom Scraping" note below.
// ============================================================================
const SOURCES = [
  // --- NEWS OUTLETS ---
  {
    id: "kuensel",
    name: "Kuensel Online",
    type: "rss",
    category: "News",
    url: "https://kuenselonline.com/feed/"
  },
  {
    id: "thebhutanese",
    name: "The Bhutanese",
    type: "rss",
    category: "News",
    url: "https://thebhutanese.bt/feed/"
  },
  
  // --- GOVERNMENT MINISTRIES (Verified RSS Feeds) ---
  {
    id: "moh",
    name: "Ministry of Health",
    type: "rss",
    category: "Government",
    url: "https://moh.gov.bt/feed/"
  },
  {
    id: "moit",
    name: "Ministry of Infrastructure and Transport",
    type: "rss",
    category: "Government",
    url: "https://moit.gov.bt/feed/"
  },
  {
    id: "mof",
    name: "Ministry of Finance",
    type: "rss",
    category: "Government",
    url: "https://mof.gov.bt/feed/"
  },
  {
    id: "moal",
    name: "Ministry of Agriculture and Livestock",
    type: "rss",
    category: "Government",
    url: "https://www.moal.gov.bt/feed/"
  },
  {
    id: "moha",
    name: "Ministry of Home Affairs",
    type: "rss",
    category: "Government",
    url: "https://www.moha.gov.bt/feed/"
  }
];

// ============================================================================
// IN-MEMORY CACHE (Zero Database Required)
// Caches aggregated results for 5 minutes to prevent rate-limiting from external sites.
// ============================================================================
let cachedFeedData = [];
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

async function fetchRssFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.map(item => {
      const titleLower = (item.title || "").toLowerCase();
      // Auto-detect urgency based on common government/news keywords
      const isUrgent = titleLower.includes('urgent') || 
                       titleLower.includes('alert') || 
                       titleLower.includes('warning') || 
                       titleLower.includes('vacancy') || 
                       titleLower.includes('tender') ||
                       titleLower.includes('notice');

      return {
        id: `${source.id}-${item.guid || Buffer.from(item.link || '').toString('base64').slice(0, 12)}`,
        agency: source.name,
        category: source.category,
        dzongkhag: "All", // Most RSS feeds do not provide granular dzongkhag metadata
        title_en: item.title || "Untitled Update",
        title_dz: null, // Public RSS feeds are predominantly English
        content_en: item.contentSnippet || item.content || "No content available",
        content_dz: null,
        is_urgent: isUrgent,
        published_at: item.pubDate || new Date().toISOString(),
        link: item.link || "#"
      };
    });
  } catch (error) {
    console.error(`[Warning] Failed to fetch RSS feed for ${source.name}:`, error.message);
    return []; // Fail gracefully: one broken feed won't crash the whole app
  }
}

async function getAggregatedData() {
  const now = Date.now();
  
  // Return cached data if it's still fresh
  if (cachedFeedData.length > 0 && (now - lastFetchTimestamp < CACHE_DURATION_MS)) {
    return cachedFeedData;
  }

  console.log(`[${new Date().toISOString()}] Fetching fresh data from ${SOURCES.length} external sources...`);
  
  // Fetch all sources concurrently for maximum speed
  const fetchPromises = SOURCES.map(source => {
    if (source.type === 'rss') return fetchRssFeed(source);
    return [];
  });

  const resultsArrays = await Promise.all(fetchPromises);
  cachedFeedData = resultsArrays.flat();
  lastFetchTimestamp = now;
  
  // Sort by published date (newest first)
  cachedFeedData.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  
  return cachedFeedData;
}

// ============================================================================
// API ENDPOINT
// ============================================================================
app.get('/api/v1/feed', async (req, res) => {
  try {
    const { category, dzongkhag } = req.query;
    
    // Get live (or cached) aggregated data
    let results = await getAggregatedData();

    // Filter by category (e.g., ?category=Government or ?category=News)
    if (category && category !== 'All') {
      results = results.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by dzongkhag 
    // Note: Since external RSS feeds rarely tag by dzongkhag, this defaults to showing "All" 
    // unless you implement custom HTML scraping for specific ministry notice boards.
    if (dzongkhag && dzongkhag !== 'All') {
      results = results.filter(item => 
        item.dzongkhag?.toLowerCase() === dzongkhag.toLowerCase() || item.dzongkhag === 'All'
      );
    }

    res.json({
      status: "success",
      count: results.length,
      data: results,
      meta: {
        message: "Data fetched in real-time from external RSS feeds. No database is used.",
        last_updated: new Date(lastFetchTimestamp).toISOString(),
        note: "Dzongkhag filtering is limited because most external RSS feeds do not provide location metadata."
      }
    });
  } catch (error) {
    console.error("Error aggregating feeds:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch updates from external sources."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Druk Notifier multi-source backend running on port ${PORT}`);
  console.log(`📡 Aggregating ${SOURCES.length} live sources (Zero Database).`);
});
