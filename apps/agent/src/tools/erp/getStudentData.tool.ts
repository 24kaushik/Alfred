import * as z from "zod";
import { tool } from "langchain";
import { UUID } from "crypto";
import erpClient from "../../config/axios.config";
import { wrapToolWithUser } from "../../utils/wrapToolWithUser";

const getStudentDataLogic = async ({ userId }: { userId: UUID }) => {
  try {
    const response = await erpClient.get(`/general/${userId}`);
    if (response.status === 200) {
      return { msg: "Student data fetched successfully", data: response.data };
    } else {
      throw new Error(
        `Failed to fetch student data: ${response.statusText};\n Response data: ${JSON.stringify(response.data)}`,
      );
    }
  } catch (error) {
    console.error(`Error fetching student data for ID ${userId}:`, error);
    return { msg: "Failed to fetch student data", data: {} };
  }
};

const GetStudentDataTool = tool(wrapToolWithUser(getStudentDataLogic), {
  name: "get_student_data",
  description: "Fetches student data from the ERP system.",
});

export default GetStudentDataTool;
