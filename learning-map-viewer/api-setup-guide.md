# Google Drive API 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: `learning-map-viewer` (원하는 이름으로 설정)

### 1.2 API 활성화
1. 왼쪽 메뉴에서 "API 및 서비스" > "라이브러리" 선택
2. 다음 API들을 검색하여 활성화:
   - **Google Drive API**
   - **Google Sheets API**

### 1.3 API 키 생성
1. "API 및 서비스" > "사용자 인증 정보" 선택
2. "+ 사용자 인증 정보 만들기" > "API 키" 선택
3. 생성된 API 키 복사
4. API 키 제한 설정 (보안을 위해 권장):
   - "API 키 제한" 클릭
   - "HTTP 리퍼러(웹사이트)" 선택
   - 허용할 도메인 추가 (예: `localhost`, `file://`)

## 2. 스프레드시트 ID 찾기

### 2.1 학습맵 스프레드시트 ID 추출
각 스프레드시트의 URL에서 ID를 추출해야 합니다:

**URL 형식:** `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`

1. **Learning_Map_Code_ENG** 스프레드시트 열기
2. URL에서 `/d/` 다음부터 `/edit` 이전까지의 문자열이 ID
3. **Learning_Map_Code_MAT** 스프레드시트도 동일하게 ID 추출

### 2.2 액티비티 폴더 탐색
각 액티비티 폴더 내의 교과서 폴더와 시트들의 ID도 필요합니다:
- Activities_ENG 폴더 ID
- Activities_MAT 폴더 ID
- 각 교과서 폴더 ID
- 각 액티비티 시트 ID

## 3. HTML 파일 수정

### 3.1 API 키 설정
`learning-map-viewer.html` 파일에서 다음 부분을 수정:

```javascript
const API_KEY = 'YOUR_API_KEY_HERE'; // 생성한 API 키로 교체
```

### 3.2 스프레드시트 ID 설정
```javascript
const LEARNING_MAP_ENG_ID = 'ENGLISH_LEARNING_MAP_SHEET_ID'; // Learning_Map_Code_ENG의 ID
const LEARNING_MAP_MAT_ID = 'MATH_LEARNING_MAP_SHEET_ID';   // Learning_Map_Code_MAT의 ID
```

## 4. 폴더 구조 매핑

실제 구현을 위해 다음 정보가 필요합니다:

### 4.1 필요한 ID 목록
```javascript
const FOLDER_STRUCTURE = {
    // 메인 폴더
    learning_map_activity: '1YTMj2DjY3VJrXegktJC9y3xVgXv1CMGl',
    
    // 학습맵 문서
    learning_map_eng: 'LEARNING_MAP_ENG_SHEET_ID',
    learning_map_mat: 'LEARNING_MAP_MAT_SHEET_ID',
    
    // 액티비티 폴더
    activities_eng: 'ACTIVITIES_ENG_FOLDER_ID',
    activities_mat: 'ACTIVITIES_MAT_FOLDER_ID',
    
    // 교과서 폴더 (예시)
    textbooks_eng: {
        'textbook1': 'TEXTBOOK1_ENG_FOLDER_ID',
        'textbook2': 'TEXTBOOK2_ENG_FOLDER_ID'
    },
    textbooks_mat: {
        'textbook1': 'TEXTBOOK1_MAT_FOLDER_ID',
        'textbook2': 'TEXTBOOK2_MAT_FOLDER_ID'
    }
};
```

### 4.2 폴더 ID 찾는 방법
1. 구글 드라이브에서 폴더 우클릭 > "링크 가져오기"
2. URL에서 `/folders/` 다음의 문자열이 폴더 ID
3. 예: `https://drive.google.com/drive/folders/1YTMj2DjY3VJrXegktJC9y3xVgXv1CMGl`
   - 폴더 ID: `1YTMj2DjY3VJrXegktJC9y3xVgXv1CMGl`

## 5. 스프레드시트 공유 설정

### 5.1 모든 관련 파일 공유 설정
1. 각 스프레드시트와 폴더를 "링크가 있는 모든 사용자" 권한으로 설정
2. 권한: "뷰어" 또는 "편집자" (읽기만 필요하므로 뷰어로 충분)

### 5.2 확인 사항
- learning_map_activity 폴더
- Learning_Map_Code_ENG 스프레드시트
- Learning_Map_Code_MAT 스프레드시트
- Activities_ENG 폴더 및 하위 모든 폴더/파일
- Activities_MAT 폴더 및 하위 모든 폴더/파일

## 6. 테스트 방법

### 6.1 API 연결 테스트
1. HTML 파일을 브라우저에서 열기
2. 개발자 도구(F12) > Console 탭 확인
3. "Google API 초기화 완료" 메시지 확인

### 6.2 기능 테스트
1. 과목 선택 (영어/수학)
2. 임의의 스테이지 값 입력
3. 조회 버튼 클릭
4. 오류 메시지 확인 (현재는 예시 데이터 표시)

## 7. 다음 단계

현재 HTML 파일은 기본 구조만 구현되어 있습니다. 실제 작동을 위해서는:

1. 모든 ID 값 설정
2. 실제 데이터 조회 로직 구현
3. 스프레드시트 구조에 맞는 데이터 파싱 로직 추가

## 8. 보안 주의사항

- API 키는 클라이언트 사이드에 노출됩니다
- 개인 사용 목적이므로 문제없지만, 공개 배포 시 서버 사이드 구현 권장
- API 키에 적절한 제한 설정 필수

## 9. 문제 해결

### 9.1 일반적인 오류
- **403 오류**: API 키 설정 또는 권한 문제
- **404 오류**: 스프레드시트/폴더 ID 오류 또는 공유 설정 문제
- **CORS 오류**: 로컬 파일 실행 시 발생할 수 있음 (로컬 서버 사용 권장)

### 9.2 로컬 서버 실행 방법
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server 설치 필요)
npx http-server

# 브라우저에서 http://localhost:8000 접속
```