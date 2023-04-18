#define _SILENCE_EXPERIMENTAL_FILESYSTEM_DEPRECATION_WARNING
#define _CRT_SECURE_NO_WARNINGS
#include <fstream>
#include <iostream>
#include <vector>
#include <regex>
#include <string>
#include <sstream>
#include <cstdint>
#include <filesystem>
#include <map>
#include <iterator>
#include <algorithm>
#include <filesystem>
 #include <emscripten/emscripten.h>

namespace fs = std::filesystem;

class RmsMetaData
{
public:
    int identification;
    int version;
    int coding;
    int fileSize;
    int fileCount;
    int titleSize;
    std::string title;
    std::vector<std::string> fileUrlList;
    std::map<std::string, std::vector<uint8_t>> fileContentMap;
    std::map<std::string, std::string> fileParamMap;

    void setIdentification(int identification) { this->identification = identification; }
    void setVersion(int version) { this->version = version; }
    void setCoding(int coding) { this->coding = coding; }
    void setFileSize(int fileSize) { this->fileSize = fileSize; }
    void setFileCount(int fileCount) { this->fileCount = fileCount; }
    void setTitleSize(int titleSize) { this->titleSize = titleSize; }
    void setTitle(const std::string &title) { this->title = title; }
    void setFileUrlList(const std::vector<std::string> &fileUrlList) { this->fileUrlList = fileUrlList; }
    void setFileParamMap(const std::map<std::string, std::string> &fileParamMap) { this->fileParamMap = fileParamMap; }
    void setFileContentMap(std::map<std::string, std::vector<uint8_t>> &fileContentMap) { this->fileContentMap = fileContentMap; }
};

class RmsAnalyserImpl
{
private:
    std::string rmsPath;
    std::string analyserPath;

public:
    RmsAnalyserImpl(const std::string &rmsPath)
        : rmsPath(rmsPath) {}

    RmsMetaData unzipRms()
    {
        return unzipRms(nullptr);
    }

    RmsMetaData unzipRms(void *param)
    {
        std::ifstream fileIn;
        RmsMetaData rmsEntity;
        try
        {
            fileIn.open(rmsPath, std::ios::binary);

            uint8_t b = 0;
            int identification = bytesToInt(getByte(1, fileIn));
            // int identification = getByte(1, fileIn, b);

            rmsEntity.setIdentification(identification);

            int version = bytesToInt(getByte(1, fileIn));
            rmsEntity.setVersion(version);

            int coding = bytesToInt(getByte(1, fileIn));
            rmsEntity.setCoding(coding);

            int fileSize = bytesToInt(getByte(4, fileIn));
            rmsEntity.setFileSize(fileSize);

            int fileCount = bytesToInt(getByte(2, fileIn));
            rmsEntity.setFileCount(fileCount);

            int titleSize = bytesToInt(getByte(1, fileIn));
            rmsEntity.setTitleSize(titleSize);

            std::string title = getByteAsString(titleSize, fileIn);
            rmsEntity.setTitle(title);
            std::vector<std::string> listUrl;
            std::map<std::string, std::string> fileParamMap;
            std::map<std::string, std::vector<uint8_t>> fileContentMap;
            for (int i = 0; i < fileCount; i++)
            {
                int fileType = bytesToInt(getByte(1, fileIn));

                int fileNameSize = bytesToInt(getByte(1, fileIn));

                std::string fileName = getByteAsString(fileNameSize, fileIn);

                int fileContentSize = bytesToInt(getByte(4, fileIn));

                std::vector<uint8_t> fileContent = getBytes(fileContentSize, fileIn);

                listUrl.push_back(fileName);
                if (fileType == 2 && fileContentSize < 10)
                {
                    std::string content(fileContent.begin(), fileContent.end());
                    if (content.find("#P_") != std::string::npos)
                    {
                        // Generate content
                        content = replaceParam(content);
                        // Background image
                        // ImageUtil.buildTextImage(content, param.getBackgroundFile(), fileout);
                        // Parameter mapping
                        fileParamMap.insert(std::make_pair(content, fileName));
                        continue;
                    }
                }
                fileContentMap.insert(std::make_pair(fileName, fileContent));
                writeFileContent(fileName, fileContent);
            }
            rmsEntity.setFileContentMap(fileContentMap);
            rmsEntity.setFileParamMap(fileParamMap);
            rmsEntity.setFileUrlList(listUrl);
        }
        catch (const std::exception &e)
        {
            rmsEntity = RmsMetaData();
            throw std::runtime_error(std::string("Failed to parse RMS file: ") + e.what());
        }
        return rmsEntity;
    }

