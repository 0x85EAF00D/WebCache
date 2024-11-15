// utils/pathUtils.js
class PathUtils {
  static normalizePath(filePath) {
    return path.normalize(filePath);
  }

  static resolvePath(filePath) {
    return path.resolve(filePath);
  }

  static joinPaths(...paths) {
    return path.join(...paths);
  }

  static getDirectoryName(filePath) {
    return path.dirname(filePath);
  }

  static getFileName(filePath) {
    return path.basename(filePath);
  }
}

module.exports = PathUtils;
