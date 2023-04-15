#include <fstream>
#include <iostream>
#include <vector>
#include <regex>
#include <string>
#define _SILENCE_EXPERIMENTAL_FILESYSTEM_DEPRECATION_WARNING
#include <sstream>
#include <cstdint>
#include <filesystem>
#include <map>
#include <iterator>
#include <algorithm>
#include <experimental/filesystem>


namespace fs = std::experimental::filesystem;


class RmsMetaData {
public:
    int identification;
    int version;
    int coding;
    int fileSize;
    int fileCount;
    int titleSize;
    std::string title;
    std::vector<std::string> fileUrlList;
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
};

class RmsAnalyserImpl {
private:
    std::string rmsPath;
    std::string analyserPath;

public:
    RmsAnalyserImpl(const std::string &rmsPath, const std::string &analyserPath)
        : rmsPath(rmsPath), analyserPath(analyserPath) {}

    RmsMetaData unzipRms() {
        return unzipRms(nullptr);
    }

    RmsMetaData unzipRms(void *param) {
        std::ifstream fileIn;
        RmsMetaData rmsEntity;
        try {
            fileIn.open(rmsPath, std::ios::binary);

            uint8_t b;
            int identification = bytesToInt(getByte(1, fileIn));
            //int identification = getByte(1, fileIn, b);

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
            for (int i = 0; i < fileCount; i++) {
                int fileType = bytesToInt(getByte(1, fileIn));

                int fileNameSize = bytesToInt(getByte(1, fileIn));

                std::string fileName = getByteAsString(fileNameSize, fileIn);

                int fileContentSize = bytesToInt(getByte(4, fileIn));

                std::vector<uint8_t> fileContent = getBytes(fileContentSize, fileIn);

                fs::path dir(analyserPath);
               
                if (!fs::exists(dir)) {
                    fs::create_directories(dir);
                }

                fs::path fileout = dir / fileName;
                listUrl.push_back(fileout.string());
                if (!fs::exists(fileout)) {
                    std::ofstream createFile(fileout.string());
                    createFile.close();
                }
                if (fileType == 2 && fileContentSize < 10) {
                    std::string content(fileContent.begin(), fileContent.end());
                    if (content.find("#P_") != std::string::npos) {
                        // Generate content
                        content = replaceParam(content);
                        // Background image
                        // ImageUtil.buildTextImage(content, param.getBackgroundFile(), fileout);
                        // Parameter mapping
                        fileParamMap.insert(std::make_pair(content, fileName));
                        continue;
                    }
                }
                writeFileContent(fileout.string(), fileContent);
            }
            rmsEntity.setFileParamMap(fileParamMap);
            rmsEntity.setFileUrlList(listUrl);
        }
        catch (const std::exception &e) {
            rmsEntity = RmsMetaData();
            throw std::runtime_error(std::string("Failed to parse RMS file: ") + e.what());
        }
        return rmsEntity;
    }

    int getByte(int size, std::ifstream &fileIn, uint8_t &b) {
        fileIn.read(reinterpret_cast<char *>(&b), size);
        return static_cast<int>(b);
    }

    std::vector<uint8_t> getByte(int size, std::ifstream& fileInputStream) {
        std::vector<uint8_t> b(size);
        fileInputStream.read(reinterpret_cast<char*>(b.data()), size);
        return b;
    }

    std::string getByteAsString(int size, std::ifstream &fileIn) {
        std::vector<char> chars(size);
        fileIn.read(chars.data(), size);
        return std::string(chars.begin(), chars.end());
    }

    std::vector<uint8_t> getBytes(int size, std::ifstream &fileIn) {
        std::vector<uint8_t> bytes(size);
        fileIn.read(reinterpret_cast<char *>(bytes.data()), size);
        return bytes;
    }


    void writeFileContent(const std::string &filePath, const std::vector<uint8_t> &content) {
        std::ofstream outFile(filePath, std::ios::binary);
        outFile.write(reinterpret_cast<const char *>(content.data()), content.size());
        outFile.close();
    }


    //int identification = bytesToInt(getByte(1, fileInputStream));
    int bytesToInt(const std::vector<uint8_t>& bytes) {
        int result = 0;
        for (const uint8_t byte : bytes) {
            result = (result << 8) | byte;
        }
        return result;
    }


    std::string replaceParam(const std::string &str) {
        std::regex regex("#P_\\d+#");
        auto words_begin = std::sregex_iterator(str.begin(), str.end(), regex);
        auto words_end = std::sregex_iterator();
        std::string result = str;
        for (std::sregex_iterator it = words_begin; it != words_end; ++it) {
            std::smatch match = *it;
            std::string no = match.str().substr(3, match.str().length() - 4);
            result.replace(match.position(), match.length(), "{#参数" + no + "#}");
        }
        return result;
    }
};


void testRmsAnalyserImpl() {
    // Change these paths to the appropriate input RMS file and output folderF:\workspace\github\rms-tools\app.js
    std::string inputRmsFilePath = "E:/oss_move_file/rms/file/202303301009/856079168103589461_1680142172045.rms";
    std::string outputFolderPath = "F:/workspace/github/rms-tools/rms";

    try {
        RmsAnalyserImpl analyser(inputRmsFilePath, outputFolderPath);
        RmsMetaData metaData = analyser.unzipRms();

        std::cout << "Identification: " << metaData.identification << std::endl;
        std::cout << "Version: " << metaData.version << std::endl;
        std::cout << "Coding: " << metaData.coding << std::endl;
        std::cout << "File Size: " << metaData.fileSize << std::endl;
        std::cout << "File Count: " << metaData.fileCount << std::endl;
        std::cout << "Title Size: " << metaData.titleSize << std::endl;
        std::cout << "Title: " << metaData.title << std::endl;

        std::cout << "File URLs:" << std::endl;
        for (const std::string &url : metaData.fileUrlList) {
            std::cout << "  " << url << std::endl;
        }

        std::cout << "File Parameter Map:" << std::endl;
        for (const auto &entry : metaData.fileParamMap) {
            std::cout << "  " << entry.first << ": " << entry.second << std::endl;
        }
    }
    catch (const std::exception &e) {
        std::cerr << "Error: " << e.what() << std::endl;
    }
}

int main() {
    testRmsAnalyserImpl();
    return 0;
}