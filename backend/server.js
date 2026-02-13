require('dotenv').config();
const express = require('express');
const path = require('path')
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 5000; // React(3000번)와 겹치지 않게 5000 사용

// 1. 미들웨어 설정
app.use(cors()); // 모든 도메인에서 요청 허용 (개발용)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// 2. DB 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

// 3. API 라우트 정의

// [GET] /api/events : 지도에 표시할 공연 정보 가져오기
app.get('/api/events', async (req, res) => {
    try {
        // 좌표가 있는(latitude IS NOT NULL) 데이터만 가져옵니다.
        // (선택사항) 현재 날짜 이후의 공연만 가져오려면 WHERE 조건 추가 가능
        const query = `
            SELECT mt20id, prfnm, fcltynm, poster, genrenm, latitude, longitude, prfpdfrom, prfpdto
            FROM performances 
            WHERE latitude IS NOT NULL
        `;
        
        const [rows] = await pool.query(query);
        
        // 프론트엔드로 응답 전송
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('DB 조회 에러:', error);
        res.status(500).json({ success: false, message: '서버 에러가 발생했습니다.' });
    }
});

// API 외의 모든 요청은 React(index.html)로 보내라
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
})

// 4. 서버 시작
app.listen(5000, () => {
    console.log(`✅ 서버가 실행 중입니다.`);
});