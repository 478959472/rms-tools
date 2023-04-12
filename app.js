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
        
        // Create a pointer to store the buffer address
        const bufferPointer = Module._malloc(4);
        
        const read_file = Module.cwrap('read_file', 'number', ['string', 'number']);
        const length = read_file(filename, bufferPointer);

        // Read the buffer address
        const bufferAddress = Module.getValue(bufferPointer, 'i32');
        
        // Read the content from bufferAddress
        const result = Module.UTF8ToString(bufferAddress);

        // Free memory
        Module._free(bufferAddress);
        Module._free(bufferPointer);

        output.textContent = result;
        FS.unlink(filename);
    };

    reader.readAsArrayBuffer(file);
});

Module.onRuntimeInitialized = async () => {
    // Emscripten runtime is ready, you can call C functions now
};
