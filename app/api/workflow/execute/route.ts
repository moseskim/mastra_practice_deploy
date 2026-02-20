import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    // 요청 바디를 취득
    const body = await request.json();
    const { query, owner, repo } = body;


    // 배리에이션 실시(매개변수가 부족하면 에러를 반환한다)
    if (!query || !owner || !repo) {
      return NextResponse.json(
        { error: "필요한 매개변수가 부족합니다." },
        { status: 400 }
      );
    }
    // Mastra 워크플로우 인스턴스를 취득
    const { mastra } = await import("@/src/mastra");
    const workflow = mastra.getWorkflow("handsonWorkflow");

    if (!workflow) {
      throw new Error("워크플로우를 찾을 수 없습니다.");
    }

    // 워크플로우를 실행
    const run = await workflow.createRunAsync();
    const result = await run.start({
      inputData: { query, owner, repo }
    });

    // 반환 메시지와 상태를 작성
    let message;
    let isSuccess;
    if (result.status === "success" && result.result.success) {
      message = "워크플로우를 정상 완료했습니다.";
      isSuccess = true;
    } else {
      message = `${(result as any).error} ${(result as any).result.errors}`;
      isSuccess = false;
    }
    // Mastra 워크플로우 결과로부터 필요한 정보를 추출
    const workflowOutput = result.status === "success" ? result.result : null;
    const createdIssues = workflowOutput?.createdIssues || [];

    // 결과를 API 응답으로써 반환
    return NextResponse.json({
      success: isSuccess,
      confluencePages: [{
        title: query,
        message: "요구사항 문서를 검색하고 취득했습니다."
      }],
      githubIssues: createdIssues,
      message: message,
      steps: result.steps ? Object.keys(result.steps).map(stepId => ({
        stepId,
        status: (result.steps as any)[stepId].status
      })) : []
    });

  } catch (error) {
    // 에러를 API 응답으로서 반환
    return NextResponse.json(
      {
        error: "워크플로우 실행 중 에러가 발생했습니다.",
        details: error instanceof Error ? error.message : "에러"
      },
      { status: 500 }
    );
  }
}