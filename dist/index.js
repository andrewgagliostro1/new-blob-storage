"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const storage_file_datalake_1 = require("@azure/storage-file-datalake");
const identity_1 = require("@azure/identity");
const fs = __importStar(require("fs"));
class AzureBlobClient {
    //class constructor
    constructor(input) {
        this.blob_cs = input.blob_cs;
        this.managed_identity_toggle = input.managed_identity_toggle; //os.environ.get("managed_identity");
        let default_credential = new identity_1.DefaultAzureCredential();
        if (this.managed_identity_toggle) {
            let managed_identity = new identity_1.ManagedIdentityCredential();
            let credential_chain = new identity_1.ChainedTokenCredential(managed_identity);
            this.datalake_service_client = new storage_file_datalake_1.DataLakeServiceClient(this.blob_cs, managed_identity);
        }
        else {
            this.datalake_service_client = new storage_file_datalake_1.DataLakeServiceClient(this.blob_cs, default_credential);
        }
    }
    store_document(path_full, file_obj, fileSystemName) {
        return __awaiter(this, void 0, void 0, function* () {
            let path_base = path_full.split("/", 1)[0];
            let file_name = path_full.split("/", 1)[1];
            try {
                let file_system_client = this.datalake_service_client.getFileSystemClient(fileSystemName);
                let dir_client = file_system_client.getDirectoryClient(path_base);
                let file_client = dir_client.getFileClient(file_name);
                if (file_obj !== null) {
                    file_client.append(file_obj, 0, file_obj.size);
                    file_client.flush(file_obj.size);
                }
                else {
                    const data = fs.readFileSync(path_full);
                    file_client.append(data, 0, data.length);
                    file_client.flush(data.length);
                }
                console.log(`Create and upload file ${path_full} successfully`);
                return true;
            }
            catch (e) {
                console.log(e);
                throw e;
                return false;
            }
        });
    }
    fetch_document(path_full, fileSystemName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let path_base = path_full.split("/", 1)[0];
                let file_name = path_full.split("/", 1)[1];
                fs.mkdir(path_base, (err) => {
                    if (err) {
                        return console.error(err);
                    }
                    console.log('Directory created successfully!');
                });
                let file_system_client = this.datalake_service_client.getFileSystemClient(fileSystemName);
                let dir_client = file_system_client.getDirectoryClient(path_base);
                let file_client = dir_client.getFileClient(file_name);
                const downloaded_res = yield file_client.read();
                let y = new Blob();
                let res_blob = yield downloaded_res.contentAsBlob;
                let res_str = yield this.blobToString(res_blob ? res_blob : y);
                console.log(res_str);
                return res_blob ? res_blob : y;
            }
            catch (e) {
                console.log(e);
                throw e;
            }
        });
    }
    blobToString(blob) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileReader = new FileReader();
            return new Promise((resolve, reject) => {
                fileReader.onloadend = (ev) => {
                    resolve(ev.target.result);
                };
                fileReader.onerror = reject;
                fileReader.readAsText(blob);
            });
        });
    }
}
exports.AzureBlobClient = AzureBlobClient;
