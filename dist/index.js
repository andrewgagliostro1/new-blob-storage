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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
    delete_blob(containerName, blobName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let containerClient = this.blob_service_client.getContainerClient(containerName);
                const blobClient = containerClient.getBlobClient(blobName);
                const downloadBlockBlobResponse = yield blobClient.delete();
                return;
            }
            catch (e) {
                console.log(e);
                throw e;
            }
        });
    }
    list_blobs(containerName) {
        var _a, e_1, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let containerClient = this.blob_service_client.getContainerClient(containerName);
            try {
                let out = [];
                let i = 1;
                let blobs = containerClient.listBlobsFlat();
                try {
                    for (var _d = true, blobs_1 = __asyncValues(blobs), blobs_1_1; blobs_1_1 = yield blobs_1.next(), _a = blobs_1_1.done, !_a;) {
                        _c = blobs_1_1.value;
                        _d = false;
                        try {
                            const blob = _c;
                            out.push(`Blob ${i++}: ${blob.name}`);
                        }
                        finally {
                            _d = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = blobs_1.return)) yield _b.call(blobs_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return out;
            }
            catch (e) {
                console.log(e);
                throw e;
            }
        });
    }
    list_containers() {
        var _a, e_2, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let out = [];
                let i = 1;
                let containers = this.blob_service_client.listContainers();
                try {
                    for (var _d = true, containers_1 = __asyncValues(containers), containers_1_1; containers_1_1 = yield containers_1.next(), _a = containers_1_1.done, !_a;) {
                        _c = containers_1_1.value;
                        _d = false;
                        try {
                            const container = _c;
                            out.push(`Container ${i++}: ${container.name}`);
                        }
                        finally {
                            _d = true;
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = containers_1.return)) yield _b.call(containers_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                return out;
            }
            catch (e) {
                console.log(e);
                throw e;
            }
        });
    }
    list_containers_with_blobs() {
        var _a, e_3, _b, _c, _d, e_4, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let out = [];
                let i = 1;
                let containers = this.blob_service_client.listContainers();
                try {
                    for (var _g = true, containers_2 = __asyncValues(containers), containers_2_1; containers_2_1 = yield containers_2.next(), _a = containers_2_1.done, !_a;) {
                        _c = containers_2_1.value;
                        _g = false;
                        try {
                            const container = _c;
                            let info = { container_name: container.name, blob_names: [] };
                            let containerClient = this.blob_service_client.getContainerClient(container.name);
                            let blobs = containerClient.listBlobsFlat();
                            try {
                                for (var _h = true, blobs_2 = (e_4 = void 0, __asyncValues(blobs)), blobs_2_1; blobs_2_1 = yield blobs_2.next(), _d = blobs_2_1.done, !_d;) {
                                    _f = blobs_2_1.value;
                                    _h = false;
                                    try {
                                        const blob = _f;
                                        info.blob_names.push(`${blob.name}`);
                                    }
                                    finally {
                                        _h = true;
                                    }
                                }
                            }
                            catch (e_4_1) { e_4 = { error: e_4_1 }; }
                            finally {
                                try {
                                    if (!_h && !_d && (_e = blobs_2.return)) yield _e.call(blobs_2);
                                }
                                finally { if (e_4) throw e_4.error; }
                            }
                            out.push(info);
                        }
                        finally {
                            _g = true;
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (!_g && !_a && (_b = containers_2.return)) yield _b.call(containers_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                return out;
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
