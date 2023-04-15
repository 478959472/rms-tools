#define _CRT_SECURE_NO_WARNINGS
#include <iostream>
#include <fstream>
#include <sstream>
#include <cstring>
#include <string>
#include <emscripten/emscripten.h>


extern "C" {
    EMSCRIPTEN_KEEPALIVE
    char* read_file(const char* file_path) {
        std::ifstream file(file_path, std::ios::binary | std::ios::ate);
        if (!file.is_open()) {
            std::cerr << "Error opening file: " << file_path << std::endl;
            return nullptr;
        }

        std::streamsize size = file.tellg(); // Get the file size
        file.seekg(0, std::ios::beg);

        char* buffer = new char[size + 1]; // Allocate buffer dynamically
        if (file.read(buffer, size)) {
            buffer[size] = '\0'; // Ensure null-termination
            file.close();
            return buffer;
        } else {
            std::cerr << "Error reading file: " << file_path << std::endl;
            file.close();
            delete[] buffer;
            return nullptr;
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void free_buffer(char* buffer) {
        delete[] buffer;
    }
}

// int main()
// {
//     system("chcp 65001");
//     // 用作测试的文本文件路径
//     const char* file_path = "F:/workspace/github/rms-tools/test.txt";

//     // Pass buffer size to read_file function
//     char* buffer = read_file(file_path);

//     if (sizeof(buffer) > 0) {
//         std::cout << "File content:\n" << buffer << std::endl;
//         free_buffer(buffer);
//     }
//     else {
//         std::cerr << "Failed to read file." << std::endl;
//     }
//     return 0;
// }
