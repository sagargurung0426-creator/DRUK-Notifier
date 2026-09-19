const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Structured Bhutan Public & Institutional Updates Database
const notifications = [
  // --- BANKS ---
  {
    id: 1,
    category: 'banks',
    entity: 'Bank of Bhutan (BoB)',
    title: 'Announcement on Selection Result for Various Positions',
    date: '2026-09-14',
    summary: 'BoB announced selection results and reporting instructions for IT Officers, Network Administrators, and Site Supervisors.',
    link: 'https://www.bob.bt/'
  },
  {
    id: 2,
    category: 'banks',
    entity: 'Bhutan National Bank (BNB)',
    title: 'Notice on Digital Banking Security & mBNB Upgrades',
    date: '2026-09-10',
    summary: 'BNB issues advisory regarding secure two-factor authentication and upcoming scheduled mobile banking maintenance.',
    link: 'https://www.bnb.bt/'
  },
  {
    id: 3,
    category: 'banks',
    entity: 'T-Bank',
    title: 'T-Bank SME Special Credit Facilitation Window',
    date: '2026-08-25',
    summary: 'T-Bank introduces streamlined micro and small enterprise financing packages with subsidized interest rates.',
    link: 'https://www.tbank.bt/'
  },
  {
    id: 4,
    category: 'banks',
    entity: 'Druk PNB Bank',
    title: 'Quarterly Interest Rate Revision and Deposit Schemes',
    date: '2026-09-01',
    summary: 'Druk PNB Bank announces revised fixed deposit interest rates and expanded corporate retail lending options.',
    link: 'https://www.drukpnbbank.bt/'
  },
  {
    id: 5,
    category: 'banks',
    entity: 'BDBL (Bhutan Development Bank)',
    title: 'Rural Agricultural Credit and Farm Mechanization Support',
    date: '2026-09-05',
    summary: 'BDBL rolls out simplified loan processing for seasonal farming equipment and livestock development across gewogs.',
    link: 'https://www.bdb.bt/'
  },
  {
    id: 6,
    category: 'banks',
    entity: 'DK Bank',
    title: 'Digital Gold Token (TER) Trading & Settlement Notice',
    date: '2026-08-21',
    summary: 'DK Bank provides operational guidelines for Gelephu Mindfulness City digital gold token transactions and liquidity windows.',
    link: 'https://www.dkbank.bt/'
  },

  // --- TELECOMS ---
  {
    id: 7,
    category: 'telecoms',
    entity: 'Bhutan Telecom (BT)',
    title: 'Shortlisted Candidates for Technical & Administrative Roles',
    date: '2026-09-01',
    summary: 'Bhutan Telecom published shortlisted candidate details following recent recruitment exams.',
    link: 'https://www.bt.bt/'
  },
  {
    id: 8,
    category: 'telecoms',
    entity: 'TashiCell',
    title: '4G/5G Network Expansion and Data Pack Revamp',
    date: '2026-09-12',
    summary: 'TashiCell announces expanded high-speed coverage across remote gewogs and introduces high-volume night data bundles.',
    link: 'https://www.tashicell.com/'
  },

  // --- INSURANCE COMPANIES ---
  {
    id: 9,
    category: 'insurance',
    entity: 'RICB',
    title: 'Special Rebate Scheme 2.0 – Notice to Listed Borrowers',
    date: '2026-08-21',
    summary: 'RICB announces Special Rebate Scheme 2.0 guidelines and outstanding policy lists for eligible beneficiaries.',
    link: 'https://www.ricb.bt/'
  },
  {
    id: 10,
    category: 'insurance',
    entity: 'Bhutan Insurance Limited (BIL)',
    title: 'Comprehensive Motor and Health Insurance Online Claims',
    date: '2026-09-08',
    summary: 'BIL launches instant digital claim processing portal for vehicle accidents and medical reimbursements.',
    link: 'https://www.bhutaninsurance.com.bt/'
  },

  // --- ROADBLOCKS & TRAFFIC ---
  {
    id: 11,
    category: 'roadblocks',
    entity: 'Royal Bhutan Police (Traffic)',
    title: 'Monsoon Highway Roadblock Updates & Restoration Status',
    date: '2026-09-18',
    summary: 'RBP and Department of Surface Transport report active clearance work along lateral roads; check schedules before departure.',
    link: 'https://rbp.gov.bt/'
  },
  {
    id: 12,
    category: 'roadblocks',
    entity: 'Royal Bhutan Police (Traffic)',
    title: 'Thimphu-Phuentsholing Highway Safe Travel Advisory',
    date: '2026-09-15',
    summary: 'Traffic division notifies specific timing windows for heavy vehicles and landslide-prone sectors near Chukha.',
    link: 'https://rbp.gov.bt/'
  },

  // --- MINISTRIES ---
  {
    id: 13,
    category: 'ministries',
    entity: 'Ministry of Finance (MoF)',
    title: 'Business Income Tax (BIT) Filing Guidelines for 2026',
    date: '2026-08-30',
    summary: 'Department of Revenue and Customs issues clarification on electronic tax filing deadlines and ledger reconciliation.',
    link: 'https://www.mof.gov.bt/'
  },
  {
    id: 14,
    category: 'ministries',
    entity: 'Ministry of Infrastructure and Transport',
    title: 'Public Transport Fare Adjustments & Route Permits',
    date: '2026-09-02',
    summary: 'MoIT releases updated inter-dzongkhag bus schedules and standardized passenger fare structures.',
    link: 'https://www.moit.gov.bt/'
  },

  // --- DZONGKHAGS ---
  {
    id: 15,
    category: 'dzongkhags',
    entity: 'Thimphu Thromde',
    title: 'Municipal Waste Collection Schedule & Water Maintenance',
    date: '2026-09-16',
    summary: 'Thromde office publishes revised garbage truck timings and temporary zone water shutdowns for pipeline upgrades.',
    link: 'https://www.thimphu.gov.bt/'
  },
  {
    id: 16,
    category: 'dzongkhags',
    entity: 'Chukha Dzongkhag Administration',
    title: 'Gewog Development Grant Allocation and Consultation',
    date: '2026-09-10',
    summary: 'Chukha Dzongkhag invites local stakeholders for developmental budget reviews and agricultural project updates.',
    link: 'https://www.chukha.gov.bt/'
  }
];

