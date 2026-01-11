import React from 'react';

export interface ProsodyRendererProps {
  notation: string;
}

export const ProsodyRenderer: React.FC<ProsodyRendererProps> = ({ notation }) => {
  const renderStyledText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return (
          <span key={i} className="text-blue-600 font-black tracking-tight">
            {content}
          </span>
        );
      }

      const subParts = part.split(/(\*[^*]+\*)/g);
      return subParts.map((subPart, j) => {
        if (subPart.startsWith('*') && subPart.endsWith('*')) {
          const content = subPart.slice(1, -1);
          return (
            <span key={`${i}-${j}`} className="italic text-gray-700 font-medium">
              {content}
            </span>
          );
        }

        const charParts = subPart.split(/(\[ə\]|_|↘|↗|\|\||\|)/g);
        return charParts.map((charPart, k) => {
          switch (charPart) {
            case '[ə]':
              return (
                <span key={`${i}-${j}-${k}`} className="text-green-600 font-bold bg-green-50 px-0.5 rounded">
                  [ə]
                </span>
              );
            case '_':
              return (
                <span key={`${i}-${j}-${k}`} className="text-orange-400 font-bold">
                  _
                </span>
              );
            case '↘':
              return (
                <span key={`${i}-${j}-${k}`} className="text-red-500 font-bold mx-0.5">
                  ↘
                </span>
              );
            case '↗':
              return (
                <span key={`${i}-${j}-${k}`} className="text-blue-500 font-bold mx-0.5">
                  ↗
                </span>
              );
            case '|':
              return (
                <span key={`${i}-${j}-${k}`} className="text-purple-400 font-bold mx-1">
                  |
                </span>
              );
            case '||':
              return (
                <span key={`${i}-${j}-${k}`} className="text-purple-600 font-black mx-1">
                  ||
                </span>
              );
            default:
              return <span key={`${i}-${j}-${k}`}>{charPart}</span>;
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
