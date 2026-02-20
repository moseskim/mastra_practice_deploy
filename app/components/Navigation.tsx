"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";

export const Navigation = () => {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 타이틀을 표시할 부분(왼쪽) */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">AI Assistant</h1>
            </div>
          </div>
          {/* 사용자 정보와 사인 및 경고 보튼을 표시하는 부분(오른쪽) */}
          <div className="flex items-center space-x-4">
            { /* 사용자명을 표시하는 부분 */}
            <span className="text-sm text-gray-600">{user?.signInDetails?.loginId}</span>
            { /* 사인아웃 버튼 */}
            <button
              onClick={signOut}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
