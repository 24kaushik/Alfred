import { tool } from "langchain";
import * as z from "zod";
import erpClient from "../../config/axios.config";
import { UUID } from "crypto";
import { wrapToolWithUser } from "../../utils/wrapToolWithUser";

const getMonthlyAttendanceLogic = async ({
  userId,
  month,
}: {
  userId: UUID;
  month: number;
}) => {
  try {
    const response = await erpClient.post(`/attendance/monthly/${userId}`, {
      month,
    });
    if (response.status === 200) {
      return {
        msg: "Monthly attendance data fetched successfully",
        data: response.data,
      };
    } else {
      throw new Error(
        `Failed to fetch monthly attendance data: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(
      `Error fetching monthly attendance data for ID ${userId}:`,
      error,
    );
    return { msg: "Failed to fetch monthly attendance data", data: {} };
  }
};

const GetMonthlyAttendanceToolSchema = z.object({
  month: z.number().min(1).max(12),
});

const GetMonthlyAttendanceTool = tool(
  wrapToolWithUser(getMonthlyAttendanceLogic),
  {
    name: "get_monthly_attendance",
    description:
      "Fetches monthly attendance data from the ERP system using month.",
    schema: GetMonthlyAttendanceToolSchema,
  },
);

const getDailyAttendanceLogic = async ({ userId }: { userId: UUID }) => {
  try {
    const response = await erpClient.get(`/attendance/daily/${userId}`);
    if (response.status === 200) {
      return {
        msg: "Daily attendance data fetched successfully",
        data: response.data,
      };
    } else {
      throw new Error(
        `Failed to fetch daily attendance data: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(
      `Error fetching daily attendance data for ID ${userId}:`,
      error,
    );
    return { msg: "Failed to fetch daily attendance data", data: {} };
  }
};

const GetDailyAttendanceTool = tool(wrapToolWithUser(getDailyAttendanceLogic), {
  name: "get_daily_attendance",
  description:
    "Fetches daily attendance data from the ERP system.",
});

const getSemesterAttendanceLogic = async ({ userId }: { userId: UUID }) => {
  try {
    const response = await erpClient.get(`/attendance/sem/${userId}`);
    if (response.status === 200) {
      return {
        msg: "Semester attendance data fetched successfully",
        data: response.data,
      };
    } else {
      throw new Error(
        `Failed to fetch semester attendance data: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(
      `Error fetching semester attendance data for ID ${userId}:`,
      error,
    );
    return { msg: "Failed to fetch semester attendance data", data: {} };
  }
};

const GetSemesterAttendanceTool = tool(
  wrapToolWithUser(getSemesterAttendanceLogic),
  {
    name: "get_semester_attendance",
    description:
      "Fetches semester attendance data from the ERP system.",
  },
);

export {
  GetMonthlyAttendanceTool,
  GetDailyAttendanceTool,
  GetSemesterAttendanceTool,
};
