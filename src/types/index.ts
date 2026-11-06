export interface SuburbEntry {
  postcode: string;
  suburb: string;
  display: string;
}

export interface RoomOption {
  code: string;
  name: string;
  nameKo: string;
  iconName?: string;
}

export interface ProductOption {
  code: string;
  name: string;
  nameKo: string;
  badge: string;
}

export interface UploadFormData {
  file: File | null;
  filePreviewUrl: string | null;
  postcode: string;
  suburb: string;
  locationCode: string;
  windowSeq: string;
  productCode: string;
  memo: string;
  selectedTags: string[];
  aiCaption: string;
  hashtags: string[];
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  fileName: string;
  suburb: string;
  postcode: string;
  locationFull: string;
  productCode: string;
  memo: string;
  filePreviewUrl?: string;
  fileSize?: number;
  aiCaption?: string;
  webhookStatus?: 'success' | 'failed' | 'downloaded-only';
  driveStatus?: 'success' | 'failed' | 'not-connected';
  driveFileId?: string;
  driveWebViewLink?: string;
  errorMessage?: string;
}