// API Endpoints
app.get('/api/notifications', (req, res) => {
  const { category, entity, search } = req.query;
  let results = [...notifications];

  if (category && category !== 'all') {
    results = results.filter(n => n.category === category);
  }

  if (entity && entity !== 'all') {
    results = results.filter(n => n.entity.toLowerCase().includes(entity.toLowerCase()));
  }

  if (search) {
    const query = search.toLowerCase();
    results = results.filter(n => 
      n.title.toLowerCase().includes(query) || 
      n.summary.toLowerCase().includes(query) ||
      n.entity.toLowerCase().includes(query)
    );
  }

  res.json(results);
});

app.get('/api/entities', (req, res) => {
  const entitiesByCategory = {
    banks: ['Bank of Bhutan (BoB)', 'Bhutan National Bank (BNB)', 'T-Bank', 'Druk PNB Bank', 'BDBL (Bhutan Development Bank)', 'DK Bank'],
    telecoms: ['Bhutan Telecom (BT)', 'TashiCell'],
    insurance: ['RICB', 'Bhutan Insurance Limited (BIL)'],
    roadblocks: ['Royal Bhutan Police (Traffic)', 'Department of Surface Transport'],
    ministries: ['Ministry of Finance (MoF)', 'Ministry of Infrastructure and Transport'],
    dzongkhags: ['Thimphu Thromde', 'Chukha Dzongkhag Administration']
  };
  res.json(entitiesByCategory);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
