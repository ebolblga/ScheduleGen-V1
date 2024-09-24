export interface Classroom {
  classroom_number: string;
  capacity: number;
  equipment: string;
}

export interface Lecturer {
  lecturer_id: number;
  institute: string;
  post: string;
  surname: string;
  name: string;
  patronymic: string;
}

export interface Group {
  group_name: string;
  course: string;
  institute: string;
  student_count: number;
}

export interface SubjectClassroom {
  subject_name: string;
  classroom_number: string;
}

export interface SubjectGroup {
  subject_name: string;
  group_name: string;
}

export interface SubjectLecturer {
  subject_name: string;
  lecturer_id: number;
}

export interface Subject {
  subject_name: string;
  lecture_count: number;
  sem_count: number;
  lab_count: number;
  lab_equipment: string;
}

export interface Slot {
  id: number;
  lecturer_id: number;
  subject_name: string;
  subject_type: number;
  classroom_number: string;
  date: Date;
  weight: number;
  entropy: number;
}
