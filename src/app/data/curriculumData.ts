import calculatoareCurriculum from './facultati/inginerie/cie/calculatoareCurriculum.json';
import tiCurriculum from './facultati/inginerie/cie/tiCurriculum.json';
import ismCurriculum from './facultati/inginerie/cie/ismCurriculum.json';
import { Subject } from '../models/studyProfile';

export const CURRICULUM_DATA: Record<string, Subject[]> = {
  ...(calculatoareCurriculum as Record<string, Subject[]>),
  ...(tiCurriculum as Record<string, Subject[]>),
  ...(ismCurriculum as Record<string, Subject[]>),
};