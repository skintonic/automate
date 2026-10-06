import { BrandConfig } from '../types';

export const BRANDS: Record<string, BrandConfig> = {
  'Performance P-Wave': {
    id: 'pwave',
    name: 'Performance P-Wave',
    shortName: 'P-Wave',
    tagline: "Men's Sexual Health & Acoustic Wave Therapy",
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-500',
    specialties: [
      'Erectile Dysfunction (ED)',
      'Acoustic Wave Therapy / Low-Intensity Shockwave',
      'Peyronie’s Disease',
      'Male Vitality & Hormone Optimization',
      'Non-invasive Vascular Regeneration'
    ],
    inHouseExpert: {
      name: 'Dr. Croley',
      title: "Medical Director & Men's Sexual Health Specialist",
      credentials: 'MD, Performance P-Wave Clinical Director',
      bioTeaser: "Clinical expert in non-pharmaceutical acoustic wave therapies for vasculogenic ED and men's sexual health restoration."
    },
    samplePitchAngles: [
      "Why acoustic shockwave therapy is replacing daily PDE5 inhibitors for long-term vascular regeneration",
      "The connection between early erectile changes and subclinical cardiovascular endothelial health",
      "Non-surgical treatment modalities for Peyronie's plaque and curvature"
    ]
  },
  'Skin & Tonic': {
    id: 'skintonic',
    name: 'Skin & Tonic',
    shortName: 'Skin & Tonic',
    tagline: 'Medical Spa & Advanced Aesthetic Medicine',
    color: 'rose',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    badgeText: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-500',
    specialties: [
      'Neurotoxins (Botox, Dysport, Daxxify)',
      'Hyaluronic Acid & Biostimulatory Dermal Fillers',
      'RF Microneedling & Collagen Induction',
      'Medical-Grade Chemical Peels & HydraFacials',
      'Aesthetic Lasers & Barrier Repair Skincare'
    ],
    inHouseExpert: {
      name: 'Rixie & Medical Aesthetics Team',
      title: 'Lead Aesthetic Practitioner & Clinical Director',
      credentials: 'Skin & Tonic Medical Spa',
      bioTeaser: 'Specialist in natural facial contouring, preventative neuromodulator dosing, and cellular skin regeneration protocols.'
    },
    samplePitchAngles: [
      "Why 'micro-tox' preventative dosing yields more natural longevity than high-volume freeze treatments",
      "The biggest formulation mistakes patients make when combining retinoids with active peptides",
      "Why skin barrier recovery must precede aggressive clinical resurfacing"
    ]
  },
  "Dr. Croley's": {
    id: 'croley',
    name: "Dr. Croley's",
    shortName: "Dr. Croley's",
    tagline: 'Primary Care & Comprehensive Family Practice',
    color: 'blue',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-500',
    specialties: [
      'Preventive Healthcare & Annual Wellness',
      'Cardiometabolic Disease Management',
      'Hypertension & Lipid Optimization',
      'Family Medicine & Adult Health',
      'Longevity Medicine & Diagnostic Screening'
    ],
    inHouseExpert: {
      name: 'Dr. Croley, MD',
      title: 'Board-Certified Physician & Founder',
      credentials: "Dr. Croley's Primary Care Medicine",
      bioTeaser: 'Practicing primary care physician focused on proactive screening, metabolic health, and patient-centered chronic care prevention.'
    },
    samplePitchAngles: [
      "Why standard annual fasting glucose misses early insulin resistance by up to a decade",
      "Key diagnostic blood markers every patient in their 30s and 40s should request at annual checkups",
      "Practical primary care strategies for sustainable blood pressure reduction before polypharmacy"
    ]
  }
};
