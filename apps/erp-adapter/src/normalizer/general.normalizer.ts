type RawApiResponse = {
  state?: string | null;
};

export type NormalizedStudent = {
  regId: number | null;
  studentId: string | null;
  enrollmentNo: string | null;

  name: string | null;
  fatherName: string | null;
  motherName: string | null;

  contact: {
    email: string | null;
    mobile: string | null;
    alternateMobile: string | null;
  };

  academics: {
    university: string | null;
    college: string | null;
    course: string | null;
    branch: string | null;
    section: string | null;
    semester: number | null;
    mentor: {
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };

  marks: {
    class10: number | null;
    class12: number | null;
  };

  personal: {
    dob: string | null;
    bloodGroup: string | null;
  };

  address: {
    permanent: string | null;
    current: string | null;
  };

  misc: {
    abcAccountNo: string | null;
    studentType: string | null;
    minor: string | null;
  };
};

function safeString(value: any): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function safeNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function generalNormalizer(
  data: RawApiResponse
): NormalizedStudent | null {
  try {
    if (!data?.state) return null;

    const parsed = JSON.parse(data.state);
    const s = parsed?.[0] ?? {};

    return {
      regId: safeNumber(s.RegID),
      studentId: safeString(s.StudentID),
      enrollmentNo: safeString(s.EnrollmentNo),

      name: safeString(s.StudentName),
      fatherName: safeString(s.FatherHusName),
      motherName: safeString(s.MotherName),

      contact: {
        email: safeString(s.Email)?.toLowerCase() ?? null,
        mobile: safeString(s.MobileNO),
        alternateMobile: safeString(s.AlternateMobileNO),
      },

      academics: {
        university: safeString(s.Univesity),
        college: safeString(s.College),
        course: safeString(s.Course),
        branch: safeString(s.Branch),
        section: safeString(s.Section),
        semester: safeNumber(s.YearSem),

        mentor: {
          name: safeString(s.Mentor),
          email: safeString(s.MentorEmail),
          phone: safeString(s.MentorContact),
        },
      },

      marks: {
        class10: safeNumber(s["10"]),
        class12: safeNumber(s["10+2"]),
      },

      personal: {
        dob: safeString(s.DOB),
        bloodGroup: safeString(s.BloodGroup),
      },

      address: {
        permanent: safeString(s.PAddress),
        current: safeString(s.CAddress),
      },

      misc: {
        abcAccountNo: safeString(s.ABCAccountNo),
        studentType: safeString(s.StudentType),
        minor: safeString(s.MinorName),
      },
    };
  } catch {
    return null;
  }
}