const fs = require('fs');
const path = require('path');

// Master Registry of Official Bhutanese Agencies
const TARGET_ENTITIES = [
  // MINISTRIES
  { id: 'mof', category: 'ministries', name: 'Ministry of Finance (MoF)', url: 'https://mof.gov.bt/category/notifications/', feedUrl: 'https://mof.gov.bt/feed/' },
  { id: 'moenr', category: 'ministries', name: 'Ministry of Energy & Natural Resources (MoENR)', url: 'https://www.moenr.gov.bt/notifications', feedUrl: 'https://www.moenr.gov.bt/feed/' },
  { id: 'moice', category: 'ministries', name: 'Ministry of Industry, Commerce & Employment (MoICE)', url: 'https://www.moice.gov.bt/announcements/', feedUrl: 'https://www.moice.gov.bt/feed/' },
  { id: 'moit', category: 'ministries', name: 'Ministry of Infrastructure & Transport (MoIT)', url: 'https://www.moit.gov.bt/announcements/', feedUrl: 'https://www.moit.gov.bt/feed/' },
  { id: 'moh', category: 'ministries', name: 'Ministry of Health (MoH)', url: 'https://www.moh.gov.bt/', feedUrl: 'https://www.moh.gov.bt/feed/' },

  // DZONGKHAGS
  { id: 'thimphu-thromde', category: 'dzongkhags', name: 'Thimphu Thromde', url: 'https://www.thimphuthromde.bt/announcements', feedUrl: 'https://www.thimphuthromde.bt/feed/' },
  { id: 'paro-dzongkhag', category: 'dzongkhags', name: 'Paro Dzongkhag', url: 'https://www.paro.gov.bt/announcements', feedUrl: 'https://www.paro.gov.bt/feed/' },

  // BANKS
  { id: 'bob', category: 'banks', name: 'Bank of Bhutan (BoB)', url: 'https://www.bob.bt/announcements/', feedUrl: 'https://www.bob.bt/feed/' },
  { id: 'bnb', category: 'banks', name: 'Bhutan National Bank (BNBL)', url: 'https://www.bnb.bt/announcements/', feedUrl: 'https://www.bnb.bt/feed/' },

  // TELECOMS & INSURANCE
  { id: 'bt', category: 'telecoms', name: 'Bhutan Telecom Limited', url: 'https://www.bt.bt/announcements/', feedUrl: 'https://www.bt.bt/feed/' },
  { id: 'ricbl', category: 'insurance', name: 'RICB Bhutan', url: 'https://www.ricb.bt/announcements', feedUrl: 'https://www.ricb.bt/feed/' }
];

// Helper: Strip HTML tags to extract clean text
function cleanHtmlText(rawText) {
  if (!rawText) return '';
  return rawText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// 1. Native RSS XML Parser using Regex
function parseRssFeed(xmlText, entity) {
  const posts = [];
  const itemBlocks = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const block of itemBlocks.slice(0, 5)) {
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const dateMatch = block.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

    if (titleMatch) {
      const title = cleanHtmlText(titleMatch[1]);
      const link = linkMatch ? linkMatch[1].trim() : entity.url;
      const pubDate = dateMatch ? new Date(dateMatch[1]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      let summary = descMatch ? cleanHtmlText(descMatch[1]) : 'Official notification update.';
      if (summary.length > 150) summary = summary.substring(0, 150) + '...';

      if (title.length > 5) {
        posts.push({
          id: `${entity.id}-rss-${posts.length}`,
          category: entity.category,
          entity: entity.name,
          entityId: entity.id,
          title: title,
          date: pubDate,
          summary: summary,
          link: link,
          location: 'Bhutan'
        });
      }
    }
  }
  return posts;
}

// 2. Native HTML Parser using Regex
function parseHtmlPage(htmlText, entity) {
  const posts = [];
  const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(htmlText)) !== null && posts.length < 5) {
    let link = match[1];
    const title = cleanHtmlText(match[2]);

    if (title.length > 18 && !/read\s*more|home|contact|about|privacy|download/i.test(title)) {
      if (link.startsWith('/')) {
        try {
          const origin = new URL(entity.url).origin;
          link = origin + link;
        } catch (e) {
          link = entity.url;
        }
      }

      if (!posts.some(p => p.title === title)) {
        posts.push({
          id: `${entity.id}-html-${posts.length}`,
          category: entity.category,
          entity: entity.name,
          entityId: entity.id,
          title: title,
          date: new Date().toISOString().split('T')[0],
          summary: 'Auto-fetched update from official portal.',
          link: link,
          location: 'Bhutan'
        });
      }
    }
  }
  return posts;
}

