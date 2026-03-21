import * as z from "zod";
import { tool } from "langchain";
import { UUID } from "crypto";
import erpClient from "../config/axios.config";

const getStudentDataLogic = async (studentId: UUID) => {
  try {
    const response = await erpClient.get(`/general/${studentId}`);
    if (response.status === 200) {
      return { msg: "Student data fetched successfully", data: response.data };
    } else {
      throw new Error(
        `Failed to fetch student data: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(`Error fetching student data for ID ${studentId}:`, error);
    return { msg: "Failed to fetch student data", data: {} };
  }
};

const GetStudentDataToolSchema = z.uuid();

const GetStudentDataTool = tool(getStudentDataLogic, {
  name: "get_student_data",
  description: "Fetches student data from the ERP system using the student ID.",
  schema: GetStudentDataToolSchema,
});

export default GetStudentDataTool;