    int getByte(int size, std::ifstream &fileIn, uint8_t &b)
    {
        fileIn.read(reinterpret_cast<char *>(&b), size);
        return static_cast<int>(b);
    }

    std::vector<uint8_t> getByte(int size, std::ifstream &fileInputStream)
    {
        std::vector<uint8_t> b(size);
        fileInputStream.read(reinterpret_cast<char *>(b.data()), size);
        return b;
    }

    std::string getByteAsString(int size, std::ifstream &fileIn)
    {
        std::vector<char> chars(size);
        fileIn.read(chars.data(), size);
        return std::string(chars.begin(), chars.end());
    }

    std::vector<uint8_t> getBytes(int size, std::ifstream &fileIn)
    {
        std::vector<uint8_t> bytes(size);
        fileIn.read(reinterpret_cast<char *>(bytes.data()), size);
        return bytes;
    }

    void writeFileContent(const std::string &filePath, const std::vector<uint8_t> &content)
    {
        std::ofstream outFile(filePath, std::ios::binary);
        outFile.write(reinterpret_cast<const char *>(content.data()), content.size());
        outFile.close();
    }

    // int identification = bytesToInt(getByte(1, fileInputStream));
    int bytesToInt(const std::vector<uint8_t> &bytes)
    {
        int result = 0;
        for (const uint8_t byte : bytes)
        {
            result = (result << 8) | byte;
        }
        return result;
    }

    std::string replaceParam(const std::string &str)
    {
        std::regex regex("#P_\\d+#");
        auto words_begin = std::sregex_iterator(str.begin(), str.end(), regex);
        auto words_end = std::sregex_iterator();
        std::string result = str;
        for (std::sregex_iterator it = words_begin; it != words_end; ++it)
        {
            std::smatch match = *it;
            std::string no = match.str().substr(3, match.str().length() - 4);
            result.replace(match.position(), match.length(), "{#参数" + no + "#}");
        }
        return result;
    }
};
char** convertToCStringArray(const std::vector<std::string>& strings) {
  char** cStrings = new char*[strings.size() + 1];  // Allocate memory for array of pointers
  for (int i = 0; i < strings.size(); i++) {
    cStrings[i] = new char[strings[i].length() + 1];  // Allocate memory for C-style string
    strcpy(cStrings[i], strings[i].c_str());  // Copy string to C-style string
  }
  cStrings[strings.size()] = NULL;  // Add null terminator
  return cStrings;
}
extern "C"
{
    EMSCRIPTEN_KEEPALIVE
    uintptr_t unzipRmsFile(const char* inputRmsFilePath)
    {
        try
        {
       
            std::cout << "inputRmsFilePath: " << inputRmsFilePath  << std::endl;
            RmsAnalyserImpl analyser(inputRmsFilePath);
            RmsMetaData metaData = analyser.unzipRms();
            // std::cout << "Identification: " << metaData.identification << std::endl;
            // std::cout << "Version: " << metaData.version << std::endl;
            // std::cout << "Coding: " << metaData.coding << std::endl;
            // std::cout << "File Size: " << metaData.fileSize << std::endl;
            // std::cout << "File Count: " << metaData.fileCount << std::endl;
            // std::cout << "Title Size: " << metaData.titleSize << std::endl;
            // std::cout << "Title: " << metaData.title << std::endl;

            std::cout << "File URLs:" << std::endl;
            for (const std::string &url : metaData.fileUrlList)
            {
                std::cout << " 文件名： " << url << " 大小:   " << metaData.fileContentMap.at(url).size() << std::endl;
            }

            std::cout << "File Parameter Map:" << std::endl;
            for (const auto &entry : metaData.fileParamMap)
            {
                std::cout << "  " << entry.first << ": " << entry.second << std::endl;
            }
            char** cStrings = convertToCStringArray(metaData.fileUrlList);

            return reinterpret_cast<uintptr_t>(cStrings);;
        }
        catch (const std::exception &e)
        {
            std::cerr << "Error: " << e.what() << std::endl;
        }
        return NULL;
    }

    //  EMSCRIPTEN_BINDINGS(my_module) {
    //     //  emscripten::register_vector<std::string>("VectorString");
    //      function("unzipRmsFile", &unzipRmsFile);
    //  }
}

//  int main()
//  {
//     system("chcp 65001");
//     const char* inputRmsFilePath = "E:/oss_move_file/rms/file/202303301009/856079168103589461_1680142172045.rms";
//     unzipRmsFile(inputRmsFilePath);
//     return 0;
//  }