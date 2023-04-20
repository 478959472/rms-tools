
/**
 * 下面编写组装前端报文的方法
 */
class RmsV3Data {
    constructor() {
        this.tag = "";
        this.type = "";
        this.text = "";
        this.src = "";
        this.paramText = "";
        this.image = new RmsV3Element();
        this.video = new RmsV3Element();
        this.audio = new RmsV3Element();
        this.active = false;
        this.borderRadius = 0;
        this.textEditable = [];
        this.width = "";
        this.h = 0;
        this.w = 0;
        this.height = "";
        this.isShowImgText = "";
        this.duration = 0;
        this.size = "";
        this.textPosition = "";
    }
}

class RmsV3Element {
    constructor() {
        this.w = 0;
        this.h = 0;
        this.size = 0;
        this.width = "";
        this.height = "";
        this.src = "";
        this.textEditable = [];
        this.duration = 0;
        this.title = "";
    }
}

function getSmilSrc(fileContent) {
    const map = new Map();

    const doc = new DOMParser().parseFromString(fileContent, 'text/xml');
    const books = doc.documentElement;
    // 获取根节点下的子节点body
    const iterss = books.getElementsByTagName('body');
    // 遍历body节点
    for (let i = 0; i < iterss.length; i++) {
        const recordEless = iterss[i];
        // 获取子节点body下的子节点par
        const itersElIterator = recordEless.getElementsByTagName('par');
        let num = 1;
        let fileSrc = '';
        // 遍历Header节点下的Response节点
        for (let j = 0; j < itersElIterator.length; j++) {
            const itemEle = itersElIterator[j];
            // 获取子节点par下的各个节点
            // 类型的话在src后面再加一个值
            const listElement = itemEle.children;
            // 判断空帧
            if (listElement.length === 0) {
                throw new Error('存在空帧');
            }
            for (let k = 0; k < listElement.length; k++) {
                const element = listElement[k];
                const elementName = element.nodeName;
                const type = elementName === 'img' ? 'image' : elementName;
                const src = element.getAttribute('src');
                const appendStr = `${src}##${type}&&`;
                fileSrc += appendStr;
            }
            if (fileSrc.length > 0) {
                map.set(`par${num}`, fileSrc.toString());
                // 清空fileSrc
                fileSrc = '';
                num++;
            }
        }
    }

    return map;
}

function replaceParam(str) {
    const regex = /#P_\d+#/;
    let pattern = regex.exec(str);
    while (pattern) {
        const no = str.substring(pattern.index + 3, pattern[0].length - 1);
        str = str.replace(regex, '{#参数${no}#}');
        pattern = regex.exec(str);
    }
    return str;
}

function getVideoInfo(url) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.addEventListener('loadedmetadata', () => {
            resolve({
                width: video.videoWidth,
                height: video.videoHeight
            });
        });
        video.addEventListener('error', reject);
        video.src = url;
    });
}

function parseV3Json(srcMap, dataMap) {
    const list = [];
    let frameNo = 0;
    for (const [key, value] of srcMap) {
        frameNo += 1;
        const fileInfo = value.split("&&");
        const rmsV3Data = new RmsV3Data();
        //02.mp4##video&&03.txt##text&&
        for (let j = 0; j < fileInfo.length; j++) {
            const nameAndType = fileInfo[j];
            if (nameAndType === '') {
                break
            }
            const type = nameAndType.split("##")[1];
            const src = nameAndType.split("##")[0];
            const filePath = dataMap.get(src);
            if (j === 0) {
                rmsV3Data.tag = `${type}_${j + 1}`;
                rmsV3Data.type = type;
                if (rmsV3Data.textPosition === "") {
                    rmsV3Data.textPosition = type === "text" ? "top" : "bottom";
                }

                if (type === "text") {
                    let text = filePath;
                    text = replaceParam(text);
                    rmsV3Data.text = text;
                    rmsV3Data.image = new RmsV3Element();
                    rmsV3Data.audio = new RmsV3Element();
                    rmsV3Data.video = new RmsV3Element();
                    rmsV3Data.active = false;
                    rmsV3Data.src = "";
                } else if (type === "image") {
                    rmsV3Data.src = filePath;
                    // setRmsDataV3Attr(filePath, rmsV3Data);
                    rmsV3Data.borderRadius = 0;
                    rmsV3Data.textEditable = [];
                    // setRmsDataSize(filePath, rmsV3Data);
                    rmsV3Data.active = false;
                    rmsV3Data.isShowImgText = "hide";
                    rmsV3Data.text = "";
                    rmsV3Data.paramText = "";
                } else if (type === "audio") {
                    rmsV3Data.active = false;
                    rmsV3Data.text = "";
                    // setRmsDataSize(filePath, rmsV3Data);
                    rmsV3Data.src = filePath;
                } else if (type === "video") {
                    rmsV3Data.height = "";
                    rmsV3Data.text = "";
                    rmsV3Data.size = "0";
                    rmsV3Data.active = true;
                    rmsV3Data.src = filePath;
                    rmsV3Data.w = 260;
                    // let ratio = 260 /
                }
            } else {
                if (rmsV3Data.type === "text") {
                    let imageElement = new RmsV3Element();
                    let audioElement = new RmsV3Element();
                    let videoElement = new RmsV3Element();
                    if (type === "image") {
                        imageElement.src = filePath;
                        // setRmsV3Attr
                    }
                    if (type === "video") {
                        videoElement.src = filePath;
                        // setRmsV3Attr
                    }
                    if (type === "audio") {
                        audioElement.src = filePath;
                        // setRmsV3Attr
                    }
                    rmsV3Data.image = imageElement;
                    rmsV3Data.audio = audioElement;
                    rmsV3Data.video = videoElement;
                } else {
                    rmsV3Data.text = replaceParam(filePath);
                }
            }
        }
        list.push(rmsV3Data)
    }
    return JSON.stringify(list);
}

