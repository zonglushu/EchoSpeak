
import React from 'react';
import { NOTATION_GUIDE } from '../constants';

const NotationLegend: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
        如何看“发音谱子” (How to Read Prosody Script)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NOTATION_GUIDE.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 transition-hover hover:shadow-md">
            <div className={`text-sm font-bold mb-1 ${item.color}`}>{item.symbol}</div>
            <div className="text-xs text-gray-500 mb-2">{item.description}</div>
            <div className="text-xs font-mono bg-white p-1 rounded border border-gray-200">
              <span className="text-gray-400 mr-2">Example:</span>
              <span className="italic">{item.example}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotationLegend;
