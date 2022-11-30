import { ChainedTokenCredential, DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';

export type ClientInput = {
  blob_cs: string,
  managed_identity_toggle: boolean,
}

export type ContainerBlobInfo = {
  container_name: string,
  blob_names: string[]
}

export class AzureBlobClient {
  blob_cs: string;
  managed_identity_toggle: boolean;
  blob_service_client: BlobServiceClient;


  //class constructor
  constructor(input: ClientInput) {
    this.blob_cs = input.blob_cs;
    this.managed_identity_toggle = input.managed_identity_toggle //os.environ.get("managed_identity");
    let default_credential = new DefaultAzureCredential();
    if (this.managed_identity_toggle) {
      let managed_identity = new ManagedIdentityCredential();
      let credential_chain = new ChainedTokenCredential(managed_identity);
      this.blob_service_client = new BlobServiceClient(this.blob_cs, managed_identity)
    }
    else {
      this.blob_service_client = BlobServiceClient.fromConnectionString(this.blob_cs);
    }
  }

  public async store_blob(containerName: string, blobName: string, blob_obj: Buffer): Promise<boolean> {

    try {

      let containerClient = this.blob_service_client.getContainerClient(containerName);

      let exists: boolean = await containerClient.exists()
      if (!(exists)) {
        await containerClient.createIfNotExists();
      }
      console.log(`Created container client with name ${containerClient.containerName}`)

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const uploadBlobResponse = await blockBlobClient.upload(blob_obj, blob_obj.length)

      console.log(`Created and uploaded file ${containerName}/${blobName} successfully`, JSON.stringify(uploadBlobResponse));
      return true;
    } catch (e) {
      console.log(e)
      throw e;
      return false;
    }

  }

  public async fetch_blob(containerName: string, blobName: string): Promise<Buffer> {

    try {
      let containerClient = this.blob_service_client.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);
      const downloadBlockBlobResponse = await blobClient.download();
      const res: Buffer = await this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
      console.log("Downloaded blob content");
      return res;
    }
    catch (e) {
      console.log(e)
      throw e;
    }
  }

  public async list_blobs(containerName: string): Promise<string[]> {

    let containerClient = this.blob_service_client.getContainerClient(containerName);
    try {
      let out: string[] = []
      let i = 1;
      let blobs = containerClient.listBlobsFlat();
      for await (const blob of blobs) {
        out.push(`Blob ${i++}: ${blob.name}`);
      }

      return out;
    }
    catch (e) {
      console.log(e);
      throw e;
    }
  }

  public async list_containers(): Promise<string[]> {

    try {
      let out: string[] = []
      let i = 1;
      let containers = this.blob_service_client.listContainers();
      for await (const container of containers) {
        out.push(`Container ${i++}: ${container.name}`);
      }
      return out;
    }
    catch (e) {
      console.log(e);
      throw e;
    }
  }


  public async list_containers_with_blobs(): Promise<ContainerBlobInfo[]> {
    try {
      let out: ContainerBlobInfo[] = []
      let i = 1;
      let containers = this.blob_service_client.listContainers();
      for await (const container of containers) {
        let info: ContainerBlobInfo = { container_name: container.name, blob_names: [] }
        let containerClient = this.blob_service_client.getContainerClient(container.name);
        let blobs = containerClient.listBlobsFlat();
        for await (const blob of blobs) {
          info.blob_names.push(`${blob.name}`);
        }
        out.push(info);
      }
      return out
    }
    catch (e) {
      console.log(e);
      throw e;
    }
  }


  public async streamToBuffer(readableStream: any): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      readableStream.on("data", (data: any) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }



}