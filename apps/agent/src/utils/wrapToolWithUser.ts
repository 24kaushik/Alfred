import { ToolRunnableConfig } from "@langchain/core/tools";

export const wrapToolWithUser = (toolFn: Function) => {
  return async (input: any, config: ToolRunnableConfig) => {
    if (
      !config.metadata ||
      !config.metadata.userId ||
      typeof config.metadata.userId !== "string"
    ) {
      throw new Error("Invalid user ID");
    }
    return toolFn({ ...input, userId: config.metadata.userId });
  };
};
