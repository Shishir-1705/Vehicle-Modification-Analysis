import axios from 'axios';

// Enforce usage of environment variables for production deployments
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Safe timeout for slow networks
});

// Interceptor for API failure handling (Task 9)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Request Failed:", error?.message);
    return Promise.reject(error);
  }
);

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const healthUrl = API_BASE_URL ? API_BASE_URL.replace('/api/v1', '/health') : '/health';
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
    if (!response.ok) return { online: false, database: 'Offline', message: 'HTTP Error' };
    const data = await response.json();
    return {
      online: data.status === 'ok',
      database: data.database || 'Unknown',
      database_error: data.database_error,
      message: data.message || 'Operational'
    };
  } catch (err: any) {
    return {
      online: false,
      database: 'Offline',
      message: err.message || 'Connection Refused'
    };
  }
};

export interface XAIEvaluation {
  violation: string;
  description: string;
  why_illegal: string;
  location: string;
  visual_evidence: string;
  confidence: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Detection {
  id: string;
  component_name: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  segmentation?: number[][];
  explanation?: XAIEvaluation;
  heatmap?: string;
}

export interface ScanResult {
  id: string;
  image_url: string;
  scanned_at: string;
  status: 'stock' | 'modified';
  binary_confidence: number;
  modification_scores: Record<string, number>;
  plate_number?: string;
  vehicle_model?: string;
  vehicle_owner?: string;
  owner_contact?: string;
  detections: Detection[];
}

export interface PlatformMetrics {
  kpis: {
    total_users: number;
    total_scans: number;
    total_detections: number;
  };
  modification_trends: Record<string, number>;
  severity_breakdown: Record<string, number>;
}

export interface LiveEvent {
  id: string;
  type: string;
  component: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const getMetrics = async (): Promise<PlatformMetrics> => {
  const response = await api.get('/analytics/metrics');
  return response.data;
};

export const getLiveEvents = async (): Promise<LiveEvent[]> => {
  const response = await api.get('/video/events');
  return response.data;
};

export const startVideoSession = async () => {
  const response = await api.post('/video/start');
  return response.data;
};

export const stopVideoSession = async () => {
  const response = await api.post('/video/stop');
  return response.data;
};

export const getVideoStatus = async (): Promise<{ is_active: boolean, device_opened: boolean, source: string }> => {
  const response = await api.get('/video/status');
  return response.data;
};

export const setVideoSource = async (source: string): Promise<{ status: string, source: string }> => {
  const response = await api.post(`/video/source?source=${encodeURIComponent(source)}`);
  return response.data;
};

export const getLatestPlate = async (): Promise<{ plate: string | null; confidence: number }> => {
  const response = await api.get('/video/plate');
  return response.data;
};

export const analyzeBike = async (file: File): Promise<ScanResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post<ScanResult>('/scan/analyze', formData, {
    headers: {
      // For demo, we might need a dummy auth if the backend requires it
      'Authorization': 'Bearer demo_token',
    },
  });
  
  return data;
};

export const getReportUrl = (scanId: string, metadata?: { owner?: string, plate?: string, loc?: string }): string => {
  const params = new URLSearchParams({ token: 'demo_token' }); // In production, use real JWT
  if (metadata?.owner) params.append('owner_name', metadata.owner);
  if (metadata?.plate) params.append('plate_number', metadata.plate);
  if (metadata?.loc) params.append('location', metadata.loc);
  
  return `${API_BASE_URL}/scan/${scanId}/report?${params.toString()}`;
};

export interface PredictResponse {
  status: string;
  inference_time_ms: number;
  detections: Detection[];
  ocr_output?: string;
  system_load?: any;
}

export const fastPredict = async (file: File): Promise<PredictResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post<PredictResponse>('/predict/', formData);
  return data;
};

// ── History & Search ─────────────────────────────────────────────────────────

export interface HistoryResult {
  total: number;
  page: number;
  pages: number;
  results: ScanResult[];
}

export const getHistory = async (params?: {
  page?: number;
  limit?: number;
  plate?: string;
  status?: string;
}): Promise<HistoryResult> => {
  const { data } = await api.get('/analytics/history', { params });
  return data;
};

export const lookupVehicle = async (plate: string) => {
  const { data } = await api.get(`/analytics/vehicle/${encodeURIComponent(plate)}`);
  return data;
};

export const getExportCsvUrl = (days = 30): string => {
  return `${API_BASE_URL}/analytics/export/csv?days=${days}`;
};

// ── Report Generation ─────────────────────────────────────────────────────────

export interface ReportPayload {
  detections: Detection[];
  plate_number?: string;
  owner_name?: string;
  vehicle_model?: string;
  location?: string;
  status?: string;
  binary_confidence?: number;
  ocr_output?: string;
  inference_time_ms?: number;
  scan_id?: string;
  image?: File;
}

/**
 * Generates and downloads a PDF report.
 * Uses blob handling to ensure reliable browser download.
 */
export const generateAndDownloadReport = async (payload: ReportPayload): Promise<void> => {
  const form = new FormData();
  form.append('detections_json', JSON.stringify(payload.detections ?? []));
  if (payload.plate_number)        form.append('plate_number',       payload.plate_number);
  if (payload.owner_name)          form.append('owner_name',         payload.owner_name);
  if (payload.vehicle_model)       form.append('vehicle_model',      payload.vehicle_model);
  if (payload.location)            form.append('location',           payload.location);
  if (payload.status)              form.append('status',             payload.status);
  if (payload.binary_confidence != null)
    form.append('binary_confidence', String(payload.binary_confidence));
  if (payload.ocr_output)          form.append('ocr_output',         payload.ocr_output);
  if (payload.inference_time_ms != null)
    form.append('inference_time_ms', String(payload.inference_time_ms));
  if (payload.scan_id)             form.append('scan_id',            payload.scan_id);
  if (payload.image)               form.append('image',              payload.image);

  const response = await fetch(`${API_BASE_URL}/report/generate`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Report generation failed: ${err}`);
  }

  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `VehicleModAI_${payload.plate_number ?? 'Report'}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
