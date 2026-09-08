export type WorkerAction =
  | 'RENDER_PAGE'
  | 'EXTRACT_TEXT'
  | 'MERGE_PDFS'
  | 'SPLIT_PDF'
  | 'ROTATE_PDF';

export interface WorkerMessageRequest {
  id: string;
  action: WorkerAction;
  payload: unknown;
}

export interface WorkerProgressResponse {
  id: string;
  type: 'PROGRESS';
  progress: number;
  stage: string;
}

export interface WorkerSuccessResponse<T = unknown> {
  id: string;
  type: 'SUCCESS';
  data: T;
}

export interface WorkerErrorResponse {
  id: string;
  type: 'ERROR';
  error: string;
}

export type WorkerMessageResponse<T = unknown> =
  | WorkerProgressResponse
  | WorkerSuccessResponse<T>
  | WorkerErrorResponse;
