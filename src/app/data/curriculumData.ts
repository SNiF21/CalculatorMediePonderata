import calculatoareCurriculum from './json/calculatoareCurriculum.json';
import tiCurriculum from './json/tiCurriculum.json';
import ismCurriculum from './json/ismCurriculum.json';
import { Subject } from '../models/studyProfile';

export const CURRICULUM_DATA: Record<string, Subject[]> = {
  ...(calculatoareCurriculum as Record<string, Subject[]>),
  ...(tiCurriculum as Record<string, Subject[]>),
  ...(ismCurriculum as Record<string, Subject[]>),
};