function getPreviewJson(xmlStr, dataMap) {
    let srcMap = getSmilSrc(xmlStr);
    let jsonStr = parseV3Json(srcMap, dataMap)
    const res = {
        'content': JSON.parse(jsonStr),
        'paramList': [],
        'title': 'rms',
        'fileParamMap': {}
    };
    return JSON.stringify(res);
}
function downloadAndUnzipRmsFile(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(unzipRmsData(xhr.response))
            } else {
                reject(new Error(`下载文件出错，状态码为${xhr.status}`));
            }
        };
        xhr.onerror = () => {
            reject(new Error('下载文件出错'));
        };
        xhr.send();
    });
}

// let res = getPreviewJson(xmlStr, dataMap);
//
// console.log(res)

async function unzipRmsData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        let smilStr = '';
        let dataMap = new Map();
        reader.onload = async (event) => {
            const fileContent = event.target.result;
            const filename = "temp.rms";

            await FS.writeFile(filename, new Uint8Array(fileContent));

            const cStringsPtr = Module.ccall(
                "unzipRmsFile",
                "number",
                ["string"],
                [filename]
            );
            const unzipRmsFileList = [];
            let i = 0;
            while (true) {
                const cStringPtr = HEAPU32[cStringsPtr / 4 + i];
                if (cStringPtr === 0) {
                    break;
                }
                const cString = UTF8ToString(cStringPtr);
                unzipRmsFileList.push(cString);
                i++;
            }
            console.log(unzipRmsFileList);
            unzipRmsFileList.forEach((item) => {
                console.log("外部文件名：", item);
            });
            unzipRmsFileList.forEach((filename) => {
                const extension = filename.split(".").pop().toLowerCase();
                if (extension === "jpg" || extension === "gif" || extension === "png") {
                    const imageUrl = convertFileToUrl(filename, "image/*");
                    dataMap.set(filename, imageUrl);
                    // addImage(previewId, imageUrl);
                } else if (extension === "mp4") {
                    const videoUrl = convertFileToUrl(filename, "video/*");
                    // addVideo(previewId, videoUrl);
                    dataMap.set(filename, videoUrl);
                } else if (extension === "txt") {
                    const cString = convertFileToStr(filename);
                    // addText(previewId, cString);
                    dataMap.set(filename, cString);
                } else if (extension === "smil") {
                    const cString = convertFileToStr(filename);
                    console.log('smil文件内容：', cString);
                    smilStr = cString;
                    // dataMap.set(filename, cString);
                }
            });
            FS.unlink(filename);
            let previewJson = getPreviewJson(smilStr, dataMap);
            const responseData = {
                dataMap: dataMap,
                previewJson: previewJson
            };
            resolve(responseData);

        };
        reader.onerror = () => {
            reject(reader.error);
        };
        reader.readAsArrayBuffer(file);
    });
}

function convertFileToUrl(fileName, type) {
    const bufferSize = 2 * 1024 * 1024;
    const buffer = Module._malloc(bufferSize);
    const fileSize = Module.ccall(
        "readFile",
        "number",
        ["string", 'number'],
        [fileName, buffer]
    );
    var videoBuffer = new Uint8Array(Module.HEAPU8.buffer, buffer, fileSize);
    const videoBlob = new Blob([videoBuffer], {type: type});
    const videoUrl = URL.createObjectURL(videoBlob);
    Module._free(buffer);
    return videoUrl;
}

function convertFileToStr(fileName) {
    const bufferSize = 1024 * 1024;
    const buffer = Module._malloc(bufferSize);
    const fileSize = Module.ccall(
        "readFile",
        "number",
        ["string", 'number'],
        [fileName, buffer]
    );
    const cString = UTF8ToString(buffer);
    Module._free(buffer);
    return cString;
}


Module.onRuntimeInitialized = async () => {
    // Emscripten runtime is ready, you can call C functions now
};


