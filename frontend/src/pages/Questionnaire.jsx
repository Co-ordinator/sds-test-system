import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, User, GraduationCap } from 'lucide-react';

const Questionnaire = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [answers, setAnswers] = useState({});
  const totalQuestions = 6;

  const question = {
    id: 1,
    text: 'I like to work with my hands to build or fix things.',
  };

  const answerOptions = [
    { value: 1, label: 'Strongly Disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly Agree' },
  ];

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion]: value });
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-200 h-14 flex items-center px-6">
        <div className="flex-1 flex items-center gap-2 text-slate-800 font-semibold">
          <div className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span>SDS</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center text-sm text-slate-500 mb-6">Question {currentQuestion} of {totalQuestions}</div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">
            {question.text}
          </h2>
        </div>

        <div className="space-y-3 mb-8">
          {answerOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={`w-full text-left px-4 py-4 rounded-lg border transition-all ${
                answers[currentQuestion] === option.value
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 text-slate-700">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  answers[currentQuestion] === option.value ? 'border-indigo-500' : 'border-gray-300'
                }`}>
                  {answers[currentQuestion] === option.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  )}
                </div>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-6">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 1}
            className={`px-5 py-2 rounded-md text-sm font-medium border ${
              currentQuestion === 1
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-slate-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
            className={`px-6 py-2 rounded-md text-sm font-semibold shadow-sm ${
              !answers[currentQuestion]
                ? 'bg-indigo-200/70 text-white cursor-not-allowed'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
