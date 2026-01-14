import React from 'react';

const ThinkPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">💡</span>
                </div>

                <h1 className="text-3xl font-bold text-indigo-800">Think Mode</h1>
                <p className="text-indigo-600 text-lg">
                    Reflective Consolidation & Logic
                </p>

                <div className="space-y-4 w-full mt-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex items-center space-x-4">
                        <div className="w-2 h-12 bg-indigo-300 rounded-full"></div>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-800">Chunk Review</h3>
                            <p className="text-xs text-gray-500">12 items to review</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThinkPage;
