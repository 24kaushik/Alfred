import { tool } from "langchain";
import * as z from "zod";
import erpClient from "../../config/axios.config";
import { UUID } from "crypto";
import { wrapToolWithUser } from "../../utils/wrapToolWithUser";

const getAllSubjectsID = async ({ userId }: { userId: UUID }) => {
  try {
    const response = await erpClient.get(`/syllabus/${userId}`);
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
    console.error(`Error fetching subject IDs for ID ${userId}:`, error);
    return { msg: "Failed to fetch subject IDs", data: {} };
  }
};

const GetAllSubjectsIDTool = tool(wrapToolWithUser(getAllSubjectsID), {
  name: "get_all_subjects_id",
  description:
    "Fetches all subject IDs from the ERP system.",
});

const getSyllabusLogic = async ({
  userId,
  subjectID,
}: {
  userId: UUID;
  subjectID: string;
}) => {
  try {
    const response = await erpClient.post(`/syllabus/${userId}`, {
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
      `Error fetching syllabus data for ID ${userId} and subject ID ${subjectID}:`,
      error,
    );
    return { msg: "Failed to fetch syllabus data", data: {} };
  }
};

const GetSyllabusToolSchema = z.object({
  subjectID: z.string(),
});

const GetSyllabusTool = tool(wrapToolWithUser(getSyllabusLogic), {
  name: "get_syllabus",
  description:
    "Fetches syllabus data from the ERP system using the subject ID. To get subject id, use GetAllSubjectsIDTool tool.",
  schema: GetSyllabusToolSchema,
});

export { GetAllSubjectsIDTool, GetSyllabusTool };
