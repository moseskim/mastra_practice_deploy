import { createTool } from "@mastra/core/tools";
import { z } from "zod";
// GitHub API를 실행하기 위한 토큰은 환경 변수에서 취득
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export const githubCreateIssueTool = createTool({
  id: "githubCreateIssue",
  description:
    "GitHub에 여러 Issue를 작성합니다. 버그 보고, 기능 요구사항, 질문 등에 사용할 수 있습니다.",
  inputSchema: z.object({
    owner: z
      .string()
      .describe("저장소 소유자명(사용자명 또는 organization명)"),
    repo: z.string().describe("저장소명"),
    // issues는 타이틀과 본문을 가진 오브젝트를 포함하는 배열
    issues: z.array(z.object({
      title: z.string().describe("Issue 타이틀"),
      body: z.string().optional().describe("Issue 본문/상세 설명"),
    })).describe("작성할 Issue 리스트"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    // createdissues도 배열
    createdIssues: z.array(z.object({
      issueNumber: z.number().optional(),
      issueUrl: z.string().optional(),
      title: z.string(),
    })),
    errors: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    // inputSchema에 따라 데이터 취득
    const {owner, repo, issues} = context;
    const createdIssues: Array<{ issueNumber?: number; issueUrl?: string; title: string }> = [];
    const errors: string[] = [];

    for (const issue of issues) {
      try {
        // issues 작성 API를 실행
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/issues`,
          {
            method: "POST",
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${GITHUB_TOKEN}`,
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: issue.title,
              body: issue.body,
            }),
          }
        );
        // 에러 핸들링
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = `GitHub API 에러: ${response.status} - ${errorData.message || "Unknown error"}`;
          // 작성 실패한 issue는 errors에 저장
          errors.push(`Failed to create issue "${issue.title}": ${errorMessage}`);
          continue;
        }
        // issue를 작성했을 때는 createdIssues에 저장
        const issueData = await response.json();
        createdIssues.push({
          issueNumber: issueData.number,
          issueUrl: issueData.html_url,
          title: issue.title,
        });
      } catch (error) {
        const errorMessage = `요청 실패: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(`Error creating issue "${issue.title}": ${errorMessage}`);
      }
    }
    return {
      success: createdIssues.length > 0,
      createdIssues,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
