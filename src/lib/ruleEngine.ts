import { HaroQuery } from '../types';
import { getCuratedJournalistIntel } from './journalistIntel';

/**
 * STRICT SCOPE & ANTI-HALLUCINATION HARO EVALUATOR
 *
 * Enforces:
 * 1. STRICT SCOPE RULE: Only Performance P-Wave, Skin & Tonic, or Dr. Croley's Primary Care.
 *    Off-scope topics (pharmacists, toxicologists, microbiologists, rheumatologists, chefs, pets,
 *    real estate, cybersecurity, education, business) are skipped/disqualified immediately.
 * 2. ANTI-HALLUCINATION RULE: Only real query text. Extracts exact journalist, outlet, deadline,
 *    and reply+ address. If any of the 4 is missing/unclear, flags it without drafting a pitch.
 * 3. HARD DISQUALIFIERS: Rejects "no PR / no third-parties" or specific outside credentials with "no alternatives".
 * 4. BRAND ASSIGNMENT:
 *    - Sexual health, ED, testosterone, men's performance → Performance P-Wave
 *    - Skincare, injectables, facial aesthetics, anti-aging, med spa → Skin & Tonic
 *    - General/preventive health, cardiometabolic screening, family medicine, checkups → Dr. Croley's Primary Care
 * 5. COMPLIANCE RULE:
 *    - Strictly hedged claims ("may help", "is designed to support", "some patients report").
 *    - Never use "will cure", "will fix", "guarantees", or "transforms".
 *    - Zero invented statistics, percentages, or studies.
 *    - Pitches kept to 3-5 sentences.
 */

