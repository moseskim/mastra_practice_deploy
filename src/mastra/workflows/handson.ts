import { createWorkflow, createStep } from "@mastra/core/workflows";
import {
  confluenceSearchPagesTool,
  confluenceGetPageTool,
} from "../tools/confluenceTool";
// 작성한 도구를 import
import { githubCreateIssueTool } from "../tools/githubTool";
import { assistantAgent } from "../agents/assistantAgent";
import { z } from "zod";


const confluenceSearchPagesStep = createStep(confluenceSearchPagesTool);
const confluenceGetPageStep = createStep(confluenceGetPageTool);
// 작성한 GitHub Issues 도구를 단계화
const githubCreateIssueStep = createStep(githubCreateIssueTool);
export const handsonWorkflow = createWorkflow({
  id: "handsonWorkflow",
  // 워크플로우 동작이 바뀌었으므로 수정
  description:
    "자연 언어 질문으로부터  Confluence에서 요구사항 문서를 검색하고, GitHub Issue로서 개발 백로그를 자동으로 작성합니다.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "검색할 내용을 자연 언어로 입력해 주십시오(예시: 'AI에 관한 정보', '최신 프로젝트 정보')"
      ),
    // GitHub 계정명을 추가
    owner: z
      .string()
      .describe("GitHub 저장소의 소유자명(사용자명 또는 organization명)"),
    // GitHub 저장소명을 추가
    repo: z.string().describe("GitHub 저장소명"),
  }),
  // GitHub 도구의 outputSchema를 그대로 지정
  outputSchema: githubCreateIssueTool.outputSchema,
})
  .then(
    createStep({
      id: "generate-cql-query",
      inputSchema: z.object({
        // 워크플로우의 inputSchema와 맞춤
        query: z.string(), owner: z.string(), repo: z.string(),
      }),
      outputSchema: z.object({cql: z.string()}),
      execute: async ({ inputData }) => {
        const prompt = `
다음의 자연 언어로 작성된 검색 요구사항을 Confluence CQL (Confluence Query Language)로 변환해 주십시오.
CQL 기본 구문:
- text ~ "검색어": 전문 검색
- title ~ "타이틀": 타이틀 검색
- space = "스페이스 키": 특정 스페이스 내부를 검색
- type = page: 페이지만 검색
- created >= "2024-01-01": 날짜 필터

검색 요구사항: ${inputData.query}

重要: 
- 단순한 정보 검색일 때는 text ~ "단어" 형태를 사용
- 복잡한 단어를 포함했을 때는 AND로 결합
- 한국어 검색어도 그대로 사용할 수 있음
- 응답은 CQL 쿼리만 반환해 주십시오.

CQLクエリ:`;

        try {
          const result = await assistantAgent.generateVNext(prompt);
          const cql = result.text.trim();
          return { cql };
        } catch (error) {
          const fallbackCql = `text ~ "${inputData.query}"`;
          return { cql: fallbackCql };
        }
      },
    })
  )
  .then(confluenceSearchPagesStep)
  .then(
    createStep({
      id: "select-first-page",
      inputSchema: z.object({
        pages: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            url: z.string().optional(),
          })
        ),
        total: z.number(),
        error: z.string().optional(),
      }),
      outputSchema: z.object({
        pageId: z.string(),
        expand: z.string().optional(),
      }),
      execute: async ({ inputData }) => {
        // 페이지 목록 취득
        const { pages, error } = inputData;
        if (error) {
          throw new Error(`검색 에러: ${error}`);
        }
        if (!pages || pages.length === 0) {
          throw new Error("검색 결과를 발견하지 못했습니다.");
        }

        // 최초 페이지 취득
        const firstPage = pages[0];
        return {
          pageId: firstPage.id,
          expand: "body.storage",
        };
      },
    })
  )
  // Confluence 페이지를 얻는 단계를 추가
  .then(confluenceGetPageStep)
  .then(
    createStep({
      id: "create-development-tasks",
      // Confluence 페이지 취득 도구의 outputSchema를 그대로 지정
      inputSchema: confluenceGetPageTool.outputSchema,
      // GitHub Issues 작성 도구의 inputSchema를 그대로 지정
      outputSchema: githubCreateIssueTool.inputSchema,
      execute: async ({ inputData, getInitData }) => {
        // 이전 단계에서 전달 받은 Confluence 페이지 정보
        const { page, error } = inputData;
        // GitHub 저장소 정보는 워크플로우 초기 데이터로부터 취득
        const { owner, repo, query } = getInitData();


        // 필요한 정보를 얻을 수 없을 때는 에러 메시지 송신
        if (error || !page || !page.content) {
          return {
            owner: owner || "",
            repo: repo || "",
            issues: [
              {
                title: "에러: 페이지 내용을 취득하지 못했습니다.",
                body: "Confluence 페이지 내용을 취득하지 못했습니다.",
              },
            ],
          };
        }
        // 에이전트로부터의 출력 형식을 규정
        const outputSchema = z.object({
          issues: z.array(
            z.object({
              title: z.string(),
              body: z.string(),
            })
          ),
        });
        // 프롬프트
        const analysisPrompt = `다음 Confluence 페이지 내용은 요구사항 문서입니다. 이 요구사항을 분석하고 개발 백로그 GitHub Issue를 여러 개 작성하기 위한 정보를 생성해 주십시오.
사용자 질문: ${query}
페이지 타이틀: ${page.title}
페이지 내용:  
${page.content}
중요: 
- 요구사항 문서의 내용을 기능이나 컴포넌트 단위로 분할한다.
- 각 Issue의 title은 간략하고 이해하기 쉽게 기술한다.
- body는 Markdown 형식으로 구조화한다.
- 형식은 JSON 배열 형식으로, 반드시 출력한다. 관습적인 수식어는 불필요하다.  최상위 배열은 반드시기 대괄호를 포함한다.
- \`\`\`json 같은 코드 블록은 불필요하다,
- 2개의 Issue를 작성한다.
- 모호한 부분은 '확인 필요'라고 기재한다`;

        try {
          const result = await assistantAgent.generateVNext(analysisPrompt, {
            output: outputSchema, // 에이전트로부터의 출력 형식을 지정
          });
          // JSON으로부터 Issue 배열을 꺼낸다
          const parsedResult = JSON.parse(result.text);
          const issues = parsedResult.issues.map((issue: any) => ({
            title: issue.title,
            body: issue.body,
          }));
          return {
            owner: owner || "",
            repo: repo || "",
            issues: issues,
          };
        } catch (error) {
          return {
            owner: owner,
            repo: repo,
            issues: [
              {
                title: "에러: Issue 작성 실패",
                body: "에러가 발생했습니다: " + String(error),
              },
            ],
          };
        }
      },
    })
  )
  .then(githubCreateIssueStep)
  .commit();