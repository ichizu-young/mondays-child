const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// 업로드 및 출력 디렉토리 생성
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 정적 파일 제공
app.use(express.static('public'));
app.use('/output', express.static(outputDir));

// 이미지 업로드 및 리사이즈 API
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일을 업로드해주세요.' });
    }

    const width = parseInt(req.body.width);
    const height = parseInt(req.body.height);

    if (!width || !height || width <= 0 || height <= 0) {
      return res.status(400).json({ error: '유효한 너비와 높이를 입력해주세요.' });
    }

    const inputPath = req.file.path;
    const outputFilename = `resized-${width}x${height}-${req.file.filename}`;
    const outputPath = path.join(outputDir, outputFilename);

    // Sharp를 사용하여 이미지 리사이즈
    await sharp(inputPath)
      .resize(width, height)
      .toFile(outputPath);

    // 원본 파일 삭제
    fs.unlinkSync(inputPath);

    res.json({
      success: true,
      message: '이미지가 성공적으로 리사이즈되었습니다.',
      originalSize: `${req.file.size} bytes`,
      resizedSize: `${width}x${height}`,
      downloadUrl: `/output/${outputFilename}`
    });

  } catch (error) {
    console.error('이미지 처리 중 오류 발생:', error);
    res.status(500).json({ error: '이미지 처리 중 오류가 발생했습니다.' });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`이미지 리사이저 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});