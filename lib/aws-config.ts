import { AuthFetchAuthSessionServer } from "./amplify-server-utils";


export async function getBedrockModel() {
  try {
    // Bedrock 클라이언트를 임포트
    const { createAmazonBedrock } = await import("@ai-sdk/amazon-bedrock");
    // Bedrock 모델의 ID와 리전 설정
    const modelId = "us.anthropic.claude-3-7-sonnet-20250219-v1:0";
    const region = process.env.AWS_REGION || "us-west-2";
    // 인증 세션 취득
    const session = await AuthFetchAuthSessionServer();
    if (!session || !session.credentials) {
      throw new Error("Failed to get authentication session");
    }
    // Bedrock 클라이언트를 생성
    const bedrock = createAmazonBedrock({
      region,
      accessKeyId: session.credentials.accessKeyId,
      secretAccessKey: session.credentials.secretAccessKey,
      sessionToken: session.credentials.sessionToken,
    });
    // 모델 취득
    const model = bedrock(modelId);
    return model;
  } catch (error) {
    throw error;
  }
}
