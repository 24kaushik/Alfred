// AI GENERATED CODE BELOW, I am not going through their shitty api response and wasting my time formatting it. These retards sends data in such a format even god couldn't understand. Prompted it to AI and made this function.

type Status = "Present" | "Absent" | "Not Marked";

interface SubjectAttendanceCompact {
  present: number[];
  absent: number[];
  notMarkedOrNoClass: number[];
}

interface SubjectRecord {
  code: string;
  name: string;
  teacher?: string;
  attendance: SubjectAttendanceCompact;
}

interface Summary {
  total: number;
  present: number;
  absent: number;
  percentage: string;
}

interface StructuredData {
  summary: Summary;
  subjects: SubjectRecord[];
}

export function structureAttendance(raw: any): StructuredData {
  const subjectsRaw = JSON.parse(raw.state);
  const summaryRaw = JSON.parse(raw.data)[0];
  const detailRaw = JSON.parse(raw.dtSubjectDetail)[0].subDetail;

  // Parse teacher mapping
  const teacherMap: Record<string, string> = {};
  const matches = detailRaw.match(/\[(.*?)\]/g) || [];

  matches.forEach((entry: string) => {
    const cleaned = entry.slice(1, -1);
    const [code, , teacher] = cleaned.split(":");
    if (code && teacher) {
      teacherMap[code.trim()] = teacher.trim();
    }
  });

  const subjects: SubjectRecord[] = subjectsRaw.map((s: any) => {
    const { Subject, ...days } = s;

    const [code] = Subject.split(" ");
    const name = Subject.substring(code.length).trim();

    const attendance: SubjectAttendanceCompact = {
      present: [],
      absent: [],
      notMarkedOrNoClass: [],
    };

    Object.entries(days).forEach(([d, v]) => {
      const day = Number(d);
      const value = String(v);

      if (value.includes("P")) {
        attendance.present.push(day);
      } else if (value.includes("A")) {
        attendance.absent.push(day);
      } else {
        attendance.notMarkedOrNoClass.push(day);
      }
    });

    return {
      code: code.trim(),
      name,
      teacher: teacherMap[code.trim()],
      attendance,
    };
  });

  return {
    summary: {
      total: Number(summaryRaw.Total),
      present: Number(summaryRaw.Present),
      absent: Number(summaryRaw.Absent),
      percentage: summaryRaw.Percet.trim(),
    },
    subjects,
  };
}

interface NormalizedPeriod {
  period: string;
  time: string;
  subject: {
    code: string;
    name: string;
    teacher: string;
  };
  status: Status;
}

export function normalizeDailyAttendance(raw: any): NormalizedPeriod[] {
  const parsed = JSON.parse(raw.state);

  return parsed.map((entry: any): NormalizedPeriod => {
    const {
      Period,
      Duration,
      subject,
      SubjectCode,
      Employeename,
      Attend,
    } = entry;

    let status: Status = "Not Marked";
    if (Attend?.includes("P")) status = "Present";
    else if (Attend?.includes("A")) status = "Absent";

    return {
      period: Period,
      time: Duration,
      subject: {
        code: SubjectCode,
        name: subject,
        teacher: Employeename?.trim(),
      },
      status,
    };
  });
}