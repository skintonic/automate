export interface SampleDigest {
  id: string;
  name: string;
  sender: string;
  subject: string;
  date: string;
  description: string;
  rawText: string;
}

export const SAMPLE_DIGESTS: SampleDigest[] = [
  {
    id: 'digest-morning-health',
    name: 'HARO Medical & Healthcare Morning Edition (Multi-Brand Mix)',
    sender: 'haro@helpareporter.com',
    subject: 'HARO Digest: Healthcare, Wellness & Lifestyle — August 18 Edition',
    date: '2026-08-18 07:15 AM EST',
    description: 'Comprehensive digest featuring sexual health, medspa aesthetics, primary care, a "No AI" restricted query, a PR-banned query, and an irrelevant business query.',
    rawText: `
From: HARO <haro@helpareporter.com>
Subject: HARO Digest: Healthcare, Wellness & Lifestyle — August 18 Edition
Date: Tue, 18 Aug 2026 07:15:00 -0400
Reply-To: haro-digest-noreply@helpareporter.com

*****************************************************************
HARO (Help A Reporter Out) / Connectively Daily Digest
*****************************************************************

1) Summary: Emerging non-drug therapies for erectile dysfunction and vasculogenic health
Category: Men's Health & Wellness
Media Outlet: Men's Health Journal / Peak Health
Journalist: David Vance
Email: reply-984210@helpareporter.net
Deadline: 2026-08-19 5:00 PM EST
Query URL: https://app.connectively.us/queries/984210
Query:
Looking to interview medical directors or urological/sexual health specialists on how low-intensity acoustic wave therapy (shockwave) compares to traditional daily PDE5 medications for treating vasculogenic ED. What are the clinical mechanisms for tissue regeneration and blood flow? Looking for a clear 1-2 sentence core clinical takeaway and availability for brief follow-up.

-----------------------------------------------------------------

2) Summary: The shift towards 'Micro-Tox' and preventative neuromodulators in under-35 patients
Category: Beauty & Aesthetics
Media Outlet: Allure / Modern Aesthetics Insider
Journalist: Elena Rostova
Email: reply-774102@helpareporter.net
Deadline: 2026-08-19 3:00 PM EST
Link: https://www.helpareporter.com/query/774102
Query:
Writing a feature on subtle preventative Botox and neurotoxin techniques among millennial/Gen-Z patients. Looking for insights from medspa clinicians or aesthetic practitioners. Why are heavy freeze doses losing popularity to micro-dosing? Please provide a quick direct insight and practitioner credentials.

-----------------------------------------------------------------

3) Summary: Five critical blood tests most adults overlook during routine annual physicals
Category: General Medicine & Family Health
Media Outlet: Forbes Health / Everyday Wellness
Journalist: Sarah Jenkins
Email: reply-652391@helpareporter.net
Deadline: 2026-08-20 12:00 PM EST
Query URL: https://app.connectively.us/queries/652391
Query:
I'm writing a comprehensive guide for primary care patients. Looking for a board-certified primary care physician / MD to share the most underutilized diagnostic lab panels (such as ApoB, hs-CRP, or fasting insulin) that catch metabolic and cardiovascular risks years before standard basic panels. Quick actionable advice preferred.

-----------------------------------------------------------------

4) Summary: Treating adult hormonal acne and compromised skin barriers after aggressive clinical treatments
Category: Skincare & Dermatology
Media Outlet: Harper's Bazaar Beauty Desk
Journalist: Marcus Thorne
Email: reply-552140@helpareporter.net
Deadline: 2026-08-19 1:00 PM EST
Link: https://www.helpareporter.com/query/552140
Query:
URGENT: What are the biggest mistakes patients make trying to repair a destroyed skin barrier after chemical peels or retinoid overuse?
RESTRICTION NOTE: NO AI PITCHES CONSIDERED. Any robotic or AI-generated responses will be discarded immediately without review. Only human-written, authentic expert submissions accepted.

-----------------------------------------------------------------

5) Summary: Personal experiences with workplace burnout recovery
Category: Career & Lifestyle
Media Outlet: Fortune WorkLife
Journalist: Chloe Miller
Email: reply-441209@helpareporter.net
Deadline: 2026-08-18 6:00 PM EST
Query:
Seeking first-person stories from corporate employees who took a sabbatical for severe burnout. 
STRICT RULE: NO PR AGENCIES OR THIRD-PARTY PITCHES. We only want direct emails from the actual employee affected, no marketing managers.

-----------------------------------------------------------------

6) Summary: Navigating Chapter 11 corporate restructuring in the commercial retail sector
Category: Business & Bankruptcy Law
Media Outlet: Corporate Finance Review
Journalist: Bradley Sterling
Email: reply-330198@helpareporter.net
Deadline: 2026-08-21 5:00 PM EST
Query:
Must be a licensed commercial bankruptcy attorney with 15+ years restructuring experience. No other professions or general business consultants considered with no exceptions.
`
  },
  {
    id: 'digest-connectively-afternoon',
    name: 'Connectively Afternoon Alert (Aesthetics & Longevity)',
    sender: 'alerts@connectively.us',
    subject: 'Connectively Media Leads — Longevity, Aesthetics & Primary Care',
    date: '2026-08-18 01:30 PM EST',
    description: 'Targeted afternoon queries covering laser skin resurfacing, testosterone optimization in primary care, and Peyronie’s disease treatments.',
    rawText: `
From: Connectively Alerts <alerts@connectively.us>
Subject: Connectively Media Leads — Longevity, Aesthetics & Primary Care
Date: Tue, 18 Aug 2026 13:30:00 -0400
Reply-To: leads-noreply@connectively.us

Connectively Press Opportunities:

1) Title: Non-invasive therapeutic breakthroughs for Peyronie's disease curvature and plaque
Outlet: Urology & Men's Health Monthly
Reporter: Dr. Keith Bennett
Email: pitch-response-8104@connectively.us
Deadline: 2026-08-20 6:00 PM EST
Query URL: https://app.connectively.us/queries/8104
Query:
Seeking men's sexual health clinical directors experienced in acoustic wave protocol combinations for treating fibrous plaque in Peyronie's disease without surgery. What realistic outcomes should patients anticipate? Please give a direct clinical perspective.

-----------------------------------------------------------------

2) Title: Preparing skin for RF microneedling: Pre-treatment protocols that prevent hyperpigmentation
Outlet: NewBeauty Magazine
Reporter: Claire Montgomery
Email: pitch-response-9231@connectively.us
Deadline: 2026-08-19 4:30 PM EST
Query URL: https://app.connectively.us/queries/9231
Query:
What topical actives should patients stop 7 days before radiofrequency microneedling, and what barrier-supporting serums prevent post-inflammatory hyperpigmentation? Need input from an experienced medical spa practitioner.

-----------------------------------------------------------------

3) Title: Why primary care doctors are becoming the first line of defense for cardiovascular longevity
Outlet: WebMD / Medscape Patient Edition
Reporter: Jonathan Lee
Email: pitch-response-4982@connectively.us
Deadline: 2026-08-22 11:00 AM EST
Query URL: https://app.connectively.us/queries/4982
Query:
Interviewing primary care MDs on why routine checkups should transition from reactive symptom management to proactive longevity medicine. How do you assess arterial elasticity and metabolic fitness during standard appointments?
`
  }
];
