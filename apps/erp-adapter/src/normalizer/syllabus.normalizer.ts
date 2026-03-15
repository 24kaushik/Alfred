export function normalizeSubjects(state?: string | null) {
  try {
    const subjects = JSON.parse(state || "[]");

    return subjects.map((s: any) => ({
      subjectId: s.SubjectID ?? null,
      subjectName: s.Subject?.trim?.() || null,
      subjectCode: s.SubjectCode?.trim?.() || null
    }));
  } catch {
    return [];
  }
}

export function normalizeSubjectUnits(data: { newdata?: string | null }) {
  try {
    const parsed = JSON.parse(data?.newdata || "[]");

    if (!parsed.length) return null;

    const subject = {
      subjectId: parsed[0].SubjectID ?? null,
      subjectName: parsed[0].subject?.trim?.() || null,
      subjectCode: parsed[0].subjectcode?.trim?.() || null,
    };

    const units = parsed.map((u: any) => ({
      unitId: u.UnitID ?? null,
      unit: u.Unit?.trim?.() || null,
      topics: (u.Topic || "")
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
      duration: Number(u.Duration) || null,
      frequency: Number(u.Frequency) || null,
    }));

    return {
      subject,
      units,
    };
  } catch {
    return null;
  }
}