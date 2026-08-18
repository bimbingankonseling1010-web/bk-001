import { School, Student, MasterViolation, ViolationLog, Teacher, StaffAccount } from '../types';

export const INITIAL_SCHOOLS: School[] = [
  {
    id: 'sd-01',
    name: 'SD Negeri 01 Harapan',
    code: 'SDN01',
    npsn: '20101234',
    address: 'Jl. Merdeka No. 45, Jakarta Selatan',
    accentColor: '#005a71'
  },
  {
    id: 'sd-02',
    name: 'SD Islam Al-Azhar 15',
    code: 'SDIA15',
    npsn: '20105678',
    address: 'Jl. Pemuda No. 12, Jakarta Timur',
    accentColor: '#006b5f'
  }
];

export const INITIAL_MASTERS: MasterViolation[] = [];
export const INITIAL_TEACHERS: Teacher[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_LOGS: ViolationLog[] = [];
export const INITIAL_STAFF: StaffAccount[] = [];
