import React from 'react';

const BattlePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">⚔️</span>
                </div>

                <h1 className="text-3xl font-bold text-rose-800">Battle Mode</h1>
                <p className="text-rose-600 text-lg">
                    Intensive Interaction & Roleplay
                </p>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 mt-8">
                    <button className="bg-rose-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-rose-600 transition-colors transform hover:scale-105">
                        Start Mission
                    </button>
                    <p className="text-gray-400 text-sm mt-4">
                        Daily Challenge: Order a Coffee
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BattlePage;
