const fileInput = document.getElementById("file-input");
const output = document.getElementById("output");

function addImage(elementId, fileName) {
  console.log("addText：", fileName);
  const bufferSize = 2 * 1024 * 1024;
  const buffer = Module._malloc(bufferSize);
  const fileSize = Module.ccall(
    "readFile",
    "number",
    ["string", 'number'],
    [fileName, buffer]
  );
  var imageBuffer = new Uint8Array(Module.HEAPU8.buffer, buffer, fileSize);
  const imageBlob = new Blob([imageBuffer], { type: "image/*" })
  const imageUrl = URL.createObjectURL(imageBlob);
   // 找到 id 为 "preview" 的 div 元素
   const previewDiv = document.getElementById(elementId);
   const img = document.createElement("img");
   img.src = imageUrl;
   previewDiv.appendChild(img);
}

function addVideo(elementId, fileName) {
  const previewDiv = document.getElementById(elementId);
  const video = document.createElement("video");
  video.src = fileName;
  video.controls = true;
  previewDiv.appendChild(video);
}
function addText(elementId, fileName) {
  console.log("addText：", fileName);
  const bufferSize = 1024 * 1024;
  const buffer = Module._malloc(bufferSize);
  const fileSize = Module.ccall(
    "readFile",
    "number",
    ["string", 'number'],
    [fileName, buffer]
  );
  const cString = UTF8ToString(buffer);
  console.log(cString);
  const previewDiv = document.getElementById(elementId);
  const pre = document.createElement("pre");
  pre.innerHTML = cString;
  previewDiv.appendChild(pre);
}

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
    unzipRmsFileList.forEach((filename) => {
      const extension = filename.split(".").pop().toLowerCase();
      if (extension === "jpg" || extension === "gif") {
        addImage(previewId, filename);
      } else if (extension === "mp4") {
        // addVideo(previewId, filename);
      } else if (extension === "txt") {
        addText(previewId, filename);
      }
    });

    FS.unlink(filename);
  };

  reader.readAsArrayBuffer(file);
});

Module.onRuntimeInitialized = async () => {
  // Emscripten runtime is ready, you can call C functions now
};
