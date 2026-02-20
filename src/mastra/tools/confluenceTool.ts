// 필요한 모듈을 임포트
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// 환경 변수에서 API를 취득
const CONFLUENCE_BASE_URL = process.env.CONFLUENCE_BASE_URL || "";
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN || "";
const CONFLUENCE_USER_EMAIL = process.env.CONFLUENCE_USER_EMAIL || "";


function getAuthHeaders(): Record<string, string> {
  const auth = Buffer.from(
    `${CONFLUENCE_USER_EMAIL}:${CONFLUENCE_API_TOKEN}`
  ).toString("base64");
  return {
    // API의 Basic 인증을 설정
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function callConfluenceAPI(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${CONFLUENCE_BASE_URL}/wiki/rest/api${endpoint}`;
  // fetch를 사용해 API 콜
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });


  if (!response.ok) {
    throw new Error(`Confluence API error: ${response.status}`);
  }
  return response.json();
}

// Confluence 페이지 검색 도구
export const confluenceSearchPagesTool = createTool({
  // 도구 ID
  id: "confluence-search-pages",
  // 도구 설명
  description: "Confluence에서 페이지를 검색합니다(CQL 쿼리 대응)",
  // 도구 입력 매개변수
  inputSchema: z.object({
    cql: z.string().describe("CQL(Confluence Query Language) 검색 쿼리"),
  }),
  // 도구 출력 매개변수
  outputSchema: z.object({
    pages: z.array(
      z.object({
        id: z.string().describe("페이지 ID"),
        title: z.string().describe("페이지 제목"),
        url: z.string().optional().describe("페이지 URL"),
      })
    ),
    total: z.number().describe("총 검색 결과 수"),
    error: z.string().optional().describe("에러 메시지"),
  }),
  execute: async ({ context }) => {
    // CQL 쿼리를 URL 인코드해 매개변수에 추가
    const params = new URLSearchParams();
    params.append("cql", context.cql);
    try {
      // API 콜
      const data = await callConfluenceAPI(`/search?${params.toString()}`);
      // 검색 결과로부터 페이지 목록 작성
      const pages = data.results.map((result: any) => ({
        id: result.content?.id,
        title: result.content?.title,
        url: result.url ? `${CONFLUENCE_BASE_URL}/wiki${result.url}` : undefined,
      }));
      return {pages, total: data.totalSize};
    } catch (error) {
      return {pages: [], total: 0, error: String(error)};
    }
  },
});

// Confluence 페이지 상세 취득 도구
export const confluenceGetPageTool = createTool({
  id: "confluence-get-page",
  description: "지정된 ID의 Confluence 페이지 상세를 얻습니다",
  inputSchema: z.object({
    pageId: z.string().describe("취득할 페이지 ID"),
    expand: z
      .string()
      // 설정이 꼭 필요하지 않은 항목은 optional을 지정
      .optional()
      .describe("추가로 취득하는 정보(body.storage,version,space)"),
  }),
  outputSchema: z.object({
    page: z.object({
      id: z.string().describe("페이지 ID"),
      title: z.string().describe("페이지 제목"),
      url: z.string().describe("페이지 URL"),
      content: z.string().optional().describe("페이지 콘텐츠(HTML 형식)"),
    }),
    error: z.string().optional().describe("에러 메시지"),
  }),
  execute: async ({ context }) => {
    // 입력 매개변수로부터 페이지 ID와 펼침 옵션을 취득
    const params = new URLSearchParams();
    if (context.expand) params.append("expand", context.expand);

    try {
      const endpoint = `/content/${context.pageId}${params.toString() ? `?${params.toString()}` : ""}`;
      // API 콜
      const page = await callConfluenceAPI(endpoint);
      return {
        page: {
          id: page.id,
          title: page.title,
          url: `${CONFLUENCE_BASE_URL}/wiki${page._links?.webui}`,
          content: page.body?.storage?.value || undefined,
        },
      };
    } catch (error) {
      return {
        error: String(error),
        page: { id: '', title: '', url: '', content: undefined, }
      };
    }
  },
});
