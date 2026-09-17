import type { DataMode, Provenance } from "./canonical-data-model";

export interface PublicAdapterResult<TPayload> {
  source_name: string;
  available: boolean;
  mode: DataMode;
  payload: TPayload;
  message: string;
  provenance?: Provenance;
}

export interface PublicDataAdapter<TPayload, TParams = Record<string, never>> {
  source_name: string;
  fetch(params: TParams): Promise<PublicAdapterResult<TPayload>> | PublicAdapterResult<TPayload>;
}
