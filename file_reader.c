#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <emscripten/emscripten.h>

EMSCRIPTEN_KEEPALIVE
int read_file(const char *filename, char **buffer) {
    FILE *file = fopen(filename, "r");
    if (!file) {
        return -1;
    }

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