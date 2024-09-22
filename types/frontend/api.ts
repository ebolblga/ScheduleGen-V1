export interface TimetableSubject {
  id: number;
  groups: string[];
  name: string;
  type: string;
  subgroup: string;
  location: string;
  dateTime: Date;
  url: string;
  mdFile: string;
}