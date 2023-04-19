const fileInput = document.getElementById("file-input");
const output = document.getElementById("output");

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
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
    let previewId = "preview";
    document.getElementById(previewId).innerHTML="";
    unzipRmsFileList.forEach((filename) => {
      const extension = filename.split(".").pop().toLowerCase();
      if (extension === "jpg" || extension === "gif"|| extension === "png") {
        const imageUrl = convertFileToUrl(filename, "image/*");
        addImage(previewId, imageUrl);
      } else if (extension === "mp4") {
        const videoUrl = convertFileToUrl(filename, "video/*");
        addVideo(previewId, videoUrl);
      } else if (extension === "txt") {
        const cString = convertFileToStr(filename);
        addText(previewId, cString);
      }else if (extension === "smil") {
        const cString = convertFileToStr(filename);
        console.log('smil文件内容：', cString);
        const formattedXml = formatXml(cString);
        // 在页面上展示格式化后的XML
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = formattedXml;
        pre.appendChild(code);
        const previewDiv = document.getElementById(previewId);
        // previewDiv.appendChild(pre);
      }
    });

    FS.unlink(filename);
  };

  reader.readAsArrayBuffer(file);
});

Module.onRuntimeInitialized = async () => {
  // Emscripten runtime is ready, you can call C functions now
};

function addImage(elementId, imageUrl) {
    // 找到 id 为 "preview" 的 div 元素 "image/*"
    const previewDiv = document.getElementById(elementId);
    const img = document.createElement("img");
    img.src = imageUrl;
    previewDiv.appendChild(img);
 }
 
 function addVideo(elementId, videoUrl) {

     const previewDiv = document.getElementById(elementId);
     const video = document.createElement("video");
     video.src = videoUrl;
     video.controls = true;
     previewDiv.appendChild(video);
 }
 
 
 function addText(elementId, cString) {
   console.log(cString);
   const previewDiv = document.getElementById(elementId);
   const pre = document.createElement("pre");
   pre.innerHTML = cString;
   previewDiv.appendChild(pre);
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
    const videoBlob = new Blob([videoBuffer], { type: type});
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

function formatXml(xmlStr) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
  const serializer = new XMLSerializer();
  return serializer.serializeToString(xmlDoc);
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