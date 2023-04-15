#include <stdio.h>
#include <stdlib.h>
#include <string.h>
// #include <emscripten/emscripten.h>

// EMSCRIPTEN_KEEPALIVE
int read_file(const char *filename, char **buffer) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        return -1;
    }
    //这段代码的作用是将文件指针移动到文件的末尾，
    //然后使用ftell()函数获取文件的长度，最后将文件指针移动回文件的开头
    fseek(file, 0, SEEK_END);
    long length = ftell(file);
    fseek(file, 0, SEEK_SET);

    *buffer = (char *)malloc(length + 1);
    if (*buffer) {
        fread(*buffer, 1, length, file);
        (*buffer)[length] = '\0';
    }

    fclose(file);
    return length;
}



int main(int argc, char **argv) {
    char * file_path = "F:/workspace/github/rms-tools/test.txt";
    char *buffer;
    int length = read_file(file_path, &buffer);
    if (length != -1) {
        printf("%s\n", buffer);
        free(buffer);
    } else {
        printf("Read file failed.\n");
    }

    return 0;
}