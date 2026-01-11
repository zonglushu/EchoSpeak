'use client';

import { useEffect, useState } from 'react';

export default function DebugProcessingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/videos/processing')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Debug: Processing Videos API</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Total Videos: {data?.videos?.length || 0}</h2>
        </div>

        {data?.videos?.map((video: any, index: number) => (
          <div key={index} className="border p-4 rounded">
            <h3 className="font-bold text-lg mb-2">Video {index + 1}: {video.asset.title}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Asset Info:</h4>
                <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                  {JSON.stringify(video.asset, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold">Cover URL:</h4>
                <div className="mt-1">
                  {video.asset.coverUrl ? (
                    <>
                      <p className="text-xs text-green-600 mb-2">✅ Has cover_url</p>
                      <p className="text-xs break-all bg-white p-2 rounded">{video.asset.coverUrl}</p>
                      <div className="mt-2">
                        <img 
                          src={video.asset.coverUrl} 
                          alt="Cover" 
                          className="max-w-xs"
                          onError={(e) => {
                            console.error('Image load error:', video.asset.coverUrl);
                            (e.target as HTMLImageElement).style.border = '2px solid red';
                          }}
                          onLoad={() => console.log('Image loaded:', video.asset.coverUrl)}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-red-600">❌ No cover_url</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Pipeline Info:</h4>
              <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
                {JSON.stringify(video.pipeline, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