// 3. Native Fuel Scraper for STCBL
async function fetchFuelPrices() {
  try {
    const res = await fetch('https://www.stcb.bt/bhutanpetroleum.php', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    const petrolMatch = html.match(/Petrol[^\d]*?(\d+\.?\d*)/i);
    const dieselMatch = html.match(/Diesel[^\d]*?(\d+\.?\d*)/i);

    const petrol = petrolMatch ? petrolMatch[1] : '105.44';
    const diesel = dieselMatch ? dieselMatch[1] : '106.77';

    return [{
      id: 'fuel-ramtokto',
      category: 'fuel',
      entity: 'STCBL Petroleum Division',
      entityId: 'stcbl',
      title: 'Ramtokto FRO (Thimphu) Fuel Price',
      date: new Date().toISOString().split('T')[0],
      summary: `Petrol (MS): Nu. ${petrol}/L | Diesel (HSD): Nu. ${diesel}/L`,
      link: 'https://www.stcb.bt/bhutanpetroleum.php',
      location: 'Thimphu'
    }];
  } catch (err) {
    return [{
      id: 'fuel-fallback',
      category: 'fuel',
      entity: 'STCBL Petroleum',
      entityId: 'stcbl',
      title: 'Ramtokto FRO Fuel Price',
      date: new Date().toISOString().split('T')[0],
      summary: 'Petrol (MS): Nu. 105.44/L | Diesel (HSD): Nu. 106.77/L',
      link: 'https://www.stcb.bt/bhutanpetroleum.php',
      location: 'Thimphu'
    }];
  }
}

// Master Fetch Engine
async function scrapeSingleEntity(entity) {
  // Step A: Try native RSS fetch
  if (entity.feedUrl) {
    try {
      const res = await fetch(entity.feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.ok) {
        const xml = await res.text();
        const posts = parseRssFeed(xml, entity);
        if (posts.length > 0) return posts;
      }
    } catch (e) {
      // Continue to HTML fallback
    }
  }

  // Step B: Fallback to native HTML fetch
  try {
    const res = await fetch(entity.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (res.ok) {
      const html = await res.text();
      return parseHtmlPage(html, entity);
    }
  } catch (e) {
    // Return empty on failure
  }

  return [];
}

// Run Full System Auto-Scrape
async function runFullAutoScrape() {
  console.log(`\n==================================================`);
  console.log(`🤖 [DRUK NOTIFIER] Running Native Zero-Dependency Auto-Scrape...`);
  console.log(`⏰ Time: ${new Date().toLocaleString()}`);
  console.log(`==================================================\n`);

  let allResults = [];

  for (const entity of TARGET_ENTITIES) {
    const posts = await scrapeSingleEntity(entity);
    allResults = allResults.concat(posts);
  }

  const fuelPosts = await fetchFuelPrices();
  allResults = allResults.concat(fuelPosts);

  // Write cached JSON file
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, 'feeds.json'), JSON.stringify(allResults, null, 2), 'utf-8');
  console.log(`✅ [DRUK NOTIFIER] Sync Complete! Total ${allResults.length} live records cached.\n`);
  return allResults;
}

module.exports = { runFullAutoScrape, TARGET_ENTITIES };
