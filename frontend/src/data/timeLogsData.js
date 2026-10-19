/**
 * QRDA Enterprise Portal - Site Time Logs Data Module
 * Contains mock and initial data matching the exact legacy Site Time Logs screenshot:
 * Site: WIPRO GOPANPALLY ICG GATE HYD
 * Month: Sep/2026
 * Columns: Sr. No, Emp. Site, Rank, Emp. Code, Emp. Name, Duty Type, WO Day, Dates 1-30
 */

export const INITIAL_TIME_LOGS = [
  {
    id: 1,
    empSite: 'ICGGATE',
    rank: 'S/G',
    empCode: 'HY1492',
    name: 'ADE ANAND',
    dutyType: 'REGULAR',
    woDay: 'Sunday',
    logs: {
      1: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '01/ 05:40:35 - 01/ 14:31:43',
        netDuration: '8h 51m'
      },
      2: {
        status: 'A',
      },
      3: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '03/ 21:39:58 - 04/ 06:24:03',
        netDuration: '8h 44m'
      },
      4: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '04/ 21:43:17 - 05/ 06:12:23',
        netDuration: '8h 29m'
      },
      5: {
        status: 'IN',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '05/ 21:30:51 - IN',
        netDuration: 'Active'
      },
      6: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '06/ 21:11:55 - 07/ 06:14:27',
        netDuration: '9h 2m'
      },
      7: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '07/ 13:34:10 - 07/ 22:15:30',
        netDuration: '8h 41m'
      }
    }
  },
  {
    id: 2,
    empSite: 'ICGGATE',
    rank: 'S/G',
    empCode: 'HY1489',
    name: 'AJIT KUMAR',
    dutyType: 'REGULAR',
    woDay: 'Friday',
    logs: {
      1: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '01/ 05:38:33 - 01/ 14:19:14',
        netDuration: '8h 40m'
      },
      2: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '02/ 05:43:30 - 02/ 14:13:24',
        netDuration: '8h 29m'
      },
      3: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '03/ 05:37:25 - 03/ 14:14:53',
        netDuration: '8h 37m'
      },
      4: {
        status: 'WO'
      },
      5: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '05/ 05:03:05 - 05/ 13:57:37',
        netDuration: '8h 54m'
      },
      6: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '06/ 05:31:04 - 06/ 14:08:14',
        netDuration: '8h 37m'
      },
      7: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '07/ 21:37:10 - 08/ 06:12:00',
        netDuration: '8h 34m'
      }
    }
  },
  {
    id: 3,
    empSite: 'ICGGATE',
    rank: 'LS/G',
    empCode: 'HY1491',
    name: 'ALKA SAHU',
    dutyType: 'REGULAR',
    woDay: 'Sunday',
    logs: {
      1: { status: 'A' },
      2: { status: 'A' },
      3: { status: 'A' },
      4: { status: 'A' },
      5: { status: 'A' },
      6: { status: 'A' },
      7: { status: 'A' }
    }
  },
  {
    id: 4,
    empSite: 'ICGGATE',
    rank: 'S/G',
    empCode: 'HY1486',
    name: 'AMRENDRA KUMAR',
    dutyType: 'REGULAR',
    woDay: 'Monday',
    logs: {
      1: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '01/ 13:38:09 - 01/ 22:26:31',
        netDuration: '8h 48m'
      },
      2: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '02/ 21:38:31 - 03/ 06:18:06',
        netDuration: '8h 39m'
      },
      3: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '03/ 21:40:58 - 04/ 06:15:31',
        netDuration: '8h 34m'
      },
      4: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '04/ 21:39:51 - 05/ 06:09:54',
        netDuration: '8h 30m'
      },
      5: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '05/ 21:32:54 - 06/ 06:19:49',
        netDuration: '8h 46m'
      },
      6: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '06/ 21:35:16 - 07/ 06:25:07',
        netDuration: '8h 49m'
      },
      7: {
        status: 'WO'
      }
    }
  },
  {
    id: 5,
    empSite: 'ICGGATE',
    rank: 'S/G',
    empCode: 'HY1489',
    name: 'ANIL KUMAR',
    dutyType: 'REGULAR',
    woDay: 'Saturday',
    logs: {
      1: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '01/ 13:37:39 - 01/ 22:26:00',
        netDuration: '8h 48m'
      },
      2: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '02/ 13:38:35 - 02/ 22:09:26',
        netDuration: '8h 30m'
      },
      3: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '03/ 13:35:02 - 03/ 22:22:27',
        netDuration: '8h 47m'
      },
      4: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '04/ 13:36:13 - 04/ 22:20:37',
        netDuration: '8h 44m'
      },
      5: {
        status: 'WO'
      },
      6: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '06/ 13:26:33 - 06/ 21:58:22',
        netDuration: '8h 31m'
      },
      7: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '07/ 13:28:40 - 07/ 22:11:05',
        netDuration: '8h 42m'
      }
    }
  },
  {
    id: 6,
    empSite: 'ICGGATE',
    rank: 'S/G',
    empCode: 'HY1490',
    name: 'ANKIT KUMAR',
    dutyType: 'REGULAR',
    woDay: 'Tuesday',
    logs: {
      1: { status: 'WO' },
      2: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '02/ 05:41:20 - 02/ 14:10:05',
        netDuration: '8h 28m'
      },
      3: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '03/ 05:39:15 - 03/ 14:15:30',
        netDuration: '8h 36m'
      },
      4: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '04/ 05:40:02 - 04/ 14:18:40',
        netDuration: '8h 38m'
      },
      5: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '05/ 05:42:10 - 05/ 14:12:15',
        netDuration: '8h 30m'
      },
      6: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '06/ 05:38:50 - 06/ 14:20:10',
        netDuration: '8h 41m'
      },
      7: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '07/ 05:39:00 - 07/ 14:15:00',
        netDuration: '8h 36m'
      }
    }
  },
  {
    id: 7,
    empSite: 'ICGGATE',
    rank: 'S/SUP',
    empCode: 'HY1474',
    name: 'AICHUK DEBBARMA',
    dutyType: 'REGULAR',
    woDay: 'Sunday',
    logs: {
      1: {
        status: 'P',
        hours: 8.0,
        post: 'MAIN-GATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '01/ 05:45:10 - 01/ 14:15:30',
        netDuration: '8h 30m'
      },
      2: {
        status: 'P',
        hours: 8.0,
        post: 'MAIN-GATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '02/ 05:40:22 - 02/ 14:18:45',
        netDuration: '8h 38m'
      },
      3: {
        status: 'P',
        hours: 8.0,
        post: 'MAIN-GATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '03/ 05:38:15 - 03/ 14:12:10',
        netDuration: '8h 33m'
      },
      4: {
        status: 'P',
        hours: 8.0,
        post: 'MAIN-GATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '04/ 05:41:00 - 04/ 14:20:00',
        netDuration: '8h 39m'
      },
      5: {
        status: 'P',
        hours: 8.0,
        post: 'MAIN-GATE',
        shift: 'A-Shift [ 06:00 to 14:00 ]',
        shiftDuration: '8 hrs',
        punches: '05/ 05:44:12 - 05/ 14:16:30',
        netDuration: '8h 32m'
      },
      6: {
        status: 'IN',
        hours: 8.0,
        post: 'MAIN-GATE',
        shift: 'B-Shift [ 14:00 to 22:00 ]',
        shiftDuration: '8 hrs',
        punches: '06/ 13:45:00 - IN',
        netDuration: 'Active'
      },
      7: {
        status: 'WO'
      }
    }
  },
  {
    id: 8,
    empSite: 'ICGGATE',
    rank: 'S/G',
    empCode: 'HY1488',
    name: 'MANISH GODASE',
    dutyType: 'REGULAR',
    woDay: 'Wednesday',
    logs: {
      1: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '01/ 21:40:00 - 02/ 06:15:00',
        netDuration: '8h 35m'
      },
      2: {
        status: 'WO'
      },
      3: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '03/ 21:35:00 - 04/ 06:20:00',
        netDuration: '8h 45m'
      },
      4: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '04/ 21:38:00 - 05/ 06:12:00',
        netDuration: '8h 34m'
      },
      5: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '05/ 21:30:00 - 06/ 06:10:00',
        netDuration: '8h 40m'
      },
      6: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '06/ 21:45:00 - 07/ 06:22:00',
        netDuration: '8h 37m'
      },
      7: {
        status: 'P',
        hours: 8.0,
        post: 'ICGGATE',
        shift: 'C-Shift [ 22:00 to 06:00 ]',
        shiftDuration: '8 hrs',
        punches: '07/ 21:39:00 - 08/ 06:18:00',
        netDuration: '8h 39m'
      }
    }
  }
];

