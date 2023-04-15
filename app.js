const fileInput = document.getElementById('file-input');
const output = document.getElementById('output');

fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
        const fileContent = event.target.result;
        const filename = 'temp.txt';

        await FS.writeFile(filename, new Uint8Array(fileContent));
    
        
        const bufferPtr = Module.ccall(
            "read_file",
            "number",
            ["string"],
            [filename]
          );
        if (bufferPtr !== 0) {
            const fileContent = Module.UTF8ToString(bufferPtr);
            console.log("File content:\n", fileContent);
            output.textContent = fileContent;
            Module.ccall("free_buffer", null, ["number"], [bufferPtr]);
          } else {
            console.error("Failed to read file.");
          }
        FS.unlink(filename);
    };

    reader.readAsArrayBuffer(file);
});

Module.onRuntimeInitialized = async () => {
    // Emscripten runtime is ready, you can call C functions now
};
