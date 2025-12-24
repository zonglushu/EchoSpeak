
import React from 'react';

interface Props {
  notation: string;
}

const ProsodyRenderer: React.FC<Props> = ({ notation }) => {
  // Simple parser to turn notation markers into Tailwind-styled spans
  // Supports: **TEXT**, *text*, [ə], _, ↘, ↗, |, ||
  
  const renderStyledText = (text: string) => {
    let segments: React.ReactNode[] = [];
    let currentText = text;

    // A robust regex-based approach for complex nesting would be better,
    // but for the defined spec, we can use a sequential replacement or regex split.
    
    // 1. Nuclear Stress (BOLD CAPS)
    const parts = currentText.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return <span key={i} className="text-blue-600 font-black tracking-tight">{content}</span>;
      }
      
      // 2. Secondary Stress (Italics)
      const subParts = part.split(/(\*[^*]+\*)/g);
      return subParts.map((subPart, j) => {
        if (subPart.startsWith('*') && subPart.endsWith('*')) {
          const content = subPart.slice(1, -1);
          return <span key={`${i}-${j}`} className="italic text-gray-700 font-medium">{content}</span>;
        }

        // 3. Special Characters
        const charParts = subPart.split(/(\[ə\]|_|↘|↗|\|\||\|)/g);
        return charParts.map((charPart, k) => {
          switch (charPart) {
            case '[ə]': return <span key={`${i}-${j}-${k}`} className="text-green-600 font-bold bg-green-50 px-0.5 rounded">[ə]</span>;
            case '_': return <span key={`${i}-${j}-${k}`} className="text-orange-400 font-bold">_</span>;
            case '↘': return <span key={`${i}-${j}-${k}`} className="text-red-500 font-bold mx-0.5">↘</span>;
            case '↗': return <span key={`${i}-${j}-${k}`} className="text-blue-500 font-bold mx-0.5">↗</span>;
            case '|': return <span key={`${i}-${j}-${k}`} className="text-purple-400 font-bold mx-1">|</span>;
            case '||': return <span key={`${i}-${j}-${k}`} className="text-purple-600 font-black mx-1">||</span>;
            default: return <span key={`${i}-${j}-${k}`}>{charPart}</span>;
          }
        });
      });
    });
  };

  return (
    <div className="notation-font text-lg leading-relaxed bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm whitespace-pre-wrap">
      {renderStyledText(notation)}
    </div>
  );
};

export default ProsodyRenderer;
