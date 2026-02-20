"use client";

import { useState } from 'react';
import { WorkflowForm } from './components/WorkflowForm';
import { WorkflowInstructions } from './components/WorkflowInstructions';
import { WorkflowResults } from './components/WorkflowResults';
import { WorkflowFormData, WorkflowResult } from './types/workflow';


// 워크플로우의 메인 페이지 컴포넌트
const Page = () => {
  // 폼 상태를 관리하기 위한 useState 훅
  const [formData, setFormData] = useState<WorkflowFormData>({
    query: "",
    owner: "",
    repo: ""
  });
  // 워크플로우 실행 상태와 결과를 관리하기 위한 useState 훅
  const [isLoading, setIsLoading] = useState(false);
  // 워크플로우 결과를 관리하기 위한 useState 훅
  const [result, setResult] = useState<WorkflowResult | null>(null);
  // 입력 필드 변경을 처리하는 함수
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 입력 필드명과 값을 취득
    const { name, value } = e.target;
    // 폼 데이터 상태를 업데이트
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 폼 송신 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 폼이 송신되었을 때 로딩 상태를 설정하고 결과를 초기화함
    setIsLoading(true);
    // 워크플로우 결과를 초기화
    setResult({
      success: false,
      message: "워크플로우 실행 중...",
      confluencePages: [],
      githubIssues: [],
      steps: []
    });

    try {
      // API 엔드포인트에 POST 요청을 송신
      const response = await fetch("/api/workflow/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 결과를 JSON 형식으로 취득
      const data = await response.json();
      // 응답 결과를 state에 설정
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: "워크플로우 실행 중 에러가 발생했습니다.",
        error: error instanceof Error ? error.message : "분명하지 않은 에러",
        confluencePages: [],
        githubIssues: [],
        steps: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br
     from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm
           rounded-2xl shadow-xl border border-gray-100
            p-8 transition-all hover:shadow-2xl">
            <h1 className="text-3xl font-bold
             bg-gradient-to-r from-blue-600
              to-purple-600 bg-clip-text
               text-transparent mb-8">
              요구사항 문서 → 제품 백로그 워크플로우
            </h1>

            {/* 워크플로우 설명과 순서를 표시하는 컴포넌트 */}
            <div className="mb-8">
              <WorkflowInstructions />
            </div>

            {/* 워크플로우 폼 컴포넌트 */}
            <WorkflowForm
              formData={formData}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />

            {/* 워크플로우 결과를 표시하는 컴포넌트 */}
            <WorkflowResults result={result} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;