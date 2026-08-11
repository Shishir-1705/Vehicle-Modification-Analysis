import axios from 'axios';

// Base API configuration with environment variable fallback
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/v1/events';

// Single Axios instance used across the entire application
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Dynamic Bearer Token Injection Interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('modai_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Development Error Diagnostics
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error Response Data:", error.response.status, error.response.data);
    } else {
      console.error("API Network Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const healthUrl = API_BASE_URL.replace('/api/v1', '/health');
    const response = await fetch(healthUrl, { cache: 'no-store' });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
};

export interface HealthStatus {
  online: boolean;
  database: string;
  database_error?: string | null;
  message: string;
}

export const getDetailedHealth = async (): Promise<HealthStatus> => {
  try {
    const healthUrl = API_BASE_URL.replace('/api/v1', '/health');
    const response = await fetch(healthUrl, { cache: 'no-store' });
    if (!response.ok) {
      return { online: false, database: 'Offline', message: 'Backend unreachable' };
    }
    const data = await response.json();
    return {
      online: data.status === 'ok',
      database: data.database || 'Connected',
      database_error: data.database_error,
      message: data.message || 'Operational'
    };
  } catch (err: any) {
    return { online: false, database: 'Offline', database_error: err?.message, message: 'Connection Error' };
  }
};

// --- DATA TYPES ---
export interface Detection {
  id?: string;
  component_name: string;
  class?: string;
  confidence: number;
  bounding_box: number[];
  box?: number[];
  explanation?: {
    violation?: string;
    description?: string;
    why_illegal?: string;
    visual_evidence?: string;
    severity?: string;
    legal_status?: string;
    citation?: string;
    risk_level?: string;
    penalty_inr?: number;
    [key: string]: any;
  };

  segmentation?: number[][];
  heatmap?: string;
}

export interface ScanResult {
  id: string;
  image_url: string;
  scanned_at: string;
  status: 'stock' | 'modified';
  binary_confidence: number;
  plate_number?: string;
  vehicle_model?: string;
  vehicle_owner?: string;
  owner_contact?: string;
  gradcam_image?: string;
  pdf_path?: string;
  detections: Detection[];
}

export interface PlatformMetrics {
  kpis: {
    total_scans: number;
    modified_scans: number;
    stock_scans: number;
    total_detections: number;
    accuracy_rate: number;
  };
}

// --- API ACTIONS ---
export const analyzeBike = async (file: File): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post<ScanResult>('/scan/analyze', formData);
  return data;
};

export const getHistory = async (params?: { page?: number; limit?: number; search?: string; status?: string; sort_by?: string }): Promise<{ total: number; page: number; pages: number; results: ScanResult[] }> => {
  const { data } = await api.get('/analytics/history', { params });
  return data;
};


export const getMetrics = async (): Promise<PlatformMetrics> => {
  const { data } = await api.get('/analytics/metrics');
  return data;
};

export const deleteScan = async (scanId: string): Promise<boolean> => {
  try {
    await api.delete(`/scan/${scanId}`);
    return true;
  } catch (err) {
    console.error("Failed to delete scan:", err);
    return false;
  }
};

export const getReportUrl = (scanId: string, metadata?: { owner?: string, plate?: string, loc?: string }): string => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('modai_token') : '';
  const params = new URLSearchParams({ token: token || '' });
  if (metadata?.owner) params.append('owner_name', metadata.owner);
  if (metadata?.plate) params.append('plate_number', metadata.plate);
  if (metadata?.loc) params.append('location', metadata.loc);
  
  return `${API_BASE_URL}/scan/${scanId}/report?${params.toString()}`;
};

export const generateAndDownloadReport = async (metadata: {
  scan_id?: string;
  plate_number: string;
  owner_name: string;
  vehicle_model: string;
  status: string;
  binary_confidence?: number;
  detections: Detection[];
  location?: string;
  ocr_output?: string;
}): Promise<void> => {


  const token = typeof window !== 'undefined' ? localStorage.getItem('modai_token') : '';
  const params = new URLSearchParams({
    token: token || '',
    owner_name: metadata.owner_name,
    plate_number: metadata.plate_number
  });
  
  const reportUrl = `${API_BASE_URL}/scan/${metadata.scan_id}/report?${params.toString()}`;
  
  const link = document.createElement('a');
  link.href = reportUrl;
  link.download = `Inspection_Report_${metadata.plate_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const lookupVehicle = async (plate: string): Promise<any> => {
  try {
    const { data } = await api.get(`/vehicle/lookup/${plate}`);
    return data;
  } catch {
    return null;
  }
};

export const getExportCsvUrl = (days?: number): string => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('modai_token') : '';
  const params = new URLSearchParams({ token: token || '' });
  if (days) params.append('days', days.toString());
  return `${API_BASE_URL}/analytics/export?${params.toString()}`;
};

export interface XAIEvaluation {
  violation: string;
  description: string;
  why_illegal: string;
  location?: string;
  visual_evidence?: string;
  confidence?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface LiveEvent {

  id: string;
  timestamp: string;
  type: string;
  message: string;
  plate?: string;
  status?: string;
  severity?: string;
  component?: string;
}



export const getLiveEvents = async (): Promise<LiveEvent[]> => {
  try {
    const { data } = await api.get('/events/live');
    return data;
  } catch {
    return [];
  }
};

export const startVideoSession = async (source?: string): Promise<any> => {
  try {
    const { data } = await api.post('/video/start', { source });
    return data;
  } catch {
    return { status: 'started' };
  }
};

export const stopVideoSession = async (): Promise<any> => {
  try {
    const { data } = await api.post('/video/stop');
    return data;
  } catch {
    return { status: 'stopped' };
  }
};

export const getVideoStatus = async (): Promise<any> => {
  try {
    const { data } = await api.get('/video/status');
    return data;
  } catch {
    return { active: true };
  }

};

export const setVideoSource = async (source: string): Promise<any> => {
  try {
    const { data } = await api.post('/video/source', { source });
    return data;
  } catch {
    return { source };
  }
};

export const getLatestPlate = async (): Promise<any> => {
  try {
    const { data } = await api.get('/vehicle/latest');
    return data;
  } catch {
    return null;
  }
};



