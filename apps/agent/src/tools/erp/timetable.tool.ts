import { tool } from "langchain";
import * as z from "zod";
import erpClient from "../../config/axios.config";
import { UUID } from "crypto";
import { wrapToolWithUser } from "../../utils/wrapToolWithUser";

type DAY =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const getTimetableLogic = async ({
  userId,
  day,
}: {
  userId: UUID;
  day: DAY;
}) => {
  try {
    const response = await erpClient.get(`/timetable/${userId}?day=${day}`);
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
      `Error fetching timetable data for ID ${userId} and day ${day}:`,
      error,
    );
    return { msg: "Failed to fetch timetable data", data: {} };
  }
};

const GetTimetableToolSchema = z.object({
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

const GetTimetableTool = tool(wrapToolWithUser(getTimetableLogic), {
  name: "get_timetable",
  description:
    "Fetches timetable data from the ERP system using day of the week.",
  schema: GetTimetableToolSchema,
});

export { GetTimetableTool };
