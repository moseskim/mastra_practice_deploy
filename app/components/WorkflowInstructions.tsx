export const WorkflowInstructions = () => {
  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-purple-50
       border-2 border-blue-200 rounded-2xl p-6 shadow-md
       hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-transparent
       bg-gradient-to-r from-blue-700 to-purple-700
        bg-clip-text mb-4">
        ✨ 워크플로우의 흐름
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2
       lg:grid-cols-4 gap-4">
        <div className="flex items-start space-x-3">
          <span
            className="flex-shrink-0 w-8 h-8 bg-blue-600
             text-white rounded-full flex items-center
              justify-center font-bold">1</span>
          <p className="text-gray-700 font-medium">Confluence 요구사항 정의를 검색</p>
        </div>
        <div className="flex items-start space-x-3">
          <span
            className="flex-shrink-0 w-8 h-8 bg-purple-600
             text-white rounded-full flex items-center
              justify-center font-bold">2</span>
          <p className="text-gray-700 font-medium">요구사항 정의를 분석</p>
        </div>
        <div className="flex items-start space-x-3">
          <span
            className="flex-shrink-0 w-8 h-8 bg-indigo-600
             text-white rounded-full flex items-center
              justify-center font-bold">3</span>
          <p className="text-gray-700 font-medium">백로그로 분해</p>
        </div>
        <div className="flex items-start space-x-3">
          <span
            className="flex-shrink-0 w-8 h-8 bg-pink-600
             text-white rounded-full flex items-center
              justify-center font-bold">4</span>
          <p className="text-gray-700 font-medium">GitHub Issue 작성</p>
        </div>
      </div>
    </div>
  );
}
