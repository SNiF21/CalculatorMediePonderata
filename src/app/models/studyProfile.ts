export interface Subject {
  name: string;
  credits: number;
  type: string;
}

export type StudyMajor =
  | 'Calculatoare'
  | 'Tehnologia Informației'
  | 'Ingineria Sistemelor Multimedia';

export const STUDY_MAJORS: StudyMajor[] = [
  'Calculatoare',
  'Tehnologia Informației',
  'Ingineria Sistemelor Multimedia',
];

export type YearRoman = 'I' | 'II' | 'III' | 'IV';

export interface YearOption {
  roman: YearRoman;
  key: string; // e.g. 'Anul 1'
  label: string; // e.g. 'Anul I'
}

export const STUDY_YEARS: YearOption[] = [
  { roman: 'I', key: 'Anul 1', label: 'Anul I' },
  { roman: 'II', key: 'Anul 2', label: 'Anul II' },
  { roman: 'III', key: 'Anul 3', label: 'Anul III' },
  { roman: 'IV', key: 'Anul 4', label: 'Anul IV' },
];

export type SemesterRoman = 'Semestrul I' | 'Semestrul II';

export interface SemesterOption {
  roman: SemesterRoman;
  key: string; // e.g. 'Semestrul 1'
  shortLabel: string; // e.g. 'Sem. I'
  num: 1 | 2;
}

export const STUDY_SEMESTERS: SemesterOption[] = [
  { roman: 'Semestrul I', key: 'Semestrul 1', shortLabel: 'Sem. I', num: 1 },
  { roman: 'Semestrul II', key: 'Semestrul 2', shortLabel: 'Sem. II', num: 2 },
];

export function buildCurriculumKey(
  major: StudyMajor,
  yearRoman: YearRoman,
  semesterRoman: SemesterRoman
): string {
  const y = STUDY_YEARS.find((item) => item.roman === yearRoman)?.key ?? 'Anul 1';
  const s = STUDY_SEMESTERS.find((item) => item.roman === semesterRoman)?.key ?? 'Semestrul 1';
  return `${major} - ${y}, ${s}`;
}