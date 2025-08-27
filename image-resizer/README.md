# 이미지 리사이저

이미지 파일을 업로드하고 원하는 해상도로 리사이즈하는 웹 애플리케이션입니다.

## 기능

- 이미지 파일 업로드 (jpg, png, gif 등)
- 사용자 지정 해상도로 리사이즈
- 리사이즈된 이미지 다운로드
- 직관적인 웹 인터페이스

## 설치 방법

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

3. 브라우저에서 `http://localhost:3000` 접속

## 사용 방법

1. 웹 인터페이스에서 이미지 파일 선택
2. 원하는 너비와 높이 입력 (px 단위)
3. "이미지 리사이즈하기" 버튼 클릭
4. 처리 완료 후 다운로드 링크 클릭

## 기술 스택

- **Backend**: Node.js, Express.js
- **Image Processing**: Sharp
- **File Upload**: Multer
- **Frontend**: HTML, CSS, JavaScript

## 주요 파일 구조

```
image-resizer/
├── app.js          # 서버 메인 파일
├── package.json    # 의존성 설정
├── public/
│   └── index.html  # 웹 인터페이스
├── uploads/        # 업로드된 파일 임시 저장소
└── output/         # 리사이즈된 이미지 저장소
```

## API 엔드포인트

- `POST /upload`: 이미지 업로드 및 리사이즈
  - 파라미터: `image` (파일), `width` (너비), `height` (높이)
  - 응답: 성공 시 다운로드 URL 반환

## 개발 모드

```bash
npm run dev
```

nodemon을 사용하여 파일 변경 시 자동 재시작됩니다.