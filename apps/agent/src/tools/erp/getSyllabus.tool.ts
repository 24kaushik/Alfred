import { tool } from "langchain";
import * as z from "zod";
import erpClient from "../../config/axios.config";
import { UUID } from "crypto";

const getAllSubjectsID = async (studentId: UUID) => {
  try {
    const response = await erpClient.get(`/syllabus/${studentId}`);
    if (response.status === 200) {
      return {
        msg: "Subject IDs fetched successfully",
        data: response.data,
      };
    } else {
      throw new Error(
        `Failed to fetch subject IDs: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(`Error fetching subject IDs for ID ${studentId}:`, error);
    return { msg: "Failed to fetch subject IDs", data: {} };
  }
};

const GetAllSubjectsIDToolSchema = z.uuid();

const GetAllSubjectsIDTool = tool(getAllSubjectsID, {
  name: "get_all_subjects_id",
  description:
    "Fetches all subject IDs from the ERP system using the student ID.",
  schema: GetAllSubjectsIDToolSchema,
});

const getSyllabusLogic = async ({
  studentId,
  subjectID,
}: {
  studentId: UUID;
  subjectID: string;
}) => {
  try {
    const response = await erpClient.post(`/syllabus/${studentId}`, {
      subjectID,
    });
    if (response.status === 200) {
      return {
        msg: "Syllabus data fetched successfully",
        data: response.data,
      };
    } else {
      throw new Error(
        `Failed to fetch syllabus data: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(
      `Error fetching syllabus data for ID ${studentId} and subject ID ${subjectID}:`,
      error,
    );
    return { msg: "Failed to fetch syllabus data", data: {} };
  }
};

const GetSyllabusToolSchema = z.object({
  studentId: z.uuid(),
  subjectID: z.string(),
});

const GetSyllabusTool = tool(getSyllabusLogic, {
  name: "get_syllabus",
  description:
    "Fetches syllabus data from the ERP system using the student ID and subject ID. To get subject id, use GetAllSubjectsIDTool tool.",
  schema: GetSyllabusToolSchema,
});

export { GetAllSubjectsIDTool, GetSyllabusTool };
