const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type QueryParams = Record<string, string | number | boolean | undefined>;

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: QueryParams;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

const buildUrl = (path: string, params?: QueryParams) => {
  const url = new URL(path, BACKEND_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, signal, headers } = options;
  const url = buildUrl(path, params);

  const init: RequestInit = {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    }
  };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) {
          message = text;
        }
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export type DashboardSummaryResponse = {
  totalEvents: number;
  blockedEvents: number;
  allowedEvents: number;
  severityCount: Record<"low" | "medium" | "high" | "critical", number>;
  topDetectedTypes: Array<{ type: string; count: number }>;
  lastEventTimestamp: string | null;
  timeframe: string;
};

export type DashboardLlmResult = {
  _id?: string;
  decision?: string;
  risk?: string;
  reason?: string;
  safeAlternative?: string;
  safeText?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
  severity?: string;
  detectedTypes?: string[];
  sanitizedPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DashboardEvent = {
  _id: string;
  workspaceId?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  severity?: string;
  actionTaken?: string;
  redactedText?: string;
  rawPrompt?: string;
  sanitizedPrompt?: string;
  detectedTypes?: string[];
  allowed?: boolean;
  source?: string;
  workstation?: string;
  matches?: string[];
  fragments?: Array<{ type?: string; fragment?: string; severity?: string; fragmentHash?: string }>;
  findings?: Array<{ type?: string; fragmentHash?: string; snippet?: string }>;
  ipAddress?: string;
  originalJson?: {
    prompt?: string;
    rawPrompt?: string;
    rawText?: string;
    ip?: string;
    [key: string]: unknown;
  } | null;
  originalHash?: string;
  latencyMs?: number;
  modelUsed?: string;
  llmResult?: DashboardLlmResult | null;
};

export type DashboardTimeseriesResponse = {
  buckets: Array<{ date: string; total: number; blocked: number; critical: number }>;
  bucketSize: string;
  timeframe: string;
};

export type DashboardRecentEventsResponse = {
  page: number;
  limit: number;
  total: number;
  timeframe: string;
  events: DashboardEvent[];
};

export type TypeBreakdownResponse = {
  timeframe: string;
  types: Array<{ type: string; count: number }>;
};

export type SeverityTrendResponse = {
  timeframe: string;
  trend: Array<{ date: string; low: number; medium: number; high: number; critical: number }>;
};

export type EventDetailResponse = {
  event: DashboardEvent;
};

export type AuthLoginResponse = {
  success: boolean;
  user: {
    id: string;
    username: string;
    role?: string;
  };
};

type DashboardQueryParams = {
  workspaceId?: string;
  since?: string;
  from?: string;
  tz?: string;
};

type RecentEventsQueryParams = DashboardQueryParams & {
  page?: number;
  limit?: number;
  action?: string;
  detectedType?: string;
  severity?: string;
  search?: string;
};

export const apiClient = {
  checkPrompt(prompt: string) {
    return request("/dlp/check", { method: "POST", body: { prompt } });
  },
  sendToLlm(payload: unknown) {
    return request("/llm/send", { method: "POST", body: payload });
  }
};

export const dashboardApi = {
  getSummary(params?: DashboardQueryParams, signal?: AbortSignal) {
    return request<DashboardSummaryResponse>("/dashboard/summary", { params, signal });
  },
  getTimeseries(params?: DashboardQueryParams, signal?: AbortSignal) {
    return request<DashboardTimeseriesResponse>("/dashboard/timeseries", { params, signal });
  },
  getRecentEvents(params?: RecentEventsQueryParams, signal?: AbortSignal) {
    return request<DashboardRecentEventsResponse>("/dashboard/recentEvents", { params, signal });
  },
  getTypeBreakdown(params?: DashboardQueryParams, signal?: AbortSignal) {
    return request<TypeBreakdownResponse>("/dashboard/typeBreakdown", { params, signal });
  },
  getSeverityTrend(params?: DashboardQueryParams, signal?: AbortSignal) {
    return request<SeverityTrendResponse>("/dashboard/severityTrend", { params, signal });
  },
  getEventById(id: string, signal?: AbortSignal) {
    return request<EventDetailResponse>(`/dashboard/events/${id}`, { signal });
  }
};

export const authApi = {
  login(username: string, password: string) {
    return request<AuthLoginResponse>("/auth/login", { method: "POST", body: { username, password } });
  }
};
