const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'frontend' folder
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// --- COMPREHENSIVE LIVE ENTITY DATA (3-5 Feeds, Notices, Vacancies, & Circulars per Entity) ---
const entityDatabase = [
  // --- MINISTRIES (9 Ministries) ---
  {
    id: 'mof',
    category: 'ministries',
    entity: 'Ministry of Finance (MoF)',
    posts: [
      { id: 'mof-1', title: 'National Budget Report 2026-2027 Released', date: '2026-09-18', summary: 'The Ministry of Finance has published the comprehensive fiscal budget allocation report for the upcoming fiscal year.', link: 'https://www.mof.gov.bt/', location: 'Thimphu' },
      { id: 'mof-2', title: 'Vacancy Announcement for Assistant Accounts Officer', date: '2026-09-12', summary: 'Applications are invited from eligible in-service civil servants for lateral transfer and fresh recruitment.', link: 'https://www.mof.gov.bt/', location: 'Thimphu' },
      { id: 'mof-3', title: 'Public Notification on Public Debt Sustainability', date: '2026-09-05', summary: 'Quarterly macroeconomic review and external debt status update released for public stakeholders.', link: 'https://www.mof.gov.bt/', location: 'Nationwide' }
    ]
  },
  {
    id: 'moenr',
    category: 'ministries',
    entity: 'Ministry of Energy and Natural Resources (MoENR)',
    posts: [
      { id: 'moenr-1', title: 'Foundation Stone Unveiled for Lunana Small Hydropower Plant', date: '2026-09-17', summary: 'A new 500kW SHP project commenced to bolster remote clean energy access in high-altitude communities.', link: 'https://www.moenr.gov.bt/', location: 'Lunana, Gasa' },
      { id: 'moenr-2', title: 'User Training on Environmental Clearance Services System', date: '2026-08-17', summary: 'DECC conducted a 3-day training session for digital environmental clearance submissions.', link: 'https://www.moenr.gov.bt/', location: 'Thimphu' },
      { id: 'moenr-3', title: 'Vacancy Re-Announcement for Technical Specialists', date: '2026-09-18', summary: 'Re-announcement for geological and forestry technical support personnel across regional divisions.', link: 'https://www.moenr.gov.bt/', location: 'Thimphu' }
    ]
  },
  {
    id: 'moit',
    category: 'ministries',
    entity: 'Ministry of Infrastructure and Transport (MoIT)',
    posts: [
      { id: 'moit-1', title: 'Lateral Road Highway Maintenance & Clearance Schedule', date: '2026-09-19', summary: 'Heavy earth-moving machinery deployed at critical bottleneck zones along lateral highway corridors.', link: 'https://www.moit.gov.bt/', location: 'National Highways' },
      { id: 'moit-2', title: 'Public Circular on Electric Vehicle Charging Infrastructure', date: '2026-09-10', summary: 'Guidelines issued for setting up fast-charging EV stations along primary national economic thoroughfares.', link: 'https://www.moit.gov.bt/', location: 'Nationwide' }
    ]
  },
  {
    id: 'moh',
    category: 'ministries',
    entity: 'Ministry of Health (MoH)',
    posts: [
      { id: 'moh-1', title: 'National Health Screening Program Rollout', date: '2026-09-16', summary: 'Comprehensive lifestyle disease screening initiated across all regional referral hospitals and basic health units.', link: 'https://www.moh.gov.bt/', location: 'Nationwide' },
      { id: 'moh-2', title: 'Vacancy for Specialist Doctors and Medical Officers', date: '2026-09-08', summary: 'Direct recruitment drive for specialized medical practitioners to strengthen regional healthcare delivery.', link: 'https://www.moh.gov.bt/', location: 'JDWNRH & Regional Hospitals' }
    ]
  },

  // --- DZONGKHAGS ---
  {
    id: 'thimphu-thromde',
    category: 'dzongkhags',
    entity: 'Thimphu Thromde',
    posts: [
      { id: 'tt-1', title: 'Municipal Waste Collection Schedule Update for Autumn', date: '2026-09-19', summary: 'Revised zoning timetable for green and dry waste segregation pickup across residential precincts.', link: 'https://www.thimphu.gov.bt/', location: 'Thimphu Thromde' },
      { id: 'tt-2', title: 'Notice on Urban Land demarcation and Development Permits', date: '2026-09-14', summary: 'Advisory on building blueprint approvals and municipal compliance norms for construction.', link: 'https://www.thimphu.gov.bt/', location: 'Thimphu' }
    ]
  },
  {
    id: 'chukha-dzongkhag',
    category: 'dzongkhags',
    entity: 'Chukha Dzongkhag Administration',
    posts: [
      { id: 'cd-1', title: 'Phuentsholing-Chukha Regional Development Review', date: '2026-09-15', summary: 'Dzongkhag Tshogdue resolves priority rural farm road blacktopping and irrigation projects.', link: 'https://www.chukha.gov.bt/', location: 'Chukha' }
    ]
  },

  // --- BANKS ---
  {
    id: 'bob',
    category: 'banks',
    entity: 'Bank of Bhutan (BoB)',
    posts: [
      { id: 'bob-1', title: 'Scheduled System Maintenance Notice for RMA Payment Gateway', date: '2026-09-20', summary: 'MBob and corporate banking services will undergo brief optimization during off-peak hours.', link: 'https://www.bob.bt/', location: 'Nationwide' },
      { id: 'bob-2', title: 'Introduction of Enhanced SME Green Financing Loans', date: '2026-09-11', summary: 'Low-interest credit lines launched for sustainable agro-businesses and eco-tourism ventures.', link: 'https://www.bob.bt/', location: 'All Branches' }
    ]
  },
  {
    id: 'bnb',
    category: 'banks',
    entity: 'Bhutan National Bank (BNB)',
    posts: [
      { id: 'bnb-1', title: 'New Digital Onboarding and Secure Biometric Login', date: '2026-09-15', summary: 'BNB m-Token app updated with face ID and advanced biometric security layers.', link: 'https://www.bnb.bt/', location: 'Nationwide' }
    ]
  },

  // --- INSURANCE ---
  {
    id: 'ricb',
    category: 'insurance',
    entity: 'RICB (Royal Insurance Corporation of Bhutan)',
    posts: [
      { id: 'ricb-1', title: 'Instant Digital Motor Insurance Renewal Portal', date: '2026-09-16', summary: 'Policyholders can now renew comprehensive vehicle insurance online with instant QR certificate generation.', link: 'https://www.ricb.com.bt/', location: 'Nationwide' }
    ]
  },

  // --- TELECOMS ---
  {
    id: 'bt',
    category: 'telecoms',
    entity: 'Bhutan Telecom (BT)',
    posts: [
      { id: 'bt-1', title: 'Expansion of High-Speed FTTH Fiber Lines in Thimphu and Phuntsholing', date: '2026-09-19', summary: 'Gigabit-speed broadband connectivity extended to new housing colonies.', link: 'https://www.bt.bt/', location: 'Thimphu & Phuentsholing' }
    ]
  },

  // --- ROADBLOCKS / TRANSPORT ---
  {
    id: 'dost',
    category: 'roadblocks',
    entity: 'Department of Surface Transport (DoST)',
    posts: [
      { id: 'dost-1', title: 'Emergency Road Clearing Update on Gelephu-Trongsa Highway', date: '2026-09-20', summary: 'Monsoon debris cleared successfully. Traffic restored with cautionary speed limits.', link: 'https://www.moit.gov.bt/', location: 'Zhemgang-Trongsa Corridor' }
    ]
  },

  // --- DRC ---
  {
    id: 'drc',
    category: 'drc',
    entity: 'Department of Revenue and Customs (DRC)',
    posts: [
      { id: 'drc-1', title: 'Business Income Tax (BIT) Filing Deadline Reminder', date: '2026-09-18', summary: 'Taxpayers are reminded to submit reconciled financial statements through the RAMIS portal.', link: 'https://www.drc.gov.bt/', location: 'Nationwide' }
    ]
  },

  // --- TRADE ---
  {
    id: 'trade',
    category: 'trade',
    entity: 'Department of Trade',
    posts: [
      { id: 'trade-1', title: 'Export Procedures for Bhutanese Agro-Produce', date: '2026-09-17', summary: 'Simplified export licensing protocols introduced to facilitate regional market access.', link: 'https://www.moice.gov.bt/', location: 'Phuentsholing & Gelephu' }
    ]
  },

  // --- FUEL ---
  {
    id: 'fuel',
    category: 'fuel',
    entity: 'State Trading Corporation of Bhutan (STCBL - Petroleum Division)',
    posts: [
      { id: 'fuel-1', title: 'Thimphu Station (Ramtokto / Jungshina) Fuel Rates', date: '2026-09-20', summary: 'Petrol (MS): Nu. 105.44 / Litre | Diesel (HSD): Nu. 106.77 / Litre.', link: 'https://www.stcb.bt/bhutanpetroleum.php', location: 'Thimphu' }
    ]
  }
];

