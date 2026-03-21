import { tool } from "langchain";
import * as z from "zod";
import erpClient from "../../config/axios.config";
import { UUID } from "crypto";

const getMonthlyAttendanceLogic = async ({
  studentId,
  month,
}: {
  studentId: UUID;
  month: number;
}) => {
  try {
    const response = await erpClient.post(`/attendance/monthly/${studentId}`, {
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
      `Error fetching monthly attendance data for ID ${studentId}:`,
      error,
    );
    return { msg: "Failed to fetch monthly attendance data", data: {} };
  }
};

const GetMonthlyAttendanceToolSchema = z.object({
  studentId: z.uuid(),
  month: z.number().min(1).max(12),
});

const GetMonthlyAttendanceTool = tool(getMonthlyAttendanceLogic, {
  name: "get_monthly_attendance",
  description:
    "Fetches monthly attendance data from the ERP system using the student ID and month.",
  schema: GetMonthlyAttendanceToolSchema,
});

const getDailyAttendanceLogic = async ({ studentId }: { studentId: UUID }) => {
  try {
    const response = await erpClient.get(`/attendance/daily/${studentId}`);
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
      `Error fetching daily attendance data for ID ${studentId}:`,
      error,
    );
    return { msg: "Failed to fetch daily attendance data", data: {} };
  }
};

const GetDailyAttendanceToolSchema = z.object({
  studentId: z.uuid(),
});

const GetDailyAttendanceTool = tool(getDailyAttendanceLogic, {
  name: "get_daily_attendance",
  description:
    "Fetches daily attendance data from the ERP system using the student ID.",
  schema: GetDailyAttendanceToolSchema,
});

const getSemesterAttendanceLogic = async ({
  studentId,
}: {
  studentId: UUID;
}) => {
  try {
    const response = await erpClient.get(`/attendance/sem/${studentId}`);
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
      `Error fetching semester attendance data for ID ${studentId}:`,
      error,
    );
    return { msg: "Failed to fetch semester attendance data", data: {} };
  }
};

const GetSemesterAttendanceToolSchema = z.object({
  studentId: z.uuid(),
});

const GetSemesterAttendanceTool = tool(getSemesterAttendanceLogic, {
  name: "get_semester_attendance",
  description:
    "Fetches semester attendance data from the ERP system using the student ID.",
  schema: GetSemesterAttendanceToolSchema,
});

export {
  GetMonthlyAttendanceTool,
  GetDailyAttendanceTool,
  GetSemesterAttendanceTool,
};
