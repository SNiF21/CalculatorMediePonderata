import { SemesterRoman, StudyMajor, YearRoman } from './studyProfile';

export interface StudentProfile {
  uid: string;
  email: string;
  institutionalDomain: 'ulbsibiu.ro';
  createdAt: string;
  major: StudyMajor;
  year: YearRoman;
  semester: SemesterRoman;
}
