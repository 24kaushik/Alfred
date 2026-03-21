import { tool } from "langchain";
import * as z from "zod";
import erpClient from "../../config/axios.config";
import { UUID } from "crypto";

type DAY =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const getTimetableLogic = async ({
  studentId,
  day,
}: {
  studentId: UUID;
  day: DAY;
}) => {
  try {
    const response = await erpClient.get(`/timetable/${studentId}?day=${day}`);
    if (response.status === 200) {
      return {
        msg: "Timetable data fetched successfully",
        data: response.data,
      };
    } else {
      throw new Error(
        `Failed to fetch timetable data: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(
      `Error fetching timetable data for ID ${studentId} and day ${day}:`,
      error,
    );
    return { msg: "Failed to fetch timetable data", data: {} };
  }
};

const GetTimetableToolSchema = z.object({
  studentId: z.uuid(),
  day: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
});

const GetTimetableTool = tool(getTimetableLogic, {
  name: "get_timetable",
  description:
    "Fetches timetable data from the ERP system using the student ID and day of the week.",
  schema: GetTimetableToolSchema,
});

export { GetTimetableTool };
