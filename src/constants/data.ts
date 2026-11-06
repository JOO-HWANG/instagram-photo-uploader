import { RoomOption, ProductOption, SuburbEntry } from '../types';

export const DEFAULT_N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/upload-post';

export const POSTCODE_DATABASE: SuburbEntry[] = [
  { postcode: '2154', suburb: 'CastleHill', display: '2154 - Castle Hill', lat: -33.7311, lng: 151.0042 },
  { postcode: '2153', suburb: 'BaulkhamHills', display: '2153 - Baulkham Hills / Bella Vista / Norwest', lat: -33.7600, lng: 150.9900 },
  { postcode: '2155', suburb: 'Kellyville', display: '2155 - Kellyville / Rouse Hill / Beaumont Hills', lat: -33.7080, lng: 150.9570 },
  { postcode: '2156', suburb: 'Glenhaven', display: '2156 - Glenhaven / Annangrove / Kenthurst', lat: -33.7050, lng: 151.0250 },
  { postcode: '2158', suburb: 'Dural', display: '2158 - Dural / Middle Dural', lat: -33.6820, lng: 151.0370 },
  { postcode: '2125', suburb: 'WestPennantHills', display: '2125 - West Pennant Hills', lat: -33.7510, lng: 151.0340 },
  { postcode: '2120', suburb: 'PennantHills', display: '2120 - Pennant Hills / Thornleigh', lat: -33.7400, lng: 151.0660 },
  { postcode: '2126', suburb: 'Cherrybrook', display: '2126 - Cherrybrook', lat: -33.7220, lng: 151.0480 },
  { postcode: '2118', suburb: 'Carlingford', display: '2118 - Carlingford', lat: -33.7740, lng: 151.0500 },
  { postcode: '2151', suburb: 'NorthParramatta', display: '2151 - North Parramatta / North Rocks', lat: -33.7970, lng: 151.0070 },
  { postcode: '2769', suburb: 'ThePonds', display: '2769 - The Ponds', lat: -33.6980, lng: 150.9060 },
  { postcode: '2152', suburb: 'Northmead', display: '2152 - Northmead', lat: -33.7920, lng: 150.9930 },
  { postcode: '2145', suburb: 'Wentworthville', display: '2145 - Wentworthville / Westmead', lat: -33.8070, lng: 150.9720 },
  { postcode: '2768', suburb: 'StanhopeGardens', display: '2768 - Stanhope Gardens / Glenwood', lat: -33.7210, lng: 150.9160 },
  { postcode: '2763', suburb: 'QuakersHill', display: '2763 - Quakers Hill / Acacia Gardens', lat: -33.7370, lng: 150.8780 },
  { postcode: '2148', suburb: 'Blacktown', display: '2148 - Blacktown', lat: -33.7710, lng: 150.9060 },
  { postcode: '2121', suburb: 'Epping', display: '2121 - Epping', lat: -33.7730, lng: 151.0820 },
  { postcode: '2122', suburb: 'Eastwood', display: '2122 - Eastwood / Marsfield', lat: -33.7900, lng: 151.0820 },
  { postcode: '2077', suburb: 'Hornsby', display: '2077 - Hornsby / Waitara', lat: -33.7030, lng: 151.1000 },
  { postcode: '2113', suburb: 'MacquariePark', display: '2113 - Macquarie Park / North Ryde', lat: -33.7780, lng: 151.1250 },
];

/**
 * Finds the nearest suburb in our database for given latitude and longitude.
 */
export function findNearestSuburb(lat: number, lng: number): SuburbEntry | null {
  let nearest: SuburbEntry | null = null;
  let minDistance = Infinity;

  for (const entry of POSTCODE_DATABASE) {
    if (entry.lat !== undefined && entry.lng !== undefined) {
      const dLat = entry.lat - lat;
      const dLng = entry.lng - lng;
      const distSq = dLat * dLat + dLng * dLng;
      if (distSq < minDistance) {
        minDistance = distSq;
        nearest = entry;
      }
    }
  }

  // If distance is reasonably within Greater Sydney (~0.3 deg ~= 33km)
  if (minDistance < 0.25) {
    return nearest;
  }
  return nearest;
}