// --- ROADWATCH FAILURE LIST DATA (Criticality Rank 1 & 2 Only) ---
const roadWatchFailures = [
  {
    id: 'rw-1',
    code: 'RSFD-2026-089',
    highway: 'Wangdue - Trongsa Highway (Chuzomsa Section)',
    failureType: 'Major Landslide & Debris Flow',
    criticalityRank: 'Rank 1 (High Risk)',
    severityColor: '#dc2626',
    status: 'Road Blocked / Active Clearance',
    reportedDate: '2026-09-19',
    location: 'Km 142+500',
    agency: 'DoST Regional Office Nobding',
    link: 'https://roadwatch-rsfd.moit.gov.bt/rsfd/failure-list'
  },
  {
    id: 'rw-2',
    code: 'RSFD-2026-074',
    highway: 'Lateral Road (Punakha - Gasa Corridor)',
    failureType: 'Rock Slope Failure / Subsidence',
    criticalityRank: 'Rank 1 (High Risk)',
    severityColor: '#dc2626',
    status: 'Cautionary Single-Lane Transit',
    reportedDate: '2026-09-18',
    location: 'Km 48+200',
    agency: 'DoST Sub-Division Punakha',
    link: 'https://roadwatch-rsfd.moit.gov.bt/rsfd/failure-list'
  },
  {
    id: 'rw-3',
    code: 'RSFD-2026-062',
    highway: 'Phuentsholing - Thimphu Primary National Highway',
    failureType: 'Debris Slide & Mudflow',
    criticalityRank: 'Rank 2 (Medium-High Risk)',
    severityColor: '#d97706',
    status: 'Cleared with Ongoing Monitoring',
    reportedDate: '2026-09-17',
    location: 'Km 24+100 (Raxor)',
    agency: 'DoST Regional Office Phuentsholing',
    link: 'https://roadwatch-rsfd.moit.gov.bt/rsfd/failure-list'
  },
  {
    id: 'rw-4',
    code: 'RSFD-2026-051',
    highway: 'Gelephu - Trongsa Highway',
    failureType: 'Road Embankment Sinking / Slip',
    criticalityRank: 'Rank 2 (Medium-High Risk)',
    severityColor: '#d97706',
    status: 'Monitored / Heavy Machinery Deployed',
    reportedDate: '2026-09-16',
    location: 'Km 88+400',
    agency: 'DoST Regional Office Zhemgang',
    link: 'https://roadwatch-rsfd.moit.gov.bt/rsfd/failure-list'
  }
];

// API endpoint for entities list
app.get('/api/entities', (req, res) => {
  const grouped = {};
  entityDatabase.forEach(item => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push({ id: item.id, name: item.entity });
  });
  res.json(grouped);
});

// API endpoint for notifications / feeds
app.get('/api/notifications', (req, res) => {
  const { category, entity, search } = req.query;
  let allPosts = [];

  entityDatabase.forEach(group => {
    if (!category || category === 'all' || group.category === category) {
      if (!entity || entity === 'all' || group.id === entity || group.entity.toLowerCase().includes(entity.toLowerCase())) {
        group.posts.forEach(post => {
          allPosts.push({
            ...post,
            category: group.category,
            entity: group.entity,
            status: 'approved'
          });
        });
      }
    }
  });

  if (search) {
    const q = search.toLowerCase();
    allPosts = allPosts.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.summary.toLowerCase().includes(q) || 
      p.entity.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    );
  }

  res.json(allPosts);
});

// API endpoint for RoadWatch failures (Rank 1 & 2)
app.get('/api/roadwatch/failures', (req, res) => {
  res.json(roadWatchFailures);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
