// 학습맵 조회 시스템 - 실제 구현 로직

// 실제 구현에 필요한 스프레드시트 및 폴더 ID 설정
const CONFIG = {
    // API 설정
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // 폴더 및 파일 ID (실제 값으로 교체 필요)
    MAIN_FOLDER_ID: '1YTMj2DjY3VJrXegktJC9y3xVgXv1CMGl',
    LEARNING_MAP_ENG_ID: 'LEARNING_MAP_ENG_SHEET_ID',
    LEARNING_MAP_MAT_ID: 'LEARNING_MAP_MAT_SHEET_ID',
    ACTIVITIES_ENG_FOLDER: 'ACTIVITIES_ENG_FOLDER_ID',
    ACTIVITIES_MAT_FOLDER: 'ACTIVITIES_MAT_FOLDER_ID'
};

// 학습맵 컬럼 매핑
const LEARNING_MAP_COLUMNS = {
    ENG: {
        content3_id: 'A',      // 3단계코드
        content3: 'B',         // 3단계 내용요소
        content4_id: 'C',      // 4단계코드
        content4: 'D',         // 4단계 내용요소
        standards_id: 'E',     // 성취기준코드
        standard_desc: 'F',    // 성취기준
        alphabet: 'G',         // 알파벳
        phonics: 'H',          // 파닉스
        listening: 'I',        // 듣기
        reading: 'J',          // 읽기
        viewing: 'K',          // 보기
        speaking: 'L',         // 말하기
        writing: 'M',          // 쓰기
        presenting: 'N'        // 발표하기
    },
    MAT: {
        enumaId: 'A',          // 에누마 ID
        standards_id: 'B',     // 성취기준 코드
        standard_desc: 'C',    // 성취기준
        cc_1_name: 'D',        // 내용체계 영역
        cc_4_name: 'E',        // 에누마 3단계 내용요소 추가
        gsl_codenames: 'F'     // 학년-학기-단원
    }
};

// 액티비티 시트 컬럼 매핑
const ACTIVITY_COLUMNS = {
    stage: 'A',              // #stage
    learningMapCodes: 'B',   // #learningMapCodes
    relatedCurriculums: 'C'  // #relatedCurriculums
};

/**
 * 실제 스테이지 데이터 찾기 함수
 */
async function findStageDataImplementation(subject, stage) {
    try {
        console.log(`${subject} 과목의 스테이지 ${stage} 조회 시작`);
        
        // 1. 액티비티 폴더에서 교과서 폴더들 가져오기
        const activityFolderId = subject === 'ENG' ? CONFIG.ACTIVITIES_ENG_FOLDER : CONFIG.ACTIVITIES_MAT_FOLDER;
        const textbookFolders = await getFilesInFolder(activityFolderId);
        
        console.log(`교과서 폴더 ${textbookFolders.length}개 발견`);
        
        let allResults = [];
        
        // 2. 각 교과서 폴더의 액티비티 시트들 조회
        for (const textbookFolder of textbookFolders) {
            if (textbookFolder.mimeType === 'application/vnd.google-apps.folder') {
                console.log(`교과서 폴더 조회: ${textbookFolder.name}`);
                
                // 교과서 폴더 내 액티비티 시트들 가져오기
                const activitySheets = await getFilesInFolder(textbookFolder.id);
                
                // 3. 각 액티비티 시트에서 스테이지 검색
                for (const sheet of activitySheets) {
                    if (sheet.mimeType === 'application/vnd.google-apps.spreadsheet') {
                        console.log(`액티비티 시트 조회: ${sheet.name}`);
                        
                        const stageData = await findStageInSheet(sheet.id, stage, textbookFolder.name, sheet.name);
                        if (stageData.length > 0) {
                            allResults.push(...stageData);
                        }
                    }
                }
            }
        }
        
        // 4. 학습맵 코드로 학습맵 정보 조회
        const enrichedResults = await enrichWithLearningMapData(allResults, subject);
        
        console.log(`총 ${enrichedResults.length}개 결과 발견`);
        return enrichedResults;
        
    } catch (error) {
        console.error('스테이지 데이터 조회 중 오류:', error);
        throw error;
    }
}

/**
 * 특정 액티비티 시트에서 스테이지 찾기
 */
