import { Mastra } from "@mastra/core";
import { assistantAgent } from "./agents/assistantAgent";
// 작성한 워크플로우
import { handsonWorkflow } from "./workflows/handson";


export const mastra = new Mastra({
  agents: { assistantAgent },
  // 작성한 워크플로우를 추가
  workflows: { handsonWorkflow },
});
