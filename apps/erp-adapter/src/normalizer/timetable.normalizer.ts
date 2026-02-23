// AI GENERATED CODE BELOW, I am not going through their shitty api response and wasting my time formatting it. These retards sends data in such a format even god couldn't understand. Prompted it to AI and made this function.

type SubjectSlot = {
  name: string;
  code: string;
  room?: string;
  teacher: string;
};

type PeriodSlot = {
  period: string;
  time: string;
  subjects: SubjectSlot[];
};

type DaySchedule = {
  day: string;
  periods: PeriodSlot[];
};

export function normalizeTimetable(raw: any): DaySchedule[] {
  const parsed = JSON.parse(raw.state);

  function parseSubjects(cell: string): SubjectSlot[] {
    if (!cell) return [];

    // Split only on "-" that are NOT inside parentheses
    const chunks = cell.split(/-(?![^()]*\))/g);

    return chunks
      .map((chunk) => {
        const trimmed = chunk.trim();

        // Pattern:
        // SubjectName(Code) (Room optional),Teacher
        const regex = /^(.+?)\(([^)]+)\)(?:\s*\(([^)]+)\))?\s*,\s*(.+)$/;

        const match = trimmed.match(regex);
        if (!match || !match[1] || !match[2] || !match[4]) return null;

        const [, name, code, room, teacher] = match;

        return {
          name: name.trim(),
          code: code.trim(),
          room: room?.trim(),
          teacher: teacher.trim(),
        };
      })
      .filter(Boolean) as SubjectSlot[];
  }

  return parsed.map((row: any): DaySchedule => {
    const dayRaw = row["Days/Period"];
    // They misspelled "Thursday"?!?!?! How much of a fucking retard do you have to be to misspell thursday? was this made by toddlers? sure looks like it
    const day = dayRaw === "Thrusday" ? "Thursday" : dayRaw;

    const periods: PeriodSlot[] = Object.entries(row)
      .filter(([key]) => key !== "Days/Period")
      .map(([key, value]) => {
        const match = key.match(/\((P\d+)\)(.*)/);
        const period = match?.[1] || "";
        const time = match?.[2]?.trim() || "";

        return {
          period,
          time,
          subjects: parseSubjects(String(value || "")),
        };
      });

    return { day, periods };
  });
}