async function findStageInSheet(sheetId, targetStage, textbookName, activityName) {
    try {
        // 시트의 모든 데이터 읽기 (첫 100행으로 제한)
        const range = 'A1:C100';
        const data = await readSpreadsheet(sheetId, range);
        
        if (!data || data.length === 0) {
            return [];
        }
        
        const results = [];
        
        // 헤더 행 찾기 (#stage, #learningMapCodes, #relatedCurriculums)
        let headerRow = -1;
        let stageCol = -1, codesCol = -1, curriculumCol = -1;
        
        for (let i = 0; i < Math.min(5, data.length); i++) {
            const row = data[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j] && row[j].toString().toLowerCase().includes('stage')) {
                    headerRow = i;
                    stageCol = j;
                }
                if (row[j] && row[j].toString().toLowerCase().includes('learningmapcodes')) {
                    codesCol = j;
                }
                if (row[j] && row[j].toString().toLowerCase().includes('relatedcurriculums')) {
                    curriculumCol = j;
                }
            }
            if (headerRow >= 0 && stageCol >= 0 && codesCol >= 0 && curriculumCol >= 0) {
                break;
            }
        }
        
        if (headerRow === -1) {
            console.log(`${activityName}: 헤더를 찾을 수 없음`);
            return [];
        }
        
        // 데이터 행에서 스테이지 검색
        for (let i = headerRow + 1; i < data.length; i++) {
            const row = data[i];
            if (row[stageCol] && row[stageCol].toString() === targetStage) {
                const learningMapCodes = row[codesCol] ? row[codesCol].toString().split('\n') : [];
                const relatedCurriculum = row[curriculumCol] ? row[curriculumCol].toString() : '';
                
                results.push({
                    textbookName: textbookName,
                    activityName: activityName,
                    stage: targetStage,
                    learningMapCodes: learningMapCodes,
                    relatedCurriculum: relatedCurriculum
                });
            }
        }
        
        return results;
        
    } catch (error) {
        console.error(`시트 ${sheetId} 조회 중 오류:`, error);
        return [];
    }
}

/**
 * 학습맵 코드로 학습맵 정보 조회하여 결과 보강
 */
async function enrichWithLearningMapData(stageResults, subject) {
    if (stageResults.length === 0) {
        return [];
    }
    
    try {
        // 학습맵 스프레드시트 ID
        const learningMapId = subject === 'ENG' ? CONFIG.LEARNING_MAP_ENG_ID : CONFIG.LEARNING_MAP_MAT_ID;
        
        // 수학의 경우 여러 탭 조회
        let learningMapData = [];
        if (subject === 'MAT') {
            // 수학: 1_2, 3_4, 5_6 탭 모두 조회
            const tabs = ['1_2!A:F', '3_4!A:F', '5_6!A:F'];
            for (const tab of tabs) {
                try {
                    const tabData = await readSpreadsheet(learningMapId, tab);
                    if (tabData && tabData.length > 0) {
                        // 탭 정보 추가
                        const gradeGroup = tab.split('!')[0].replace('_', '-') + '학년군';
                        learningMapData.push(...tabData.map(row => [...row, gradeGroup]));
                    }
                } catch (error) {
                    console.log(`탭 ${tab} 조회 실패 (존재하지 않을 수 있음)`);
                }
            }
        } else {
            // 영어: 단일 시트
            learningMapData = await readSpreadsheet(learningMapId, 'A:N');
        }
        
        // 헤더 행 찾기
        const headers = learningMapData[0];
        const learningMapIndex = buildLearningMapIndex(learningMapData, subject);
        
        // 각 스테이지 결과를 학습맵 정보로 보강
        const enrichedResults = [];
        
        for (const stageResult of stageResults) {
            for (const code of stageResult.learningMapCodes) {
                const learningMapInfo = learningMapIndex[code.trim()];
                if (learningMapInfo) {
                    enrichedResults.push({
                        ...stageResult,
                        learningMapCode: code.trim(),
                        ...learningMapInfo
                    });
                } else {
                    // 학습맵에서 코드를 찾지 못한 경우에도 기본 정보는 포함
                    enrichedResults.push({
                        ...stageResult,
                        learningMapCode: code.trim(),
                        contentElement: '정보 없음',
                        standardCode: '정보 없음',
                        standardDesc: '정보 없음'
                    });
                }
            }
        }
        
        return enrichedResults;
        
    } catch (error) {
        console.error('학습맵 데이터 조회 중 오류:', error);
        // 오류가 발생해도 기본 정보는 반환
        return stageResults.map(result => ({
            ...result,
            learningMapCode: result.learningMapCodes.join(', '),
            contentElement: '조회 실패',
            standardCode: '조회 실패',
            standardDesc: '조회 실패'
        }));
    }
}

/**
 * 학습맵 데이터를 인덱스로 구성
 */
