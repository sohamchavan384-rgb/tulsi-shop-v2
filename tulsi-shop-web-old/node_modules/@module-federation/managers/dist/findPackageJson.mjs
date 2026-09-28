import node_fs from "node:fs";
import node_path from "node:path";





function findPackageJson(startPath) {
    let currentPath = node_path.resolve(startPath);
    while(true){
        const packageJsonPath = node_path.join(currentPath, 'package.json');
        if (node_fs.existsSync(packageJsonPath)) {
            return packageJsonPath;
        }
        const parentPath = node_path.dirname(currentPath);
        if (parentPath === currentPath) {
            return undefined;
        }
        currentPath = parentPath;
    }
}

export { findPackageJson };
