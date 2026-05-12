import { ToolRunnableConfig } from "@langchain/core/tools";

export const wrapToolWithUser = (toolFn: Function) => {
  return async (input: any, config: ToolRunnableConfig) => {
    if (
      !config.configurable ||
      !config.configurable.userId ||
      typeof config.configurable.userId !== "string"
    ) {
      throw new Error("Invalid user ID");
    }
    return toolFn({ ...input, userId: config.configurable.userId });
  };
};