export function parseAndEvaluateQueriesRuleBased(rawText: string): HaroQuery[] {
  if (!rawText) return [];

  // Remove common email headers/footers to avoid borrowing unrelated subscription/signup text
  const cleanedText = rawText
    .replace(/^From:[\s\S]*?Reply-To:[^\n\r]*\n/gi, '')
    .replace(/You are receiving this email because you subscribed[\s\S]*$/gi, '')
    .replace(/To unsubscribe, update preferences[\s\S]*$/gi, '');

  // Split into distinct numbered or delimited query blocks
  const rawBlocks = cleanedText
    .split(/(?:-{4,}|={4,}|\*{4,}|\n(?=\d+\)\s)|\n(?=\d+\.\s)|\n(?=\bSummary:)|(?=\bQuery \d+:)|(?=\bPress Opportunity \d+:)|(?=\bTitle:))/gi)
    .map((b) => b.trim())
    .filter((b) => b.length > 25);

  const queries: HaroQuery[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];

    // Filter out pure header/banner fragments
    if (
      block.length < 50 &&
      (block.toLowerCase().includes('connectively press opportunities') ||
        block.toLowerCase().includes('daily digest') ||
        block.toLowerCase().includes('help a reporter out'))
    ) {
      continue;
    }

    // --- ANTI-HALLUCINATION: Extract explicit metadata fields from this block only ---
    const queryNumMatch = block.match(/^(\d+)[\).]/m) || block.match(/^(?:Query|Press Opportunity)\s*(\d+)[:.]/i);
    const queryNum = queryNumMatch ? queryNumMatch[1] : `${i + 1}`;

    const titleMatch =
      block.match(/(?:Summary|Title|Topic|Headline):\s*([^\n\r]+)/i) ||
      block.match(/^\d+[\).]\s*(?:Summary:\s*)?([^\n\r]+)/m) ||
      block.match(/^(?:Summary:\s*)?([^\n\r]{10,120})/);
    const title = titleMatch ? titleMatch[1].trim() : `Query #${queryNum}`;

    const outletMatch = block.match(/(?:Media Outlet|Outlet|Publication|Source):\s*([^\n\r]+)/i);
    const mediaOutlet = outletMatch ? outletMatch[1].trim() : '';

    const journalistMatch = block.match(/(?:Journalist|Reporter|Author|Name):\s*([^\n\r]+)/i);
    const journalist = journalistMatch ? journalistMatch[1].trim() : '';

    const emailMatch = block.match(
      /([a-zA-Z0-9_.+-]+@(?:helpareporter\.(?:com|net)|connectively\.us|[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+))/i
    );
    const email = emailMatch ? emailMatch[1].trim() : '';

    const deadlineMatch = block.match(/(?:Deadline|Due Date|Due):\s*([^\n\r]+)/i);
    const deadline = deadlineMatch ? deadlineMatch[1].trim() : '';

    // Extract explicit query URL or fallback to standard portal query link
    const urlExplicitMatch =
      block.match(/(?:Query URL|Query Link|Link|URL|Source Link|View Online|View Query):\s*(https?:\/\/[^\s<>"'\)]+)/i) ||
      block.match(/(https?:\/\/(?:www\.)?(?:helpareporter\.com|connectively\.us|app\.connectively\.us)[^\s<>"'\)]*)/i) ||
      block.match(/(https?:\/\/[^\s<>"'\)]+)/i);

    let queryUrl = urlExplicitMatch ? urlExplicitMatch[1].trim() : '';
    if (!queryUrl) {
      const emailIdMatch = email.match(/reply-([a-zA-Z0-9_-]+)@/i);
      if (emailIdMatch) {
        queryUrl = email.includes('connectively')
          ? `https://app.connectively.us/queries/${emailIdMatch[1]}`
          : `https://www.helpareporter.com/query/${emailIdMatch[1]}`;
      } else {
        queryUrl = `https://app.connectively.us/queries/${queryNum}`;
      }
    }

    let deadlineTimestamp = Date.parse(deadline);
    if (isNaN(deadlineTimestamp)) {
      deadlineTimestamp = Date.now() + (i + 1) * 3600 * 1000 * 12;
    }

    const queryReqMatch = block.match(/(?:Query|Requirements|Details|Pitch):\s*([\s\S]+)/i);
    const queryRequirements = queryReqMatch ? queryReqMatch[1].trim() : block;

    const lower = (title + ' ' + queryRequirements).toLowerCase();

    // =========================================================================
    // STEP 1: SCOPE, DISQUALIFIER & ANTI-HALLUCINATION METADATA CHECKS
    // =========================================================================
    let step1_status: 'APPROVED' | 'REJECTED' = 'APPROVED';
    let step1_rejectionReason = '';

    // Check Anti-Hallucination rule: Real journalist, outlet, deadline, and reply+ email must exist
    const hasMissingCoreMeta = !mediaOutlet || !journalist || !email || !deadline;
    if (hasMissingCoreMeta) {
      step1_status = 'REJECTED';
      const missingParts: string[] = [];
      if (!mediaOutlet) missingParts.push('media outlet');
      if (!journalist) missingParts.push('journalist name');
      if (!email) missingParts.push('reply+ email address');
      if (!deadline) missingParts.push('deadline');
      step1_rejectionReason = `Anti-Hallucination Flag: Missing or unclear metadata (${missingParts.join(', ')}).`;
    }
    // Hard Disqualifier 1: Third-party PR bans
    else if (
      lower.includes('no pr') ||
      lower.includes('no agencies') ||
      lower.includes('no third-party') ||
      lower.includes('no third party') ||
      lower.includes('not accepting pitches from third parties') ||
      lower.includes('no pr companies') ||
      lower.includes('direct patient sources only') ||
      lower.includes('only direct employees') ||
      lower.includes('actual employee affected')
    ) {
      step1_status = 'REJECTED';
      step1_rejectionReason = 'Disqualified: Explicitly states not accepting pitches from third parties or PR companies.';
    }
    // Hard Disqualifier 2: Required credentials outside our 3 practices with "no alternatives"
    else if (
      (lower.includes('must be a licensed') || lower.includes('must be a') || lower.includes('seeking a')) &&
      (lower.includes('pharmacist') ||
        lower.includes('toxicologist') ||
        lower.includes('microbiologist') ||
        lower.includes('rheumatologist') ||
        lower.includes('veterinarian') ||
        lower.includes('bankruptcy attorney') ||
        lower.includes('cpa') ||
        lower.includes('pilot')) &&
      (lower.includes('no alternatives') || lower.includes('no other') || lower.includes('no exceptions') || lower.includes('strictly'))
    ) {
      step1_status = 'REJECTED';
      step1_rejectionReason =
        'Disqualified: Requires specific outside credentials (pharmacist, toxicologist, attorney, CPA) with no alternatives accepted.';
    }
    // Strict Scope Rule: Must fall CLEARLY within one of our three medical practices
    else {
      const isPWaveScope =
        lower.includes('ed') ||
        lower.includes('erectile') ||
        lower.includes('sexual health') ||
        lower.includes('shockwave') ||
        lower.includes('acoustic wave') ||
        lower.includes('peyronie') ||
        lower.includes('testosterone') ||
        lower.includes("men's health") ||
        lower.includes("men's performance") ||
        lower.includes('vasculogenic') ||
        lower.includes('penile') ||
        lower.includes('male vitality');

      const isSkinTonicScope =
        lower.includes('botox') ||
        lower.includes('filler') ||
        lower.includes('facial') ||
        lower.includes('aesthetic') ||
        lower.includes('skincare') ||
        lower.includes('skin barrier') ||
        lower.includes('micro-tox') ||
        lower.includes('chemical peel') ||
        lower.includes('microneedling') ||
        lower.includes('retinoid') ||
        lower.includes('med spa') ||
        lower.includes('medspa') ||
        lower.includes('dermatology') ||
        lower.includes('anti-aging') ||
        lower.includes('acne') ||
        lower.includes('hyperpigmentation') ||
        lower.includes('collagen');

      const isCroleyScope =
        lower.includes('primary care') ||
        lower.includes('general physician') ||
        lower.includes('family medicine') ||
        lower.includes('preventive health') ||
        lower.includes('prevention') ||
        lower.includes('checkup') ||
        lower.includes('annual physical') ||
        lower.includes('blood test') ||
        lower.includes('lab panel') ||
        lower.includes('cardiometabolic') ||
        lower.includes('cardiovascular') ||
        lower.includes('hypertension') ||
        lower.includes('cholesterol') ||
        lower.includes('glucose') ||
        lower.includes('longevity') ||
        (lower.includes('doctor') && lower.includes('health'));

      const isOffScope =
        lower.includes('pharmacist') ||
        lower.includes('toxicologist') ||
        lower.includes('microbiologist') ||
        lower.includes('rheumatologist') ||
        lower.includes('chef') ||
        lower.includes('recipe') ||
        lower.includes('pet') ||
        lower.includes('real estate') ||
        lower.includes('cybersecurity') ||
        lower.includes('crypto') ||
        lower.includes('education curriculum') ||
        lower.includes('bankruptcy');

      if ((!isPWaveScope && !isSkinTonicScope && !isCroleyScope) || isOffScope) {
        step1_status = 'REJECTED';
        step1_rejectionReason =
          'Out of Scope: Topic falls outside sexual health, medical aesthetics, and primary care (e.g. pharmacy, toxicology, real estate, pets, cybersecurity).';
      }
    }

    // =========================================================================
    // STEP 2: BRAND ASSIGNMENT (Only after Scope + Disqualifier checks pass)
    // =========================================================================
    let step2_brand: 'Performance P-Wave' | 'Skin & Tonic' | "Dr. Croley's" | 'None' = 'None';
    let step2_expertTitle = '';

    if (step1_status === 'APPROVED') {
      const pwaveScore = (
        lower.match(
          /erectile|ed\b|sexual health|shockwave|acoustic wave|p-wave|peyronie|men\'s health|vasculogenic|penile|male vitality|testosterone/g
        ) || []
      ).length;
      const skintonicScore = (
        lower.match(
          /botox|toxin|filler|facial|aesthetic|med spa|medspa|skincare|skin barrier|retinoid|microneedling|chemical peel|acne|hyperpigmentation|anti-aging|collagen/g
        ) || []
      ).length;
      const croleyScore = (
        lower.match(
          /primary care|physician|doctor|family medicine|preventive|checkup|blood test|lab panel|annual physical|cardiovascular|cardiometabolic|hypertension|glucose|longevity|apob|cholesterol/g
        ) || []
      ).length;

      if (pwaveScore >= skintonicScore && pwaveScore >= croleyScore && pwaveScore > 0) {
        step2_brand = 'Performance P-Wave';
        step2_expertTitle = "Dr. Croley, Medical Director & Men's Sexual Health Specialist";
      } else if (skintonicScore >= pwaveScore && skintonicScore >= croleyScore && skintonicScore > 0) {
        step2_brand = 'Skin & Tonic';
        step2_expertTitle = 'Rixie & Clinical Aesthetics Team, Skin & Tonic';
      } else {
        step2_brand = "Dr. Croley's";
        step2_expertTitle = "Dr. Croley, MD, Board-Certified Physician (Dr. Croley's Primary Care)";
      }
    }

    // =========================================================================
    // STEP 3: "NO AI PITCHES" RESTRICTION CHECK
    // =========================================================================
    const hasAiRestriction =
      lower.includes('no ai') ||
      lower.includes('no ai pitches') ||
      lower.includes('no ai-generated') ||
      lower.includes('ai responses rejected') ||
      lower.includes('human pitches only') ||
      lower.includes('human-written');

    const step3_note = hasAiRestriction ? 'MANUAL PITCH REQUIRED — do not auto-draft AI-style' : undefined;

    // =========================================================================
    // STEP 4: COMPLIANT PITCH DRAFTING (Hedged Language, 3-5 Sentences, No Fake Stats)
    // =========================================================================
    let step4_pitchSubject = '';
    let step4_pitchBody = '';
    let step4_teaserInsight = '';

    if (step1_status === 'APPROVED') {
      const firstName = journalist.split(' ')[0] || 'there';

      if (hasAiRestriction) {
        step4_pitchSubject = `[MANUAL PITCH REQUIRED] Query #${queryNum}: ${title}`;
        step4_pitchBody = 'MANUAL PITCH REQUIRED — do not auto-draft AI-style';
      } else if (step2_brand === 'Performance P-Wave') {
        step4_teaserInsight =
          'Acoustic wave therapy is designed to support microvascular blood flow and tissue remodeling through cellular mechanotransduction, which may help address underlying vascular factors in erectile wellness.';
        step4_pitchSubject = `HARO: Non-invasive acoustic wave protocols for vasculogenic ED — Dr. Croley, Performance P-Wave`;
        step4_pitchBody =
          `Hi ${firstName},\n\n` +
          `Regarding your piece for ${mediaOutlet || "your publication"}: Low-intensity acoustic shockwave therapy is designed to support tissue remodeling and microvascular circulation through cellular mechanotransduction. ` +
          `In clinical practice, our team observes that this non-invasive approach may help address root vascular factors rather than providing temporary pharmaceutical vasodilation alone. ` +
          `Dr. Croley, Medical Director & Men's Sexual Health Specialist at Performance P-Wave, is available for quotes or a brief follow-up before your deadline.\n\n` +
          `Best regards,\nPR & Communications Team\nPerformance P-Wave`;
      } else if (step2_brand === 'Skin & Tonic') {
        step4_teaserInsight =
          'Preventative micro-dosing and targeted lipid barrier support may help soften dynamic expression lines while protecting dermal elasticity before deep static creasing develops.';
        step4_pitchSubject = `HARO: Clinical perspective on ${title} — Skin & Tonic`;
        step4_pitchBody =
          `Hi ${firstName},\n\n` +
          `Regarding your story for ${mediaOutlet || "your outlet"}: Preventative micro-dosing and targeted barrier restoration are designed to support natural facial mobility while helping preserve collagen structure. ` +
          `Our aesthetic clinicians observe that subtle dosing strategies may help patients maintain authentic expression while mitigating early texture breakdown. ` +
          `Rixie and the clinical aesthetic team at Skin & Tonic Medical Spa are available to provide practitioner insights and practical recommendations before your deadline.\n\n` +
          `Warm regards,\nPR & Communications Team\nSkin & Tonic`;
      } else {
        step4_teaserInsight =
          'Incorporating advanced cardiometabolic markers such as ApoB, hs-CRP, and fasting insulin into routine checkups may help clinicians detect early cardiovascular and insulin resistance trends years before standard basic panels.';
        step4_pitchSubject = `HARO: Proactive diagnostic screening in primary care — Dr. Croley's Primary Care`;
        step4_pitchBody =
          `Hi ${firstName},\n\n` +
          `Regarding your query for ${mediaOutlet || "your outlet"}: Comprehensive cardiometabolic screenings with markers like ApoB and fasting insulin may help uncover early arterial risk and metabolic changes well before standard basic panels flag symptoms. ` +
          `In family medicine practice, integrating proactive biomarker testing is designed to support long-term preventive health and personalized lifestyle interventions. ` +
          `Dr. Croley, MD (Board-Certified Physician at Dr. Croley's Primary Care), is available for a quick interview or email Q&A ahead of your deadline.\n\n` +
          `Best regards,\nPR & Communications Team\nDr. Croley's Primary Care`;
      }
    }

    queries.push({
      id: `query-${queryNum}`,
      title,
      mediaOutlet: mediaOutlet || 'Unspecified Media Outlet',
      journalist: journalist || 'Staff Reporter',
      email: email || 'reply-haro@helpareporter.net',
      deadline: deadline || '2026-08-20 5:00 PM EST',
      deadlineTimestamp,
      queryUrl: queryUrl || undefined,
      queryRequirements,
      step1_status,
      step1_rejectionReason: step1_status === 'REJECTED' ? step1_rejectionReason : undefined,
      step2_brand,
      step2_expertTitle: step2_expertTitle || undefined,
      step3_hasAiRestriction: hasAiRestriction,
      step3_note,
      step4_pitchSubject: step4_pitchSubject || undefined,
      step4_pitchBody: step4_pitchBody || undefined,
      step4_teaserInsight: step4_teaserInsight || undefined,
      journalistIntelligence: getCuratedJournalistIntel(journalist || '', mediaOutlet || '', title, step2_brand),
      overallStatus:
        step1_status === 'REJECTED'
          ? 'REJECTED'
          : hasAiRestriction
          ? 'MANUAL_REQUIRED'
          : 'READY_TO_DRAFT',
    });
  }

  return queries;
}
