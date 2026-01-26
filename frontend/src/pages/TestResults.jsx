import React from 'react';
import { Download, Mail, FileText } from 'lucide-react';

const TestResults = () => {

  const riasecResults = [
    { name: 'Realistic', score: 82 },
    { name: 'Investigative', score: 65 },
    { name: 'Artistic', score: 90 },
    { name: 'Social', score: 70 },
    { name: 'Enterprising', score: 55 },
    { name: 'Conventional', score: 60 },
  ];

  const hollandCodes = [
    {
      title: 'Artistic-Realistic-Enterprising (ARE)',
      description:
        'Individuals who are highly artistic, enjoy hands-on work, and possess leadership qualities. They are often innovative, practical, and persuasive, thriving in environments that allow for creative expression and tangible results.',
    },
    {
      title: 'Social-Investigative-Artistic (SIA)',
      description:
        'People with strong social skills, a desire for understanding, and a creative flair. They are often empathetic, analytical, and imaginative, preferring roles that involve helping others, problem-solving, and self-expression.',
    },
    {
      title: 'Investigative-Conventional-Enterprising (ICE)',
      description:
        'This combination suggests a person who is analytical, organized, and enjoys leading or influencing others. They are typically detail-oriented, systematic, and ambitious, often excelling in structured environments that require careful planning and strategic execution.',
    },
  ];

  const careerRecommendations = [
    { title: 'Graphic Designer', description: 'Creates visual concepts using computer software or by hand, to communicate ideas that inspire, inform, or captivate consumers.' },
    { title: 'Marketing Manager', description: 'Develops strategies to promote products or services. Manages marketing campaigns and identifies market trends.' },
    { title: 'Event Planner', description: 'Coordinates all aspects of professional meetings and events. This includes choosing locations, inviting speakers, and arranging transportation.' },
    { title: 'Architect', description: 'Plans and designs buildings and other structures. Works with clients to determine requirements and prepares drawings and specifications.' },
    { title: 'Software Developer', description: 'Designs, develops, and installs software solutions. Collaborates with users to understand their needs.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Hero */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">Your SDS Career Test Results</h1>
          <p className="text-slate-600 leading-relaxed max-w-4xl text-sm">
            Congratulations on completing your Self-Directed Search (SDS) Career Test! Below you will find a personalized overview of your RIASEC scores, an interpretation of your Holland Codes, and tailored career recommendations based on your unique profile. Take your time to explore these insights.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm">
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold shadow-sm">
              <Mail className="w-4 h-4" />
              Email Results
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {/* Scores & Holland Codes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Your RIASEC Scores</h3>
            <p className="text-xs text-slate-500 mb-4">A visual representation of your interests across the six RIASEC dimensions.</p>
            <div className="space-y-3">
              {riasecResults.map((area) => (
                <div key={area.name} className="space-y-1">
                  <div className="text-xs text-slate-500">{area.name}</div>
                  <div className="w-full bg-gray-100 rounded-full h-7 flex items-center overflow-hidden">
                    <div
                      className="bg-gray-600 h-7 text-white text-xs font-semibold px-3 flex items-center"
                      style={{ width: `${Math.min(area.score, 100)}%` }}
                    >
                      {area.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Your Top Holland Codes</h3>
            <p className="text-xs text-slate-500 mb-4">Understanding your primary interest areas and their implications.</p>
            <div className="space-y-4">
              {hollandCodes.map((code) => (
                <div key={code.title} className="space-y-1">
                  <p className="text-indigo-700 font-semibold text-sm">{code.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{code.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Career Recommendations */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-2">Career Recommendations</h3>
          <p className="text-xs text-slate-500 mb-4">Explore career paths aligned with your unique RIASEC profile.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careerRecommendations.map((career) => (
              <div key={career.title} className="flex items-start gap-3">
                <div className="bg-indigo-50 text-indigo-700 w-9 h-9 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{career.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed mt-1">{career.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
