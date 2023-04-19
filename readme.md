## 使用JavaScript、webassembly、c语言在网页读取文本文件，并展示读取内容到页面


编译命令如下：
```shell
F:\workspace\webAssembly\emsdk\emsdk_env.bat

emcc file_reader.c -s WASM=1 -s EXPORTED_FUNCTIONS="['_read_file', '_malloc', '_free']" -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'UTF8ToString']" -o file_reader.js

emcc file_reader.cpp -s WASM=1 -s EXPORTED_FUNCTIONS="['_read_file','_free_buffer']" -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'UTF8ToString']" -o file_reader.js

emcc rms_file_reader.cpp -s WASM=1 -s WASM=1 -s EXPORTED_FUNCTIONS="['_unzipRmsFile','_readFile','_malloc','_free']" -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'UTF8ToString']" -o rms_file_reader.js
```