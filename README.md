# Bismuth Build Tool
A simple build tool for Bismuth Engine and related programs.

## Installation
```
    npm install -g git+https://github.com/BismuthEngine/BismuthBuildTool.git
```

## Building
```py
    # After downloading source code, inside of source root directory
    # Compile Typescript
    npm run build
    # Install globally and create symlink
    npm install -g ./
```

## Usage
```
bismuth-build-tool
    --compile <Path> - Compile standalone code
    --project <Path> - Compile Bismuth Engine project

    --platform <Platform> - Specifies target platform
    --arch <Architecture> - Specifies target architecture

    --debug - Disable optimisations and produce .pdb files
    --editor - uses Editor.rules.js files, instead of just .rules.js
```