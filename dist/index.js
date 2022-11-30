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
    listBlobHierarchical(containerName, hierarchyDelimiter) {
        var _a, e_1, _b, _c, _d, e_2, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            // page size - artificially low as example
            const maxPageSize = 2;
            // some options for filtering list
            const listOptions = {
                includeMetadata: true,
                includeSnapshots: false,
                includeTags: true,
                includeVersions: false,
                prefix: ''
            };
            let i = 1;
            console.log(`Folder $ /`);
            let containerClient = this.blob_service_client.getContainerClient(containerName);
            try {
                for (var _g = true, _h = __asyncValues(containerClient
                    .listBlobsByHierarchy('/', listOptions)
                    .byPage({ maxPageSize })), _j; _j = yield _h.next(), _a = _j.done, !_a;) {
                    _c = _j.value;
                    _g = false;
                    try {
                        const response = _c;
                        console.log(`   Page ${i++}`);
                        const segment = response.segment;
                        if (segment.blobPrefixes) {
                            try {
                                // Do something with each virtual folder
                                for (var _k = true, _l = (e_2 = void 0, __asyncValues(segment.blobPrefixes)), _m; _m = yield _l.next(), _d = _m.done, !_d;) {
                                    _f = _m.value;
                                    _k = false;
                                    try {
                                        const prefix = _f;
                                        // build new virtualHierarchyDelimiter from current and next
                                        yield this.listBlobHierarchical(containerName, `${hierarchyDelimiter}${prefix.name}`);
                                    }
                                    finally {
                                        _k = true;
                                    }
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (!_k && !_d && (_e = _l.return)) yield _e.call(_l);
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                        }
                        for (const blob of response.segment.blobItems) {
                            // Do something with each blob
                            console.log(`\tBlobItem: name - ${blob.name}`);
                        }
                    }
                    finally {
                        _g = true;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = _h.return)) yield _b.call(_h);
                }
                finally { if (e_1) throw e_1.error; }
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
