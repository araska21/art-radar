require('dotenv').config();
const axios = require('axios');
const mysql = require('mysql2/promise');
const { parseStringPromise } = require('xml2js');

// 딜레이 함수 (API 호출 제한 방지용, 0.5초 대기)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateCoordinates = async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        const connection = await pool.getConnection();

        // 1. 좌표가 없는 공연 목록 조회
        const [rows] = await connection.execute(
            'SELECT mt20id, prfnm FROM performances WHERE latitude IS NULL'
        );

        console.log(`🚀 총 ${rows.length}개의 공연에 좌표가 없습니다. 업데이트를 시작합니다...`);

        // 시설 좌표 캐싱 (같은 공연장 중복 호출 방지)
        // 예: { 'FC0001': { lat: 37.5, lng: 127.0 } }
        const facilityCache = {}; 

        for (const [index, row] of rows.entries()) {
            const mt20id = row.mt20id;
            console.log(`[${index + 1}/${rows.length}] 처리 중: ${row.prfnm} (${mt20id})`);

            try {
                // --- Step A: 공연 상세 정보 조회 (시설 ID 얻기) ---
                const detailUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr/${mt20id}`;
                const detailRes = await axios.get(detailUrl, {
                    params: { service: process.env.KOPIS_API_KEY }
                });
                
                const detailData = await parseStringPromise(detailRes.data);
                
                // 데이터 안전 접근 (가끔 데이터가 없는 경우 방지)
                const dbObj = detailData?.dbs?.db?.[0];
                if (!dbObj) {
                    console.log('   Pass: 상세 정보 없음');
                    continue;
                }

                const mt10id = dbObj.mt10id[0]; // 시설 ID 추출

                // --- Step B: 시설 상세 정보 조회 (위도/경도 얻기) ---
                let lat = null;
                let lng = null;

                // 캐시에 있는지 확인 (API 호출 아끼기)
                if (facilityCache[mt10id]) {
                    lat = facilityCache[mt10id].lat;
                    lng = facilityCache[mt10id].lng;
                    console.log('   (Cache Hit) 이미 조회한 공연장입니다.');
                } else {
                    // API 호출
                    const facilityUrl = `http://www.kopis.or.kr/openApi/restful/prfplc/${mt10id}`;
                    const facilityRes = await axios.get(facilityUrl, {
                        params: { service: process.env.KOPIS_API_KEY }
                    });
                    const facilityData = await parseStringPromise(facilityRes.data);
                    
                    const fcltyObj = facilityData?.dbs?.db?.[0];
                    if (fcltyObj) {
                        lat = fcltyObj.la[0]; // 위도
                        lng = fcltyObj.lo[0]; // 경도
                        
                        // 캐시에 저장
                        facilityCache[mt10id] = { lat, lng };
                        await delay(100); // API 과부하 방지 딜레이
                    }
                }

                // --- Step C: DB 업데이트 ---
                if (lat && lng) {
                    await connection.execute(
                        'UPDATE performances SET mt10id = ?, latitude = ?, longitude = ? WHERE mt20id = ?',
                        [mt10id, lat, lng, mt20id]
                    );
                    console.log(`   ✅ 업데이트 완료! (lat: ${lat}, lng: ${lng})`);
                } else {
                    console.log('   ❌ 좌표 정보를 찾을 수 없습니다.');
                }

            } catch (err) {
                console.error(`   에러 발생 (${mt20id}):`, err.message);
            }
        }

        console.log('🎉 모든 작업이 완료되었습니다.');
        connection.release();

    } catch (error) {
        console.error('치명적 에러:', error);
    } finally {
        await pool.end();
    }
};

updateCoordinates();