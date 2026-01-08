# 🎭 Art Radar (아트 레이더) - 내 주변 공연 정보 지도 서비스

![Project Status](https://img.shields.io/badge/Project-Active-green)
![License](https://img.shields.io/badge/License-MIT-blue)

> **"지금 내 주변에서 볼 수 있는 공연은 무엇일까?"**
> 공공데이터(KOPIS)와 카카오맵 API를 활용하여, 사용자 위치 기반으로 연극, 뮤지컬 등 공연 정보를 지도 위에서 직관적으로 탐색할 수 있는 서비스입니다.

<br>

## 🛠 Tech Stack (기술 스택)

| 분류 | 기술 | 비고 |
| :--- | :--- | :--- |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | 빠른 빌드 및 SPA 개발 |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white) | REST API 서버 구축 |
| **Database** | ![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white) | 공연 데이터 저장 및 관리 |
| **Infra & DevOps** | ![AWS EC2](https://img.shields.io/badge/AWS%20EC2-FF9900?style=flat&logo=amazonaws&logoColor=white) ![AWS RDS](https://img.shields.io/badge/AWS%20RDS-527FFF?style=flat&logo=amazonrds&logoColor=white) | 클라우드 서버 및 DB 호스팅 |
| **Tools** | ![PM2](https://img.shields.io/badge/PM2-2B037B?style=flat&logo=pm2&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white) | 무중단 배포 및 버전 관리 |

<br>

## 💡 주요 기능 (Key Features)

### 1. 지도 기반 공연장 탐색 (Clustering)
- **카카오맵 API**를 활용하여 지도 위에 공연장 마커를 표시합니다.
- `react-kakao-maps-sdk`의 **Clusterer** 기능을 사용하여, 줌 레벨에 따라 밀집된 마커를 그룹화하여 시인성을 높였습니다.
  <img width="958" height="918" alt="메인화면" src="https://github.com/user-attachments/assets/7a9b3203-6247-4894-853f-b514ad04481f" />


### 2. 카테고리 필터링
- 뮤지컬, 연극, 클래식 등 장르별 필터링 기능을 제공하여 원하는 공연만 빠르게 찾아볼 수 있습니다.
- React의 `useMemo`를 활용하여 필터링 시 불필요한 재연산을 방지했습니다.
  <img width="956" height="918" alt="필터링" src="https://github.com/user-attachments/assets/1f2950ff-0908-4a01-8d63-c715fa52184e" />


### 3. 공연 상세 정보 모달
- 마커 클릭 시 해당 공연의 포스터, 날짜, 장소, 예매 링크를 포함한 상세 정보를 모달창으로 제공합니다.
  <img width="624" height="591" alt="모달" src="https://github.com/user-attachments/assets/f53ac49d-ce4e-4891-b6b9-b2406b1aa142" />


### 4. 실시간 공연 데이터 수집 (Backend)
- **KOPIS(공연예술통합전산망) API**를 주기적으로 호출하여 최신 공연 정보를 수집합니다.
- 수집된 데이터는 AWS RDS(MySQL)에 저장되어 빠르고 안정적으로 조회됩니다.

<br>

## 트러블 슈팅 (Technical Challenges)

### Issue 1: CORS 및 배포 환경에서의 API 경로 문제
- 문제: 로컬 개발 환경에서는 localhost:5000을 호출했으나, 배포 후 브라우저가 사용자 PC의 localhost를 참조하여 CONNECTION_REFUSED 에러 발생.
- 해결:
  1. React 빌드 결과물(dist)을 Node.js 서버의 정적 파일(express.static)로 통합하여 **단일 오리진(Single Origin)**으로 구성.
  2. API 요청 주소를 절대 경로(http://...)가 아닌 상대 경로(/api/events)로 수정하여 배포 환경에 유연하게 대응함.
