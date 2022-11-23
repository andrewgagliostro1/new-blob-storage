"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureBlobClient = void 0;
const identity_1 = require("@azure/identity");
const storage_blob_1 = require("@azure/storage-blob");
class AzureBlobClient {
    //class constructor
    constructor(input) {
        this.blob_cs = input.blob_cs;
        this.managed_identity_toggle = input.managed_identity_toggle; //os.environ.get("managed_identity");
        let default_credential = new identity_1.DefaultAzureCredential();
        if (this.managed_identity_toggle) {
            let managed_identity = new identity_1.ManagedIdentityCredential();
            let credential_chain = new identity_1.ChainedTokenCredential(managed_identity);
            this.blob_service_client = new storage_blob_1.BlobServiceClient(this.blob_cs, managed_identity);
        }
        else {
            this.blob_service_client = storage_blob_1.BlobServiceClient.fromConnectionString(this.blob_cs);
        }
    }
    store_blob(containerName, blobName, blob_obj) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let containerClient = this.blob_service_client.getContainerClient(containerName);
                let exists = yield containerClient.exists();
                if (!(exists)) {
                    yield containerClient.createIfNotExists();
                }
                console.log(`Created container client with name ${containerClient.containerName}`);
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                const uploadBlobResponse = yield blockBlobClient.upload(blob_obj, blob_obj.length);
                console.log(`Created and uploaded file ${containerName}/${blobName} successfully`, JSON.stringify(uploadBlobResponse));
                return true;
            }
            catch (e) {
                console.log(e);
                throw e;
                return false;
            }
        });
    }
    fetch_blob(containerName, blobName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let containerClient = this.blob_service_client.getContainerClient(containerName);
                const blobClient = containerClient.getBlobClient(blobName);
                const downloadBlockBlobResponse = yield blobClient.download();
                const res = yield this.streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
                console.log("Downloaded blob content");
                return res;
            }
            catch (e) {
                console.log(e);
                throw e;
            }
        });
    }
    streamToBuffer(readableStream) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const chunks = [];
                readableStream.on("data", (data) => {
                    chunks.push(data instanceof Buffer ? data : Buffer.from(data));
                });
                readableStream.on("end", () => {
                    resolve(Buffer.concat(chunks));
                });
                readableStream.on("error", reject);
            });
        });
    }
}
exports.AzureBlobClient = AzureBlobClient;
