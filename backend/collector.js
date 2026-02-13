require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');
const { parseStringPromise } = require('xml2js');

// 1. 날짜 구하기 (오늘 ~ 한달 뒤)
const getDates = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    const formatDate = (date) => {
        return date.toISOString().slice(0, 10).replace(/-/g, '');
    };

    return { stdate: formatDate(today), eddate: formatDate(nextMonth) };
};

// 2. 메인 로직
const fetchAndSaveData = async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port : process.env.DB_PORT
    });

    try {
        console.log("🚀 데이터 수집 시작...");
        const { stdate, eddate } = getDates();
        
        // KOPIS API 호출 (공연 목록)
        const url = `http://www.kopis.or.kr/openApi/restful/pblprfr`;
        const response = await axios.get(url, {
            params: {
                service: process.env.KOPIS_API_KEY,
                stdate: stdate,
                eddate: eddate,
                cpage: 1,
                rows: 100, // 한번에 가져올 개수
                prfstate: '02', // 02: 공연중 (필요시 '01': 공연예정 추가)
            }
        });

        // XML -> JSON 변환
        const result = await parseStringPromise(response.data);
        const performList = result.dbs.db; // 배열 형태의 데이터

        if (!performList) {
            console.log("❌ 가져올 데이터가 없습니다.");
            return;
        }

        console.log(`📦 총 ${performList.length}개의 공연 정보를 가져왔습니다. DB 저장 중...`);

        // DB 저장 (Upsert: 있으면 업데이트, 없으면 삽입)
        const query = `
            INSERT INTO performances (mt20id, prfnm, prfpdfrom, prfpdto, fcltynm, poster, genrenm, openrun, area)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            prfnm = VALUES(prfnm), prfpdfrom = VALUES(prfpdfrom), prfpdto = VALUES(prfpdto),
            poster = VALUES(poster), updated_at = NOW();
        `;

        const connection = await pool.getConnection();
        
        for (const item of performList) {
            // 데이터 포맷팅 (배열로 들어오는 경우가 있어 [0] 처리)
            const params = [
                item.mt20id[0],
                item.prfnm[0],
                item.prfpdfrom[0],
                item.prfpdto[0],
                item.fcltynm[0],
                item.poster[0],
                item.genrenm[0],
                item.openrun[0],
                item.area ? item.area[0] : ''
            ];
            await connection.execute(query, params);
        }

        connection.release();
        console.log("✅ 데이터 저장 완료!");

    } catch (error) {
        console.error("에러 발생:", error);
    } finally {
        await pool.end();
    }
};

fetchAndSaveData();