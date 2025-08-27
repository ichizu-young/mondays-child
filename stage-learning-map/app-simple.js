const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 3001;

// Excel의 IFERROR 수식에서 실제 값을 추출하는 함수
function extractCleanValue(cellValue) {
  if (!cellValue || typeof cellValue !== 'string') {
    return cellValue;
  }
  
  if (cellValue.includes('IFERROR') && cellValue.includes('COMPUTED_VALUE')) {
    const parts = cellValue.split(',');
    if (parts.length > 1) {
      let lastPart = parts[parts.length - 1].trim();
      if (lastPart.endsWith(')')) {
        lastPart = lastPart.slice(0, -1).trim();
        if (lastPart.startsWith('"') && lastPart.endsWith('"')) {
          lastPart = lastPart.slice(1, -1);
        }
        return lastPart;
      }
    }
  }
  
  return cellValue;
}

// 모의 데이터 (실제 Excel 파일 대신 사용)
const mockStagesData = [
  {
    '#stage': '=IFERROR(__xludf.DUMMYFUNCTION("""COMPUTED_VALUE"""),"g3l1_abc1")',
    '#learningMapCodes': 'E4ENGA02B05C07D01\nE4ENGA02B11C18D01'
  },
  {
    '#stage': '=IFERROR(__xludf.DUMMYFUNCTION("""COMPUTED_VALUE"""),"g3l2_def2")',
    '#learningMapCodes': 'E4ENGA03B06C08D02'
  }
];

const mockLearningMapData = [
  {
    content3_id: 'E4ENGA02B05C07D01',
    content3: '문장 말하기(인사말)',
    content4: '',
    standards_id: '[4영02-05]',
    standard_desc: '자신, 주변 사람이나 사물의 소개나 묘사를 쉽고 간단한 문장으로 말하거나 보고 쓴다.'
  },
  {
    content3_id: 'E4ENGA02B11C18D01',
    content3: '매체 활용 말하기',
    content4: '',
    standards_id: '[4영02-09]',
    standard_desc: '적절한 매체나 전략을 활용하여 창의적으로 의미를 표현한다.'
  },
  {
    content3_id: 'E4ENGA03B06C08D02',
    content3: '어휘 학습',
    content4: '',
    standards_id: '[4영03-02]',
    standard_desc: '그림, 도표 등을 활용하여 간단한 정보를 파악한다.'
  }
];

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (pathname === '/') {
    // index.html 제공
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (pathname.startsWith('/api/stage/')) {
    // 스테이지 조회 API
    const stageId = pathname.split('/')[3];
    
    try {
      // 스테이지 데이터에서 해당 스테이지 찾기
      const stageInfo = mockStagesData.find(stage => {
        const cleanStage = extractCleanValue(stage['#stage']);
        return cleanStage && cleanStage.toString() === stageId;
      });

      if (!stageInfo) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          message: '해당 스테이지를 찾을 수 없습니다.' 
        }));
        return;
      }

      // 학습맵 코드 추출 (쉼표나 줄바꿈으로 구분된 경우 처리)
      const rawLearningMapCodes = extractCleanValue(stageInfo['#learningMapCodes']);
      if (!rawLearningMapCodes) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          stage: stageId,
          learningMapCodes: [],
          learningMapDetails: []
        }));
        return;
      }

      // 학습맵 코드를 배열로 변환 (쉼표나 줄바꿈으로 분리)
      const codesArray = rawLearningMapCodes.toString()
        .split(/[,\n]/)
        .map(code => code.trim())
        .filter(code => code.length > 0);

      // 각 학습맵 코드에 대한 상세 정보 찾기
      const learningMapDetails = codesArray.map(code => {
        const details = mockLearningMapData.filter(item => {
          const cleanContent3Id = extractCleanValue(item.content3_id);
          const cleanContent4Id = extractCleanValue(item.content4_id);
          return (cleanContent3Id && cleanContent3Id.toString() === code) ||
                 (cleanContent4Id && cleanContent4Id.toString() === code);
        });

        return {
          code: code,
          details: details.map(detail => ({
            content3: extractCleanValue(detail.content3) || '',
            content4: extractCleanValue(detail.content4) || '',
            content3_id: extractCleanValue(detail.content3_id) || '',
            content4_id: extractCleanValue(detail.content4_id) || '',
            standards_id: extractCleanValue(detail.standards_id) || '',
            standard_desc: extractCleanValue(detail.standard_desc) || ''
          }))
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        stage: stageId,
        learningMapCodes: codesArray,
        learningMapDetails: learningMapDetails
      }));

    } catch (error) {
      console.error('스테이지 조회 중 오류 발생:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        message: '서버 오류가 발생했습니다.' 
      }));
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`스테이지-학습맵 조회 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log('테스트용 모의 데이터를 사용합니다.');
  console.log('테스트 스테이지: g3l1_abc1, g3l2_def2');
});