import { Agent } from "@mastra/core/agent";
import { getBedrockModel } from "../../../lib/aws-config";

const model = await getBedrockModel();

export const assistantAgent = new Agent({
  id: "assistant",
  name: "assistant",
  instructions:
    "당신은 친절하고 지식이 풍부한 AI 어시스턴트입니다. 사용자의 질문에 대해 이해하기 쉽게 친절하게 대답해 주십시오. 필요에 따라 GitHub 도구를 사용해 Issue를 작성할 수도 있습니다.",
  model: model,
});
