import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-blue-900 text-white p-2 rounded-full mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-bold text-lg">SDS</span>
        </div>
        
        <button className="bg-blue-100 text-blue-900 rounded-full h-8 w-8 flex items-center justify-center">
          ?
        </button>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-50 flex-grow flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-8">
          <img 
            src="/siyinqaba.png" 
            alt="Eswatini Government Coat of Arms" 
            className="h-24 mx-auto"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Self-Directed Search (SDS)</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Discover your career interests and find matching occupations with this comprehensive assessment tool.
        </p>
        
        <Link 
          to="/register" 
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-lg shadow-md transition-colors"
        >
          Take Career Test
        </Link>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16 px-6">
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-12">How It Works</h2>
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="bg-blue-100 text-blue-900 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Register & Login</h3>
            <p className="text-gray-600">
              Create your secure account to get started on your career journey.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="bg-blue-100 text-blue-900 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Take the Assessment</h3>
            <p className="text-gray-600">
              Complete the interactive SDS test at your own pace, answering questions about your activities, skills, and interests.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="bg-blue-100 text-blue-900 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">View Your Results</h3>
            <p className="text-gray-600">
              Receive a personalized report with your Holland Code, detailed interpretations, and career recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-6 px-6 text-center">
        <p className="text-sm text-gray-500">
          Made with Visily • Government of Eswatini
        </p>
      </footer>
    </div>
  );
}
