import type { CostEstimate, Specialty } from '@app/types';

// Broad INR ranges across tier-1/2 Indian cities. Numbers are intentionally wide
// because the same procedure varies 5-10x by hospital category.
// Source: aggregated public price-list ranges (PMJAY, Apollo, Fortis, Max, govt).
export const COST_ESTIMATES: CostEstimate[] = [
  { procedure: 'General consultation', specialty: 'general', minInr: 300, maxInr: 1500 },
  { procedure: 'Cardiology consultation', specialty: 'cardiology', minInr: 800, maxInr: 2500 },
  { procedure: 'ECG', specialty: 'cardiology', minInr: 200, maxInr: 800 },
  { procedure: 'Echocardiogram', specialty: 'cardiology', minInr: 1500, maxInr: 4500 },
  { procedure: 'Angiography', specialty: 'cardiology', minInr: 15000, maxInr: 45000 },
  { procedure: 'Orthopedic consultation', specialty: 'orthopedics', minInr: 500, maxInr: 2000 },
  { procedure: 'X-ray (single view)', specialty: 'orthopedics', minInr: 300, maxInr: 900 },
  { procedure: 'MRI (single region)', specialty: 'orthopedics', minInr: 4000, maxInr: 12000 },
  { procedure: 'Plaster cast', specialty: 'orthopedics', minInr: 800, maxInr: 3500 },
  { procedure: 'Pediatric consultation', specialty: 'pediatrics', minInr: 400, maxInr: 1500 },
  { procedure: 'Childhood vaccination (per dose)', specialty: 'pediatrics', minInr: 200, maxInr: 4000 },
  { procedure: 'Neurology consultation', specialty: 'neurology', minInr: 800, maxInr: 2500 },
  { procedure: 'Brain MRI', specialty: 'neurology', minInr: 5000, maxInr: 15000 },
  { procedure: 'EEG', specialty: 'neurology', minInr: 1500, maxInr: 4500 },
  { procedure: 'Pulmonology consultation', specialty: 'pulmonology', minInr: 600, maxInr: 2000 },
  { procedure: 'Chest X-ray', specialty: 'pulmonology', minInr: 300, maxInr: 1000 },
  { procedure: 'Spirometry / PFT', specialty: 'pulmonology', minInr: 800, maxInr: 2500 },
  { procedure: 'Gastroenterology consultation', specialty: 'gastroenterology', minInr: 700, maxInr: 2200 },
  { procedure: 'Upper GI endoscopy', specialty: 'gastroenterology', minInr: 2500, maxInr: 8000 },
  { procedure: 'Ultrasound abdomen', specialty: 'gastroenterology', minInr: 800, maxInr: 2500 },
  { procedure: 'Dermatology consultation', specialty: 'dermatology', minInr: 500, maxInr: 1800 },
  { procedure: 'ENT consultation', specialty: 'ent', minInr: 500, maxInr: 1800 },
  { procedure: 'Audiometry', specialty: 'ent', minInr: 400, maxInr: 1500 },
  { procedure: 'Eye consultation', specialty: 'ophthalmology', minInr: 400, maxInr: 1500 },
  { procedure: 'Dental consultation', specialty: 'dentistry', minInr: 300, maxInr: 1200 },
  { procedure: 'Tooth filling', specialty: 'dentistry', minInr: 800, maxInr: 3500 },
  { procedure: 'Root canal (single tooth)', specialty: 'dentistry', minInr: 3500, maxInr: 12000 },
  { procedure: 'Tooth extraction (simple)', specialty: 'dentistry', minInr: 500, maxInr: 2500 },
  { procedure: 'Scaling & polishing', specialty: 'dentistry', minInr: 800, maxInr: 2500 },
  { procedure: 'Cataract surgery (per eye)', specialty: 'ophthalmology', minInr: 15000, maxInr: 80000 },
  { procedure: 'Gynec consultation', specialty: 'obgyn', minInr: 500, maxInr: 2000 },
  { procedure: 'Routine antenatal scan', specialty: 'obgyn', minInr: 800, maxInr: 3000 },
  { procedure: 'Normal delivery (package)', specialty: 'obgyn', minInr: 25000, maxInr: 90000 },
  { procedure: 'Psychiatry consultation', specialty: 'psychiatry', minInr: 800, maxInr: 3000 },
  { procedure: 'Urology consultation', specialty: 'urology', minInr: 600, maxInr: 2000 },
  { procedure: 'Oncology consultation', specialty: 'oncology', minInr: 1000, maxInr: 3500 },
  { procedure: 'ER visit (level 1 triage)', specialty: 'emergency_medicine', minInr: 1500, maxInr: 8000 },
];

export function estimatesFor(specialty: Specialty): CostEstimate[] {
  return COST_ESTIMATES.filter((c) => c.specialty === specialty);
}

export function formatInr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}
