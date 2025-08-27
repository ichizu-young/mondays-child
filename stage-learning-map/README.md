# 스테이지-학습맵 조회 시스템

액티비티의 스테이지 정보를 입력하여 연결된 학습맵 코드와 상세 정보를 조회할 수 있는 웹 애플리케이션입니다.

## 기능

- 액티비티 스테이지 번호 입력 및 조회
- 스테이지와 연결된 학습맵 코드 확인
- 학습맵 코드별 상세 정보 표시:
  - 3단계/4단계 내용 요소
  - 성취 기준 코드
  - 성취 기준 설명

## 데이터 소스

- **스테이지 데이터**: `/Users/hwanghyeyoung/aiprojects/data/aichatprac1_stages_1.xlsx`
  - `#stage` 컬럼: 액티비티 스테이지 번호
  - `#learningMapCodes` 컬럼: 연결된 학습맵 코드 (쉼표로 구분)

- **학습맵 데이터**: `/Users/hwanghyeyoung/aiprojects/data/Develop_Learning_Map_Code_ENG.xlsx`
  - `content3_id`, `content4_id`: 학습맵 코드 ID
  - `content3`, `content4`: 내용 요소
  - `standards_id`: 성취 기준 코드
  - `standard_desc`: 성취 기준 설명

## 설치 및 실행

1. 의존성 설치:
```bash
# npm 캐시 권한 문제가 있는 경우 먼저 실행:
sudo chown -R $(whoami) ~/.npm

# 의존성 설치
npm install
```

2. 서버 실행:
```bash
npm start
```

3. 브라우저에서 `http://localhost:3001` 접속

## 사용 방법

1. 웹 인터페이스에서 액티비티 스테이지 번호 입력
2. "조회" 버튼 클릭
3. 연결된 학습맵 코드와 상세 정보 확인

## API 엔드포인트

- `GET /api/stage/:stageId`: 특정 스테이지의 학습맵 정보 조회
- `GET /api/stages`: 모든 스테이지 목록 조회

## 기술 스택

- **Backend**: Node.js, Express.js
- **Excel Processing**: xlsx
- **Frontend**: HTML, CSS, JavaScript

## 프로젝트 구조

```
stage-learning-map/
├── app.js          # 서버 메인 파일
├── package.json    # 의존성 설정
├── public/
│   └── index.html  # 웹 인터페이스
└── README.md       # 프로젝트 문서
```

## 개발 모드

```bash
npm run dev
```

nodemon을 사용하여 파일 변경 시 자동 재시작됩니다.