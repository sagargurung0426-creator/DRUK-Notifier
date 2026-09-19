const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const parser = new Parser();

app.use(express.json());
app.use(cors());

// ============================================================================
// CONFIGURATION: Verified Live RSS Feeds, Government Portals & RBP Scraper
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
  
  // --- GOVERNMENT MINISTRIES (RSS Feeds) ---
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
  },

  // --- EDUCATION PORTAL (Scraper) ---
  {
    id: "bcsea",
    name: "BCSEA (Examinations & Assessment)",
    type: "scrape",
    category: "Education",
    url: "https://www.bcsea.gov.bt/"
  },

  // --- TRAVEL & ROADBLOCK PORTAL (Scraper) ---
  {
    id: "rbp",
    name: "Royal Bhutan Police (Traffic & Roadblocks)",
    type: "scrape",
    category: "Travel",
    url: "https://rbp.gov.bt/public-announcement/"
  }
];

// List of Bhutan Dzongkhags for automatic keyword extraction
const DZONGKHAGS_LIST = [
  "Thimphu", "Phuentsholing", "Punakha", "Paro", "Wangdue Phodrang", "Bumthang", 
  "Trashigang", "Gelephu", "Samtse", "Mongar", "Chukha", "Tsirang", 
  "Dagana", "Haa", "Lhuntse", "Pemagatshel", "Samdrup Jongkhar", "Sarpang", 
  "Trashi Yangtse", "Zhemgang", "Gasa"
];

function detectDzongkhag(text) {
  if (!text) return "All";
  for (const dz of DZONGKHAGS_LIST) {
    if (text.toLowerCase().includes(dz.toLowerCase())) {
      return dz;
    }
  }
  return "All";
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================
let cachedFeedData = [];
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

async function fetchRssFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.map(item => {
      const fullText = `${item.title || ""} ${item.contentSnippet || item.content || ""}`;
      const titleLower = (item.title || "").toLowerCase();
      
      const isUrgent = titleLower.includes('urgent') || 
                       titleLower.includes('alert') || 
                       titleLower.includes('warning') || 
                       titleLower.includes('roadblock') ||
                       titleLower.includes('closure') ||
                       titleLower.includes('vacancy') || 
                       titleLower.includes('tender');

      return {
        id: `${source.id}-${item.guid || Buffer.from(item.link || '').toString('base64').slice(0, 12)}`,
        agency: source.name,
        category: source.category,
        dzongkhag: detectDzongkhag(fullText),
        title_en: item.title || "Untitled Update",
        title_dz: null,
        content_en: item.contentSnippet || item.content || "No content available",
        content_dz: null,
        is_urgent: isUrgent,
        published_at: item.pubDate || new Date().toISOString(),
        link: item.link || "#"
      };
    });
  } catch (error) {
    console.error(`[Warning] Failed to fetch RSS feed for ${source.name}:`, error.message);
    return [];
  }
}

async function scrapeHtmlSource(source) {
  try {
    const response = await axios.get(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000
    });
    const $ = cheerio.load(response.data);
    const notices = [];

    $('li, article, .announcement, .notice-item, tr').each((index, element) => {
      const text = $(element).text().trim();
      const linkElem = $(element).find('a');
      const link = linkElem.attr('href') || source.url;
      const title = linkElem.text().trim() || text.split('\n')[0];

      if (title && title.length > 8) {
        const fullText = `${title} ${text}`;
        const titleLower = title.toLowerCase();
        const isUrgent = titleLower.includes('urgent') || 
                         titleLower.includes('alert') || 
                         titleLower.includes('roadblock') || 
                         titleLower.includes('landslide') ||
                         titleLower.includes('closure') ||
                         titleLower.includes('exam') || 
                         titleLower.includes('result');

        notices.push({
          id: `${source.id}-scrape-${index}`,
          agency: source.name,
          category: source.category,
          dzongkhag: detectDzongkhag(fullText),
          title_en: title,
          title_dz: null,
          content_en: text.length > 200 ? text.substring(0, 200) + '...' : text,
          content_dz: null,
          is_urgent: isUrgent,
          published_at: new Date().toISOString(),
          link: link.startsWith('http') ? link : new URL(link, source.url).toString()
        });
      }
    });

    const uniqueNotices = Array.from(new Map(notices.map(item => [item.title_en, item])).values());
    return uniqueNotices.slice(0, 15);
  } catch (error) {
    console.error(`[Warning] Failed to scrape HTML for ${source.name}:`, error.message);
    return [];
  }
}

async function getAggregatedData() {
  const now = Date.now();
  if (cachedFeedData.length > 0 && (now - lastFetchTimestamp < CACHE_DURATION_MS)) {
    return cachedFeedData;
  }

  console.log(`[${new Date().toISOString()}] Fetching fresh data from ${SOURCES.length} sources...`);
  const fetchPromises = SOURCES.map(source => {
    if (source.type === 'rss') return fetchRssFeed(source);
    if (source.type === 'scrape') return scrapeHtmlSource(source);
    return [];
  });

  const resultsArrays = await Promise.all(fetchPromises);
  cachedFeedData = resultsArrays.flat();
  lastFetchTimestamp = now;
  cachedFeedData.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  
  return cachedFeedData;
}

app.get('/api/v1/feed', async (req, res) => {
  try {
    const { category, dzongkhag } = req.query;
    let results = await getAggregatedData();

    if (category && category !== 'All') {
      results = results.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }

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
        message: "Data aggregated live from RSS feeds and HTML scrapers.",
        last_updated: new Date(lastFetchTimestamp).toISOString()
      }
    });
  } catch (error) {
    console.error("Error aggregating feeds:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch updates." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Druk Notifier backend running on port ${PORT}`);
});
