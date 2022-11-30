/// <reference types="node" />
import { BlobServiceClient } from '@azure/storage-blob';
export type ClientInput = {
    blob_cs: string;
    managed_identity_toggle: boolean;
};
export type ContainerBlobInfo = {
    container_name: string;
    blob_names: string[];
};
export declare class AzureBlobClient {
    blob_cs: string;
    managed_identity_toggle: boolean;
    blob_service_client: BlobServiceClient;
    constructor(input: ClientInput);
    store_blob(containerName: string, blobName: string, blob_obj: Buffer): Promise<boolean>;
    fetch_blob(containerName: string, blobName: string): Promise<Buffer>;
    delete_blob(containerName: string, blobName: string): Promise<void>;
    list_blobs(containerName: string): Promise<string[]>;
    list_containers(): Promise<string[]>;
    list_containers_with_blobs(): Promise<ContainerBlobInfo[]>;
    streamToBuffer(readableStream: any): Promise<Buffer>;
}
