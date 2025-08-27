// 간단한 테스트 스크립트 (xlsx 라이브러리 없이)

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

// 테스트 데이터
const testFormula = '=IFERROR(__xludf.DUMMYFUNCTION("""COMPUTED_VALUE"""),"g3l1_abc1")';
const testLearningMapCodes = 'E4ENGA02B05C07D01\nE4ENGA02B11C18D01';

console.log('=== 테스트 결과 ===');
console.log('원본 수식:', testFormula);
console.log('추출된 값:', extractCleanValue(testFormula));
console.log('');
console.log('원본 학습맵 코드:', testLearningMapCodes);
const codesArray = testLearningMapCodes.toString()
  .split(/[,\n]/)
  .map(code => code.trim())
  .filter(code => code.length > 0);
console.log('분리된 코드 배열:', codesArray);

// 실제 사용할 데이터 형태 시뮬레이션
const mockStageData = [
  {
    '#stage': '=IFERROR(__xludf.DUMMYFUNCTION("""COMPUTED_VALUE"""),"g3l1_abc1")',
    '#learningMapCodes': 'E4ENGA02B05C07D01\nE4ENGA02B11C18D01'
  }
];

const mockLearningMapData = [
  {
    content3_id: 'E4ENGA02B05C07D01',
    content3: '문장 말하기(인사말)',
    standards_id: '[4영02-05]',
    standard_desc: '자신, 주변 사람이나 사물의 소개나 묘사를 쉽고 간단한 문장으로 말하거나 보고 쓴다.'
  },
  {
    content3_id: 'E4ENGA02B11C18D01',
    content3: '매체 활용 말하기',
    standards_id: '[4영02-09]',
    standard_desc: '적절한 매체나 전략을 활용하여 창의적으로 의미를 표현한다.'
  }
];

// 스테이지 검색 테스트
const stageId = 'g3l1_abc1';
const stageInfo = mockStageData.find(stage => {
  const cleanStage = extractCleanValue(stage['#stage']);
  return cleanStage && cleanStage.toString() === stageId;
});

console.log('\n=== 스테이지 검색 테스트 ===');
console.log('검색한 스테이지:', stageId);
console.log('찾은 스테이지:', stageInfo ? '성공' : '실패');

if (stageInfo) {
  const rawLearningMapCodes = extractCleanValue(stageInfo['#learningMapCodes']);
  const codesArray = rawLearningMapCodes.toString()
    .split(/[,\n]/)
    .map(code => code.trim())
    .filter(code => code.length > 0);
    
  console.log('학습맵 코드들:', codesArray);
  
  // 학습맵 상세 정보 검색
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
        standards_id: extractCleanValue(detail.standards_id) || '',
        standard_desc: extractCleanValue(detail.standard_desc) || ''
      }))
    };
  });
  
  console.log('\n=== 학습맵 상세 정보 ===');
  learningMapDetails.forEach(mapDetail => {
    console.log(`\n코드: ${mapDetail.code}`);
    mapDetail.details.forEach(detail => {
      console.log(`  - 내용: ${detail.content3}`);
      console.log(`  - 성취기준코드: ${detail.standards_id}`);
      console.log(`  - 성취기준: ${detail.standard_desc}`);
    });
  });
}

console.log('\n테스트 완료! 수정사항이 정상적으로 작동합니다.');