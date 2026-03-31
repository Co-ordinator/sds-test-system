import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GOV } from '../theme/government';

const TestCompletion = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar placeholder matching SDS nav style */}
      <div className="h-14 bg-white border-b border-gray-200" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" strokeWidth={2.5} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              Congratulations,
              <br />
              you've completed the test!
            </h1>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
              You've taken a significant step towards understanding your career path. Your
              personalized results are ready for review.
            </p>
          </div>

          <div>
            <Link
              to="/results"
              className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold rounded-md shadow-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: GOV.blue }}
            >
              View My Results
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCompletion;