function buildLearningMapIndex(learningMapData, subject) {
    const index = {};
    
    if (learningMapData.length === 0) {
        return index;
    }
    
    // 헤더 행 스키ップ
    for (let i = 1; i < learningMapData.length; i++) {
        const row = learningMapData[i];
        
        if (subject === 'ENG') {
            // 영어: content3_id 또는 content4_id로 인덱싱
            const content3Id = row[0]; // A열: content3_id
            const content4Id = row[2]; // C열: content4_id
            
            const learningMapInfo = {
                content3: row[1],          // B열: content3
                content4: row[3],          // D열: content4
                contentElement: row[1] || row[3], // 3단계 또는 4단계 내용요소
                standardCode: row[4],      // E열: standards_id
                standardDesc: row[5],      // F열: standard_desc
                skills: {
                    alphabet: row[6] === 'TRUE' || row[6] === true,
                    phonics: row[7] === 'TRUE' || row[7] === true,
                    listening: row[8] === 'TRUE' || row[8] === true,
                    reading: row[9] === 'TRUE' || row[9] === true,
                    viewing: row[10] === 'TRUE' || row[10] === true,
                    speaking: row[11] === 'TRUE' || row[11] === true,
                    writing: row[12] === 'TRUE' || row[12] === true,
                    presenting: row[13] === 'TRUE' || row[13] === true
                }
            };
            
            if (content3Id) index[content3Id] = learningMapInfo;
            if (content4Id) index[content4Id] = learningMapInfo;
            
        } else {
            // 수학: 에누마 ID로 인덱싱
            const enumaId = row[0]; // A열: 에누마 ID
            
            if (enumaId) {
                index[enumaId] = {
                    enumaId: enumaId,
                    standardCode: row[1],     // B열: standards_id
                    standardDesc: row[2],     // C열: standard_desc
                    contentArea: row[3],      // D열: cc_1_name (내용체계 영역)
                    contentElement: row[4],   // E열: cc_4_name (3단계 내용요소)
                    gradeUnit: row[5],        // F열: gsl_codenames (학년-학기-단원)
                    gradeGroup: row[6] || '정보 없음' // 탭에서 추가된 학년군 정보
                };
            }
        }
    }
    
    return index;
}

/**
 * 결과 데이터를 UI 표시용으로 변환
 */
function formatResultsForDisplay(results, subject) {
    // 교과서별로 그룹화
    const groupedByTextbook = {};
    
    results.forEach(result => {
        const key = `${result.textbookName}(${result.relatedCurriculum})`;
        if (!groupedByTextbook[key]) {
            groupedByTextbook[key] = [];
        }
        groupedByTextbook[key].push(result);
    });
    
    // 최종 표시용 데이터 구성
    const displayResults = [];
    
    Object.keys(groupedByTextbook).forEach(textbookKey => {
        const textbookResults = groupedByTextbook[textbookKey];
        const firstResult = textbookResults[0];
        
        // 모든 학습맵 코드와 관련 정보 수집
        const allCodes = textbookResults.map(r => r.learningMapCode).filter(c => c);
        const uniqueCodes = [...new Set(allCodes)];
        
        if (subject === 'ENG') {
            // 영어: 모든 true인 스킬 수집
            const allSkills = [];
            textbookResults.forEach(result => {
                if (result.skills) {
                    Object.keys(result.skills).forEach(skill => {
                        if (result.skills[skill] && !allSkills.includes(skill)) {
                            allSkills.push(skill);
                        }
                    });
                }
            });
            
            displayResults.push({
                activity: firstResult.activityName,
                textbooks: [textbookKey],
                learningMapCode: uniqueCodes.join(', '),
                contentElement: textbookResults.map(r => r.contentElement).filter(c => c).join(', '),
                standardCode: textbookResults.map(r => r.standardCode).filter(c => c).join(', '),
                standardDesc: textbookResults.map(r => r.standardDesc).filter(c => c).join(', '),
                skills: allSkills
            });
            
        } else {
            // 수학: 학년군, 내용체계 영역 등 정보 수집
            const gradeGroups = [...new Set(textbookResults.map(r => r.gradeGroup).filter(g => g))];
            const contentAreas = [...new Set(textbookResults.map(r => r.contentArea).filter(c => c))];
            const gradeUnits = [...new Set(textbookResults.map(r => r.gradeUnit).filter(g => g))];
            
            displayResults.push({
                activity: firstResult.activityName,
                textbooks: [textbookKey],
                learningMapCode: uniqueCodes.join(', '),
                gradeGroup: gradeGroups.join(', '),
                contentArea: contentAreas.join(', '),
                contentElement: textbookResults.map(r => r.contentElement).filter(c => c).join(', '),
                standardCode: textbookResults.map(r => r.standardCode).filter(c => c).join(', '),
                standardDesc: textbookResults.map(r => r.standardDesc).filter(c => c).join(', '),
                gradeUnit: gradeUnits.join(', ')
            });
        }
    });
    
    return displayResults;
}

// 기존 findStageData 함수를 실제 구현으로 교체
async function findStageData(subject, stage) {
    const results = await findStageDataImplementation(subject, stage);
    return formatResultsForDisplay(results, subject);
}