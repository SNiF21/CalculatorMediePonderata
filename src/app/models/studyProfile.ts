export interface Subject {
  name: string;
  credits: number;
  type: string;
  isOptional?: boolean;
  options?: string[];
}

export function isOptionalSubject(subject: Subject): boolean {
  return !!(
    subject.isOptional ||
    (subject.options && subject.options.length > 0) ||
    /^op[tț]ional/i.test(subject.name.trim())
  );
}

export function getSubjectOptions(subject: Subject): string[] {
  if (subject.options && subject.options.length > 0) {
    return subject.options;
  }
  const match = subject.name.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1]
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [];
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

export interface DepartmentOption {
  id: string;
  name: string;
  shortName: string;
  majors: StudyMajor[];
}

export interface FacultyOption {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  departments: DepartmentOption[];
}

export const FACULTIES: FacultyOption[] = [
  {
    id: 'inginerie',
    name: 'Facultatea de Inginerie',
    shortName: 'Inginerie',
    icon: 'assets/facultati/inginerie.png',
    departments: [
      {
        id: 'cie',
        name: 'Calculatoare și Inginerie Electrică (CIE)',
        shortName: 'CIE',
        majors: [
          'Calculatoare',
          'Tehnologia Informației',
          'Ingineria Sistemelor Multimedia',
        ],
      },
    ],
  },
  {
    id: 'drept',
    name: 'Facultatea de Drept',
    shortName: 'Drept',
    icon: 'assets/facultati/drept.png',
    departments: [
      {
        id: 'drept-dept',
        name: 'Departamentul de Drept (DD)',
        shortName: 'DD',
        majors: [],
      },
    ],
  },
  {
    id: 'litere',
    name: 'Facultatea de Litere și Arte',
    shortName: 'Litere și Arte',
    icon: 'assets/facultati/litere.png',
    departments: [
      {
        id: 'litere-dept',
        name: 'Studii Romanice și Francofone (DSRF)',
        shortName: 'DSRF',
        majors: [],
      },
    ],
  },
  {
    id: 'medicina',
    name: 'Facultatea de Medicină',
    shortName: 'Medicină',
    icon: 'assets/facultati/medicina.png',
    departments: [
      {
        id: 'medicina-dept',
        name: 'Departamentul Clinic și Preclinic (DCP)',
        shortName: 'DCP',
        majors: [],
      },
    ],
  },
  {
    id: 'stiinte',
    name: 'Facultatea de Științe',
    shortName: 'Științe',
    icon: 'assets/facultati/stiinte.png',
    departments: [
      {
        id: 'stiinte-dept',
        name: 'Matematică și Informatică (DMI)',
        shortName: 'DMI',
        majors: [],
      },
    ],
  },
  {
    id: 'saiapm',
    name: 'Facultatea de ȘAIAPM',
    shortName: 'ȘAIAPM',
    icon: 'assets/facultati/saiapm.png',
    departments: [
      {
        id: 'saiapm-dept',
        name: 'Științe Agricole și Industrie Alimentară (DSAIA)',
        shortName: 'DSAIA',
        majors: [],
      },
    ],
  },
  {
    id: 'stiinte-economice',
    name: 'Facultatea de Științe Economice',
    shortName: 'Științe Economice',
    icon: 'assets/facultati/stiinte-economice.png',
    departments: [
      {
        id: 'economice-dept',
        name: 'Management, Marketing și Administrarea Afacerilor (DMMA)',
        shortName: 'DMMA',
        majors: [],
      },
    ],
  },
  {
    id: 'socio-umane',
    name: 'Facultatea de Științe Socio-Umane',
    shortName: 'Științe Socio-Umane',
    icon: 'assets/facultati/socio-umane.png',
    departments: [
      {
        id: 'socio-dept',
        name: 'Psihologie și Științe ale Educației (DPSE)',
        shortName: 'DPSE',
        majors: [],
      },
    ],
  },
  {
    id: 'teologie',
    name: 'Facultatea de Teologie',
    shortName: 'Teologie',
    icon: 'assets/facultati/teologie.png',
    departments: [
      {
        id: 'teologie-dept',
        name: 'Teologie Ortodoxă (DTO)',
        shortName: 'DTO',
        majors: [],
      },
    ],
  },
];

export const DEFAULT_FACULTY = 'Facultatea de Inginerie';
export const DEFAULT_DEPARTMENT = 'CIE';

export function getFacultyIcon(facultyName: string): string {
  const f = FACULTIES.find(
    (item) => item.name === facultyName || item.id === facultyName || item.shortName === facultyName
  );
  return f?.icon ?? 'assets/facultati/inginerie.png';
}

export function getDepartmentsForFaculty(facultyName: string): DepartmentOption[] {
  const f = FACULTIES.find(
    (item) => item.name === facultyName || item.id === facultyName || item.shortName === facultyName
  );
  return f ? f.departments : (FACULTIES[0]?.departments ?? []);
}

export function getMajorsForDepartment(
  facultyName: string,
  departmentNameOrShort: string
): StudyMajor[] {
  const depts = getDepartmentsForFaculty(facultyName);
  const d = depts.find(
    (item) =>
      item.name === departmentNameOrShort ||
      item.shortName === departmentNameOrShort ||
      item.id === departmentNameOrShort
  );
  return d ? d.majors : STUDY_MAJORS;
}

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