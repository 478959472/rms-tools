const fileInput = document.getElementById("file-input");
const output = document.getElementById("output");


fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    // unzipRmsData(file).then((responseData)=>{
    //     console.log('dataMap:', responseData.dataMap)
    //     console.log('previewJson:', responseData.previewJson)
    //     showData(responseData.dataMap);
    // }).catch((error) => {
    //     console.error(error); // 如果出现错误，错误信息将会在控制台中输出
    // });

    downloadAndUnzipRmsFile("http://localhost:63342/rms-tools/1.rms").then((responseData)=>{
        console.log('dataMap:', responseData.dataMap)
        console.log('previewJson:', responseData.previewJson)
        showData(responseData.dataMap);

    }).catch((error) => {
        console.error(error); // 如果出现错误，错误信息将会在控制台中输出
    });

});

function showData(dataMap){
    let previewId = "preview";
    document.getElementById(previewId).innerHTML = "";
    for (const [filename, url] of dataMap) {
        const extension = filename.split(".").pop().toLowerCase();
        if (extension === "jpg" || extension === "gif" || extension === "png") {
            addImage(previewId, url);
        } else if (extension === "mp4") {
            addVideo(previewId, url);
        } else if (extension === "txt") {
            addText(previewId, url);
        }
    }
}

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



function formatXml(xmlStr) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}


