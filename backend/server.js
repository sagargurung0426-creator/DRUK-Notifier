const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { runFullAutoScrape, TARGET_ENTITIES } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

function getCachedFeeds() {
  const filePath = path.join(__dirname, '../data/feeds.json');
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

app.get('/api/entities', (req, res) => {
  const entityMap = {};
  TARGET_ENTITIES.forEach(ent => {
    if (!entityMap[ent.category]) entityMap[ent.category] = [];
    entityMap[ent.category].push({ id: ent.id, name: ent.name });
  });
  entityMap['fuel'] = [{ id: 'stcbl', name: 'STCBL Petroleum' }];
  res.json(entityMap);
});

app.get('/api/notifications', (req, res) => {
  const { category, entity, search } = req.query;
  let feeds = getCachedFeeds();

  if (category && category !== 'all') {
    feeds = feeds.filter(f => f.category === category);
  }
  if (entity && entity !== 'all') {
    feeds = feeds.filter(f => f.entityId === entity);
  }
  if (search) {
    const q = search.toLowerCase();
    feeds = feeds.filter(f => f.title.toLowerCase().includes(q) || (f.summary && f.summary.toLowerCase().includes(q)));
  }

  feeds.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(feeds);
});

app.get('/api/admin/refresh', async (req, res) => {
  const data = await runFullAutoScrape();
  res.json({ status: 'success', count: data.length });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);

  // Initial scrape when server launches
  await runFullAutoScrape();

  // Native JavaScript Interval (30 minutes = 1,800,000 ms)
  const THIRTY_MINUTES = 30 * 60 * 1000;
  setInterval(async () => {
    console.log('⏰ Running automatic 30-minute sync...');
    await runFullAutoScrape();
  }, THIRTY_MINUTES);
});
