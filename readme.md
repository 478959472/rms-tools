## 使用JavaScript、webassembly、c语言在网页读取文本文件，并展示读取内容到页面

编译命令如下：
```shell
emcc file_reader.c -s WASM=1 -s EXPORTED_FUNCTIONS="['_read_file', '_malloc', '_free']" -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'UTF8ToString']" -o file_reader.js
```