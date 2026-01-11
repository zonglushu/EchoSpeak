/**
 * 测试翻译 API 调用
 */

async function testTranslate() {
  const jobId = 'd382a2ba-d338-4da9-87cd-0e50dad55221';
  const assetId = '751fead7-fa89-48e9-9f94-fe03c0ca2b8a';
  
  console.log('测试翻译 API...');
  console.log('Job ID:', jobId);
  console.log('Asset ID:', assetId);
  console.log();
  
  try {
    const response = await fetch('http://localhost:3001/api/ai/translate-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        assetId,
        sourceLanguage: 'en',
        targetLanguage: 'zh',
      }),
    });

    console.log('Status:', response.status, response.statusText);
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testTranslate();
