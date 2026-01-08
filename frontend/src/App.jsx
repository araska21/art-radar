import { useEffect, useMemo, useState } from 'react';
import { Map, MapMarker, MarkerClusterer, useKakaoLoader } from 'react-kakao-maps-sdk';
import axios from 'axios';
import './App.css';

// 카테고리 목록 정의
const CATEGORIES = ["전체", "뮤지컬", "연극", "대중음악", "클래식", "국악", "무용"];

function App() {
  // 카카오맵 동적 로딩 설정
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_APP_KEY,
    libraries: ["clusterer", "services"],
  })

  // 지도 중심 좌표 (기본값: 서울 시청)
  const [center, setCenter] = useState({lat: 37.5665, lng: 126.9780})
  // 내 현재 위치
  const [myLoc, setMyLoc] = useState(null);

  // 공연 데이터 저장할 state
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("전체"); 
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태

  // 1. 공연 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 백엔드 주소 
        const res = await axios.get('/api/events');
        if (res.data.success) {
          setEvents(res.data.data);
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
    };
    fetchData();
  }, []);
  
  // 2. 필터링 함수
  const filteredEvents = useMemo(() => {
    if (selectedCategory === "전체") {
      return events;
    }
    // API 데이터의 'genrenm'과 버튼의 이름이 일치하는지 확인
    return events.filter(event => event.genrenm === selectedCategory);
  }, [events, selectedCategory]);

  // 3. 내 위치 찾기 함수
  const moveToMyLocation = () => {
    // 브라우저가 GPS를 지원하는지 확인
    if (!navigator.geolocation) {
      alert("위치 정보를 사용할 수 없습니다.");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 지도 중심 이동 & 내 위치 마커 설정
        setCenter({lat, lng});
        setMyLoc({lat,lng});
        setIsLoading(false);
      },
      (err) => {
        alert("위치 정보를 가져올 수 없습니다. 위치 권한을 허용해 주세요.");
        setIsLoading(false);
      }
    );
  };


  return (
    <div className='map-container'>
      {/* 4. 상단 : 내 위치 찾기 버튼 (지도 위에 둥둥 떠 있음) */}
      <button
        onClick={moveToMyLocation}
        className='my-loc-btn'
      >
        {isLoading ? "위치 찾는 중..." : "내 주변 공연 찾기"}
      </button>

      {/* 5. 하단 : 장르 필터링 (가로 스크롤 가능) */}
      <div className='category-container'>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* 6. 지도 */}
      <Map
        center={center} 
        isPanto={true} // 부드럽게 지도 이동
        style={{ width: "100%", height: "100%" }}
        level={8} // 확대 레벨 (숫자가 작을수록 확대됨)
      >
        {/* 내 위치 표시 (빨간 마커) */}
        {myLoc && (
          <MapMarker
            position={myLoc}
            image={{
              src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png", // 빨간 마커 이미지
              size: {width: 35, height:40},
            }}
          />
        )}

        {/* 마커가 겹치면 숫자로 묶어주는 기능 (클러스터링) */}
        <MarkerClusterer 
          averageCenter={true} // 클러스터의 중심을 마커들의 평균 좌표로 설정
          minLevel={5} // 클러스터링 할 최소 지도 레벨
        >
          {filteredEvents.map((event) => (
            <MapMarker
              key={event.mt20id}
              position={{
                lat: parseFloat(event.latitude),
                lng: parseFloat(event.longitude)
              }}
              onClick={() => setSelectedEvent(event)} // 클릭시 state에 저장
            />
          ))}
        </MarkerClusterer>
      </Map>

      {/* 7. 상세 정보 모달 (selectedEvent가 있을 때만 표시) */}
      {selectedEvent && (
        <div className='modal-overlay' onClick={() => setSelectedEvent(null)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <button className='modal-close' onClick={() => setSelectedEvent(null)}></button>
          
          <div className='modal-img-box'>
            <img
              src={selectedEvent.poster}
              alt={selectedEvent.prfnm}
              className='modal-img'
              onError={(e) => {e.target.src = 'https://via.placeholder.com/150?text=No+Image';}} // 이미지 깨짐 방지
            />
          </div>
          
          <div className='modal-info'>
            <h2 className='modal-title'>{selectedEvent.prfnm}</h2>
            <span className='modal-badge'><strong>장르:</strong>{selectedEvent.genrenm}</span>
            <p className='modal-text'><strong>장소:</strong>{selectedEvent.fcltynm}</p>
            <p className='modal-text'><strong>기간:</strong>{selectedEvent.prfpdfrom} ~ {selectedEvent.prfpdto}</p>
            
            <a 
              href={`https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?menuID=MNU_00020&mt20Id=${selectedEvent.mt20id}`}
              target='_blank'
              rel='noreferrer'
              className='modal-link'
            >
              예매/상세정보 보러가기
            </a>  
          </div>
        </div>
      </div>
      )}  
    </div>
  );
}


export default App;