export const DAYS_CONFIG = [
  { day: 1, dayName: 'Tuesday', shortDay: 'Tue' },
  { day: 2, dayName: 'Wednesday', shortDay: 'Wed' },
  { day: 3, dayName: 'Thursday', shortDay: 'Thu' },
  { day: 4, dayName: 'Friday', shortDay: 'Fri' },
  { day: 5, dayName: 'Saturday', shortDay: 'Sat' },
  { day: 6, dayName: 'Sunday', shortDay: 'Sun' },
  { day: 7, dayName: 'Monday', shortDay: 'Mon' },
  { day: 8, dayName: 'Tuesday', shortDay: 'Tue' },
  { day: 9, dayName: 'Wednesday', shortDay: 'Wed' },
  { day: 10, dayName: 'Thursday', shortDay: 'Thu' },
  { day: 11, dayName: 'Friday', shortDay: 'Fri' },
  { day: 12, dayName: 'Saturday', shortDay: 'Sat' },
  { day: 13, dayName: 'Sunday', shortDay: 'Sun' },
  { day: 14, dayName: 'Monday', shortDay: 'Mon' },
  { day: 15, dayName: 'Tuesday', shortDay: 'Tue' },
  { day: 16, dayName: 'Wednesday', shortDay: 'Wed' },
  { day: 17, dayName: 'Thursday', shortDay: 'Thu' },
  { day: 18, dayName: 'Friday', shortDay: 'Fri' },
  { day: 19, dayName: 'Saturday', shortDay: 'Sat' },
  { day: 20, dayName: 'Sunday', shortDay: 'Sun' },
  { day: 21, dayName: 'Monday', shortDay: 'Mon' },
  { day: 22, dayName: 'Tuesday', shortDay: 'Tue' },
  { day: 23, dayName: 'Wednesday', shortDay: 'Wed' },
  { day: 24, dayName: 'Thursday', shortDay: 'Thu' },
  { day: 25, dayName: 'Friday', shortDay: 'Fri' },
  { day: 26, dayName: 'Saturday', shortDay: 'Sat' },
  { day: 27, dayName: 'Sunday', shortDay: 'Sun' },
  { day: 28, dayName: 'Monday', shortDay: 'Mon' },
  { day: 29, dayName: 'Tuesday', shortDay: 'Tue' },
  { day: 30, dayName: 'Wednesday', shortDay: 'Wed' }
];