export const ROOM_OPTIONS: RoomOption[] = [
  { code: 'L', name: 'Living Room', nameKo: '거실' },
  { code: 'MB', name: 'Main Bed Room', nameKo: '안방 / 마스터 베드룸' },
  { code: 'B', name: 'Bed Room', nameKo: '침실 / 게스트룸' },
  { code: 'K', name: 'Kitchen', nameKo: '주방' },
  { code: 'D', name: 'Dining', nameKo: '다이닝 / 식당' },
  { code: 'ENT', name: 'Entrance', nameKo: '현관 / 입구' },
  { code: 'COR', name: 'Corridor', nameKo: '복도' },
  { code: 'LAUN', name: 'Laundry', nameKo: '세탁실' },
  { code: 'T', name: 'Toilet / Bathroom', nameKo: '욕실 / 화장실' },
  { code: 'STU', name: 'Study / Office', nameKo: '서재 / 홈오피스' },
  { code: 'BAL', name: 'Balcony / Alfresco', nameKo: '발코니 / 야외' },
  { code: 'MEDIA', name: 'Media Room', nameKo: '미디어 / 영화방' },
];

export const WINDOW_SEQ_OPTIONS = [
  { value: '', label: '단일 창문 (기본)', desc: '단독 창' },
  { value: '1', label: '1번 창문', desc: '시계방향 1' },
  { value: '2', label: '2번 창문', desc: '시계방향 2' },
  { value: '3', label: '3번 창문', desc: '시계방향 3' },
  { value: '4', label: '4번 창문', desc: '시계방향 4' },
  { value: '5', label: '5번 창문', desc: '시계방향 5' },
  { value: '6', label: '6번 창문', desc: '시계방향 6' },
];

export const PRODUCT_OPTIONS: ProductOption[] = [
  { code: 'rbs', name: 'Sunscreen Roller Blind', nameKo: '썬스크린 롤러 블라인드', badge: '빛투과/자외선차단' },
  { code: 'rbb', name: 'Block Out Roller Blind', nameKo: '암막 롤러 블라인드', badge: '100% 암막차단' },
  { code: 'cts', name: 'Sheer Curtain', nameKo: '쉬어 커튼 (차르르 쉬폰)', badge: '부드러운 채광/인테리어' },
  { code: 'cth', name: 'Heavy Curtain', nameKo: '헤비/드레이프 암막 커튼', badge: '방한/방음/암막' },
  { code: 'vb', name: 'Vertical Blind', nameKo: '버티컬 블라인드', badge: '각도조절/가성비' },
  { code: 'ps', name: 'Plantation Shutter', nameKo: '플랜테이션 셔터', badge: '프리미엄 우드/PVC' },
  { code: 'ven', name: 'Venetian Blind', nameKo: '베네시안 블라인드', badge: '알루미늄/우드 슬랫' },
  { code: 'zbr', name: 'Zebra / Dual Blind', nameKo: '콤비 / 제브라 블라인드', badge: '스트라이프 조절' },
];

export const QUICK_TAGS: string[] = [
  '#모터라이즈 (전동 스마트제어)',
  '#매립박스 시공',
  '#천장 직결 설치',
  '#창틀 안쪽 맞춤 (Inside Fit)',
  '#창틀 밖 돌출 맞춤 (Outside Fit)',
  '#S폴드 웨이브',
  '#나비주름 (Pinch Pleat)',
  '#화이트',
  '#오프화이트/아이보리',
  '#린넨 내추럴 베이지',
  '#차콜 그레이',
  '#이중 커튼 (쉬어+암막)',
];

export function cleanText(str: string): string {
  // Remove whitespace and special punctuation, preserve alphanumeric and Korean
  return str.replace(/[^a-zA-Z0-9가-힣]/g, '');
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
