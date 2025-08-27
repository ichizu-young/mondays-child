const express = require('express');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const port = 3001;

// 데이터 파일 경로
const STAGES_FILE = '/Users/hwanghyeyoung/aiprojects/data/aichatprac1_stages_1.xlsx';
const LEARNING_MAP_FILE = '/Users/hwanghyeyoung/aiprojects/data/Develop_Learning_Map_Code_ENG.xlsx';

// 정적 파일 제공
app.use(express.static('public'));
app.use(express.json());

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

// Excel 파일 데이터 로드 함수
function loadExcelData() {
  try {
    // 스테이지 데이터 로드
    const stagesWorkbook = xlsx.readFile(STAGES_FILE);
    const stagesSheet = stagesWorkbook.Sheets[stagesWorkbook.SheetNames[0]];
    const stagesData = xlsx.utils.sheet_to_json(stagesSheet);
    
    // 학습맵 데이터 로드
    const learningMapWorkbook = xlsx.readFile(LEARNING_MAP_FILE);
    const learningMapSheet = learningMapWorkbook.Sheets[learningMapWorkbook.SheetNames[0]];
    const learningMapData = xlsx.utils.sheet_to_json(learningMapSheet);
    
    return { stagesData, learningMapData };
  } catch (error) {
    console.error('Excel 파일 로드 중 오류 발생:', error);
    return { stagesData: [], learningMapData: [] };
  }
}

// 스테이지 조회 API
app.get('/api/stage/:stageId', (req, res) => {
  try {
    const stageId = req.params.stageId;
    const { stagesData, learningMapData } = loadExcelData();
    
    // 스테이지 데이터에서 해당 스테이지 찾기
    const stageInfo = stagesData.find(stage => {
      const cleanStage = extractCleanValue(stage['#stage']);
      return cleanStage && cleanStage.toString() === stageId;
    });
    
    if (!stageInfo) {
      return res.status(404).json({ 
        success: false, 
        message: '해당 스테이지를 찾을 수 없습니다.' 
      });
    }
    
    // 학습맵 코드 추출 (쉼표나 줄바꿈으로 구분된 경우 처리)
    const rawLearningMapCodes = extractCleanValue(stageInfo['#learningMapCodes']);
    if (!rawLearningMapCodes) {
      return res.json({
        success: true,
        stage: stageId,
        learningMapCodes: [],
        learningMapDetails: []
      });
    }
    
    // 학습맵 코드를 배열로 변환 (쉼표나 줄바꿈으로 분리)
    const codesArray = rawLearningMapCodes.toString()
      .split(/[,\n]/)
      .map(code => code.trim())
      .filter(code => code.length > 0);
    
    // 각 학습맵 코드에 대한 상세 정보 찾기
    const learningMapDetails = codesArray.map(code => {
      const details = learningMapData.filter(item => {
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
    
    res.json({
      success: true,
      stage: stageId,
      learningMapCodes: codesArray,
      learningMapDetails: learningMapDetails
    });
    
  } catch (error) {
    console.error('스테이지 조회 중 오류 발생:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 모든 스테이지 목록 조회 API
app.get('/api/stages', (req, res) => {
  try {
    const { stagesData } = loadExcelData();
    
    const stages = stagesData
      .filter(stage => stage['#stage'])
      .map(stage => ({
        stage: stage['#stage'],
        learningMapCodes: stage['#learningMapCodes'] || ''
      }));
    
    res.json({
      success: true,
      stages: stages
    });
    
  } catch (error) {
    console.error('스테이지 목록 조회 중 오류 발생:', error);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`스테이지-학습맵 조회 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});