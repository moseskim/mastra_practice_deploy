import { cookies } from "next/headers";
import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession } from "aws-amplify/auth/server";
// Amplify 설정 파일 임포트
import outputs from "../amplify_outputs.json";

// Amplify 서버 러너 작성
const serverRunner = createServerRunner({
  config: outputs,
});

export const { runWithAmplifyServerContext } = serverRunner;

// 서버 사이드에서 인증 세션을 취득하는 함수
export async function AuthFetchAuthSessionServer() {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec: any) => fetchAuthSession(contextSpec),
    });
    return session;
  } catch (error) {
    return null;
  }
}