/**
 * Phase A architecture contract only.
 *
 * This interface deliberately has no implementation and is not mounted by the
 * API yet. File bytes should live in object storage; PostgreSQL should keep
 * only the returned object path and queryable metadata.
 */
export interface StorageObjectMetadata {
  contentType: string;
  size: number;
  filename: string;
}

export interface StoredObject {
  objectPath: string;
  url: string;
  metadata: StorageObjectMetadata;
}

export interface StorageService {
  put(input: {
    bytes: Uint8Array;
    metadata: StorageObjectMetadata;
  }): Promise<StoredObject>;
  get(objectPath: string): Promise<ReadableStream<Uint8Array>>;
  delete(objectPath: string): Promise<void>;
}