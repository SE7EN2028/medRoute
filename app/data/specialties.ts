import type { Specialty } from '@app/types';

export interface SpecialtyMeta {
  key: Specialty;
  label: string;
  description: string;
  placesKeyword: string; // used in Google Places text query
}

export const SPECIALTIES: SpecialtyMeta[] = [
  { key: 'general', label: 'General Practice', description: 'Fever, cold, routine checkups', placesKeyword: 'general physician clinic' },
  { key: 'cardiology', label: 'Cardiology', description: 'Heart, chest pain, BP', placesKeyword: 'cardiology hospital' },
  { key: 'orthopedics', label: 'Orthopedics', description: 'Bones, joints, fractures, sprains', placesKeyword: 'orthopedic hospital' },
  { key: 'pediatrics', label: 'Pediatrics', description: 'Children & infants', placesKeyword: 'pediatric hospital' },
  { key: 'neurology', label: 'Neurology', description: 'Headache, stroke, seizures', placesKeyword: 'neurology hospital' },
  { key: 'pulmonology', label: 'Pulmonology', description: 'Lungs, breathing, asthma', placesKeyword: 'pulmonology hospital' },
  { key: 'gastroenterology', label: 'Gastroenterology', description: 'Stomach, liver, digestion', placesKeyword: 'gastroenterology hospital' },
  { key: 'dermatology', label: 'Dermatology', description: 'Skin, rash, acne', placesKeyword: 'dermatology clinic' },
  { key: 'ent', label: 'ENT', description: 'Ear, nose, throat', placesKeyword: 'ENT hospital' },
  { key: 'ophthalmology', label: 'Ophthalmology', description: 'Eyes, vision', placesKeyword: 'eye hospital' },
  { key: 'obgyn', label: "Women's Health", description: 'Maternal & gynecology', placesKeyword: 'gynecology hospital' },
  { key: 'psychiatry', label: 'Mental Health', description: 'Anxiety, depression, counseling', placesKeyword: 'psychiatry clinic' },
  { key: 'urology', label: 'Urology', description: 'Kidney, bladder, urinary', placesKeyword: 'urology hospital' },
  { key: 'oncology', label: 'Oncology', description: 'Cancer screening & treatment', placesKeyword: 'oncology hospital' },
  { key: 'toxicology', label: 'Toxicology', description: 'Poisoning, snakebite, overdose', placesKeyword: 'poison control hospital' },
  { key: 'emergency_medicine', label: 'Urgent Care', description: '24x7 ER & trauma', placesKeyword: 'emergency hospital' },
];

export const SPECIALTY_BY_KEY: Record<Specialty, SpecialtyMeta> =
  SPECIALTIES.reduce((acc, s) => {
    acc[s.key] = s;
    return acc;
  }, {} as Record<Specialty, SpecialtyMeta>);
