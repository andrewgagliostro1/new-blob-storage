import { DataLakeDirectoryClient, DataLakeFileClient, DataLakeFileSystemClient, DataLakeServiceClient, FileReadResponse } from '@azure/storage-file-datalake';
const {BlobServiceClient} = require("@azure/storage-blob");
import { ChainedTokenCredential, DefaultAzureCredential, ManagedIdentityCredential } from '@azure/identity';
import * as fs from "fs";

export type clientInput = {
  blob_cs: string,
  managed_identity_toggle: boolean,
}

export class AzureBlobClient {
  blob_cs: string;  
  managed_identity_toggle: boolean;
  datalake_service_client: DataLakeServiceClient;


  //class constructor
  constructor(input: clientInput) {
    this.blob_cs = input.blob_cs;
    this.managed_identity_toggle = input.managed_identity_toggle //os.environ.get("managed_identity");
    let default_credential = new DefaultAzureCredential();
    if (this.managed_identity_toggle) {
      let managed_identity = new ManagedIdentityCredential();
      let credential_chain = new ChainedTokenCredential(managed_identity);
      this.datalake_service_client = new DataLakeServiceClient(this.blob_cs, managed_identity)
    }
    else {
      this.datalake_service_client = DataLakeServiceClient.fromConnectionString(this.blob_cs);
    }
  }

  public async store_document(fileSystemName: string, dirName: string, fileName: string, file_obj: Buffer): Promise<boolean> {

    try {
      this.datalake_service_client = await DataLakeServiceClient.fromConnectionString(this.blob_cs);
      let file_system_client: DataLakeFileSystemClient = await this.datalake_service_client.getFileSystemClient(fileSystemName);

      let exists: boolean = await file_system_client.exists()
      if(!(exists)){
        await file_system_client.createIfNotExists();
      }
      console.log(fileName)
      let file_client: DataLakeFileClient = file_system_client.getFileClient(fileName);
      exists = await file_client.exists();
      if(!exists){
        await file_client.create()
      }
  
      if (file_obj !== null) {
        let fileObj = "hello"
        await file_client.append(fileObj, 0, fileObj.length);
        await file_client.flush(fileObj.length);
      } else {
        const data = "test file"
        file_client.append(data, 0, data.length);
        file_client.flush(data.length);
      }
      console.log(`Create and upload file ${fileSystemName}/${dirName}/${fileName} successfully`);
      return true;
    } catch(e) {
      console.log(e)
      throw e;
      return false;
    }

  }

  public async fetch_document(path_full: string, fileSystemName: string): Promise<Blob|undefined> {
    try{
      let path_base = path_full.split("/", 1)[0];
      let file_name = path_full.split("/", 1)[1];
      fs.mkdir(path_base, (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('Directory created successfully!');
      });
  
      let file_system_client: DataLakeFileSystemClient = this.datalake_service_client.getFileSystemClient(fileSystemName);
      let dir_client: DataLakeDirectoryClient = file_system_client.getDirectoryClient(path_base);
      let file_client: DataLakeFileClient = dir_client.getFileClient(file_name)
  
      const downloaded_res: FileReadResponse = await file_client.read();
      let res_blob: Blob | undefined = await downloaded_res.contentAsBlob
      // let res_str:string = await this.blobToString(res_blob ? res_blob : y);
      // console.log(res_str);
  
      return res_blob;
    }
    catch(e) {
      console.log(e)
      throw e;
    }
  }



  // public async blobToString(blob: Blob): Promise<string> {
  //   const fileReader = new FileReader();
  //   return new Promise<string>((resolve, reject) => {
  //     fileReader.onloadend = (ev: any) => {
  //       resolve(ev.target!.result);
  //     };
  //     fileReader.onerror = reject;
  //     fileReader.readAsText(blob);
  //   });
  // }

}