export const TIMELOGS_CLIENT_OPTIONS = [
  'AON',
  'Wipro',
  'Tata Communications',
  'Infosys',
  'TCS',
  'Unique Delta Force Pvt. Ltd.'
];

export const TIMELOGS_BRANCH_OPTIONS = {
  'AON': ['Mumbai', 'Gurugram', 'Bengaluru'],
  'Wipro': ['Hyderabad', 'Pune', 'Bengaluru'],
  'Tata Communications': ['Mumbai', 'Delhi', 'Chennai'],
  'Infosys': ['Pune', 'Bangalore'],
  'TCS': ['Mumbai', 'Pune', 'Hyderabad'],
  'Unique Delta Force Pvt. Ltd.': ['Pune', 'Mumbai']
};

export const TIMELOGS_SITE_OPTIONS = {
  'AON|Mumbai': [
    'PRABHADEVI - AON',
    'BKC - AON',
    'AIROLI - AON'
  ],
  'Wipro|Hyderabad': [
    'WIPRO GOPANPALLY ICG GATE HYD',
    'WIPRO MINDSPACE 12D HYD',
    'WIPRO MANIKONDA HYD',
    'WIPRO GOPANPALLY ESCO HYD'
  ],
  'Wipro|Pune': [
    'WIPRO PDC - II',
    'WIPRO EON KHARADI - 1',
    'WIPRO Hinjewadi Phase 1'
  ],
  'Tata Communications|Mumbai': [
    'TCL BKC',
    'TCL VSB',
    'TCL Equinox',
    'TCL LVSB'
  ]
};
