export interface DatabaseConnection {
  query: (text: string, params?: any[]) => Promise<QueryResult>;
  getClient: () => Promise<PoolClient>;
}

export interface QueryResult {
  rows: any[];
  rowCount: number | null;
  command: string;
  oid: number;
  fields: FieldDef[];
}

export interface FieldDef {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

export interface PoolClient {
  query: (text: string, params?: any[]) => Promise<QueryResult>;
  release: () => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}