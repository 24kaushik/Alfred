import { createAgent } from "langchain";
import { GPTOSS_120B } from "../config/models.config";
import GetStudentDataTool from "../tools/erp/getStudentData.tool";
import {
  GetAllSubjectsIDTool,
  GetSyllabusTool,
} from "../tools/erp/getSyllabus.tool";
import {
  GetMonthlyAttendanceTool,
  GetDailyAttendanceTool,
  GetSemesterAttendanceTool,
} from "../tools/erp/getAttendance.tool";
import { GetTimetableTool } from "../tools/erp/timetable.tool";

const erpAgent = createAgent({
  model: GPTOSS_120B,
  tools: [
    GetStudentDataTool,
    GetAllSubjectsIDTool,
    GetSyllabusTool,
    GetTimetableTool,
    GetMonthlyAttendanceTool,
    GetDailyAttendanceTool,
    GetSemesterAttendanceTool,
  ],
});

export default erpAgent;
