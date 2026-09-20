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

  // --- DZONGKHAGS (20 Dzongkhags represented with top hubs) ---
  {
    id: 'thimphu-thromde',
    category: 'dzongkhags',
    entity: 'Thimphu Thromde',
    posts: [
      { id: 'tt-1', title: 'Municipal Waste Collection Schedule Update for Autumn', date: '2026-09-19', summary: 'Revised zoning timetable for green and dry waste segregation pickup across residential precincts.', link: 'https://www.thimphu.gov.bt/', location: 'Thimphu Thromde' },
      { id: 'tt-2', title: 'Notice on Urban Land demarcation and Development Permits', date: '2026-09-14', summary: 'Advisory on building blueprint approvals and municipal compliance norms for construction.', link: 'https://www.thimphu.gov.bt/', location: 'Thimphu' },
      { id: 'tt-3', title: 'Tender Call for Stormwater Drainage Upgradation', date: '2026-09-02', summary: 'Sealed bids invited from registered contractors for urban drainage rehabilitation works.', link: 'https://www.thimphu.gov.bt/', location: 'North Thimphu' }
    ]
  },
  {
    id: 'chukha-dzongkhag',
    category: 'dzongkhags',
    entity: 'Chukha Dzongkhag Administration',
    posts: [
      { id: 'cd-1', title: 'Phuentsholing-Chukha Regional Development Review', date: '2026-09-15', summary: 'Dzongkhag Tshogdue resolves priority rural farm road blacktopping and irrigation projects.', link: 'https://www.chukha.gov.bt/', location: 'Chukha' },
      { id: 'cd-2', title: 'Vacancy Announcement for LBA and Support Staff', date: '2026-09-10', summary: 'Recruitment notice for administrative assistants and local service personnel.', link: 'https://www.chukha.gov.bt/', location: 'Chukha' }
    ]
  },
  {
    id: 'paro-dzongkhag',
    category: 'dzongkhags',
    entity: 'Paro Dzongkhag Administration',
    posts: [
      { id: 'pd-1', title: 'Cultural Heritage Preservation Guidelines for Tourism Season', date: '2026-09-18', summary: 'Strict waste management and visitor etiquette enforced around historical monastic structures.', link: 'https://www.paro.gov.bt/', location: 'Paro' }
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
      { id: 'bnb-1', title: 'New Digital Onboarding and Secure Biometric Login', date: '2026-09-15', summary: 'BNB m-Token app updated with face ID and advanced biometric security layers.', link: 'https://www.bnb.bt/', location: 'Nationwide' },
      { id: 'bnb-2', title: 'Vacancy for Assistant Relationship Managers', date: '2026-09-09', summary: 'Dynamic banking professionals sought for branch expansion operations.', link: 'https://www.bnb.bt/', location: 'Thimphu & Phuentsholing' }
    ]
  },

  // --- INSURANCE ---
  {
    id: 'ricb',
    category: 'insurance',
    entity: 'RICB (Royal Insurance Corporation of Bhutan)',
    posts: [
      { id: 'ricb-1', title: 'Instant Digital Motor Insurance Renewal Portal', date: '2026-09-16', summary: 'Policyholders can now renew comprehensive vehicle insurance online with instant QR certificate generation.', link: 'https://www.ricb.com.bt/', location: 'Nationwide' },
      { id: 'ricb-2', title: 'Life Insurance Dividend Declaration for 2025-2026', date: '2026-09-03', summary: 'Annual bonus rates announced for all participating life insurance policy beneficiaries.', link: 'https://www.ricb.com.bt/', location: 'Head Office' }
    ]
  },

  // --- TELECOMS ---
  {
    id: 'bt',
    category: 'telecoms',
    entity: 'Bhutan Telecom (BT)',
    posts: [
      { id: 'bt-1', title: 'Expansion of High-Speed FTTH Fiber Lines in Thimphu and Phuntsholing', date: '2026-09-19', summary: 'Gigabit-speed broadband connectivity extended to new housing colonies.', link: 'https://www.bt.bt/', location: 'Thimphu & Phuentsholing' },
      { id: 'bt-2', title: '5G Data Package Promotions and Roaming Upgrades', date: '2026-09-10', summary: 'New international roaming data bundles introduced for regional travelers.', link: 'https://www.bt.bt/', location: 'Nationwide' }
    ]
  },
  {
    id: 'tashicell',
    category: 'telecoms',
    entity: 'TashiCell',
    posts: [
      { id: 'tc-1', title: '4G LTE Network Optimization Across Eastern Dzongkhags', date: '2026-09-17', summary: 'Tower capacity upgrades completed in Trashigang, Mongar, and Samdrup Jongkhar.', link: 'https://www.tashicell.com/', location: 'Eastern Region' }
    ]
  },

  // --- ROADBLOCKS / TRANSPORT ---
  {
    id: 'dost',
    category: 'roadblocks',
    entity: 'Department of Surface Transport (DoST)',
    posts: [
      { id: 'dost-1', title: 'Emergency Road Clearing Update on Gelephu-Trongsa Highway', date: '2026-09-20', summary: 'Monsoon debris cleared successfully. Traffic restored with cautionary speed limits.', link: 'https://www.moit.gov.bt/', location: 'Zhemgang-Trongsa Corridor' },
      { id: 'dost-2', title: 'Weight Bridge Regulations and Axle Load Monitoring', date: '2026-09-12', summary: 'Strict enforcement of legal load limits for heavy commercial freight trucks.', link: 'https://www.moit.gov.bt/', location: ' Phuentsholing Checkpost' }
    ]
  },

  // --- NEW TAB: DRC (Department of Revenue and Customs) ---
  {
    id: 'drc',
    category: 'drc',
    entity: 'Department of Revenue and Customs (DRC)',
    posts: [
      { id: 'drc-1', title: 'Business Income Tax (BIT) Filing Deadline Reminder', date: '2026-09-18', summary: 'Taxpayers are reminded to submit reconciled financial statements through the RAMIS portal.', link: 'https://www.drc.gov.bt/', location: 'Nationwide' },
      { id: 'drc-2', title: 'Customs Tariff Harmonization Guidelines for Importers', date: '2026-09-10', summary: 'Updated schedule of sales tax and customs duty exemptions for green technology imports.', link: 'https://www.drc.gov.bt/', location: 'All Regional Offices' },
      { id: 'drc-3', title: 'GST Implementation and Compliance Circular', date: '2026-09-01', summary: 'Clarifications on e-invoice generation and mandatory registration thresholds for commercial entities.', link: 'https://www.drc.gov.bt/', location: 'Thimphu' }
    ]
  },

  // --- NEW TAB: TRADE ---
  {
    id: 'trade',
    category: 'trade',
    entity: 'Department of Trade',
    posts: [
      { id: 'trade-1', title: 'Export Procedures for Bhutanese Agro-Produce', date: '2026-09-17', summary: 'Simplified export licensing protocols introduced to facilitate regional market access.', link: 'https://www.moice.gov.bt/', location: 'Phuentsholing & Gelephu' },
      { id: 'trade-2', title: 'Foreign Direct Investment (FDI) Policy Guidelines', date: '2026-09-08', summary: 'New fast-track approval mechanisms for manufacturing and IT-enabled service investments.', link: 'https://www.moice.gov.bt/', location: 'Thimphu' }
    ]
  },

  // --- NEW TAB: FUEL PRICE UPDATES ---
  {
    id: 'fuel',
    category: 'fuel',
    entity: 'State Trading Corporation of Bhutan (STCBL - Petroleum Division)',
    posts: [
      { id: 'fuel-1', title: 'Thimphu Station (Ramtokto / Jungshina) Fuel Rates', date: '2026-09-20', summary: 'Petrol (MS): Nu. 105.44 / Litre | Diesel (HSD): Nu. 106.77 / Litre. Rates effective immediately.', link: 'https://www.stcb.bt/bhutanpetroleum.php', location: 'Thimphu' },
      { id: 'fuel-2', title: 'Phuentsholing Station (Chamkuna) Fuel Rates', date: '2026-09-20', summary: 'Petrol (MS): Nu. 102.48 / Litre | Diesel (HSD): Nu. 103.95 / Litre.', link: 'https://www.stcb.bt/bhutanpetroleum.php', location: 'Phuentsholing' },
      { id: 'fuel-3', title: 'Wangduephodrang & Punakha Station (Nobding) Rates', date: '2026-09-20', summary: 'Petrol (MS): Nu. 107.34 / Litre | Diesel (HSD): Nu. 108.60 / Litre.', link: 'https://www.stcb.bt/bhutanpetroleum.php', location: 'Wangdue / Punakha' },
      { id: 'fuel-4', title: 'Bumthang Station (Chumey) Fuel Rates', date: '2026-09-20', summary: 'Petrol (MS): Nu. 109.61 / Litre | Diesel (HSD): Nu. 111.01 / Litre.', link: 'https://www.stcb.bt/bhutanpetroleum.php', location: 'Bumthang' }
    ]
  }
];

// --- API ENDPOINT: Get entities list for tab dropdowns ---
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

// --- API ENDPOINT: Get live notifications / feeds filtered by category & entity ---
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
