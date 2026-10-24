export interface StudentProfile {
  uid: string;
  email: string;
  institutionalDomain: 'ulbsibiu.ro';
  createdAt: string;
  // Prepared for future profile fields (year, major, group, etc.)
  major?: string;
  year?: string;
  semester?: number;
}
