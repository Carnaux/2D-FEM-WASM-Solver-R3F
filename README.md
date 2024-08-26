# React-Wasm

Quick workspace to work with WASM(Emscripten) and React

Tested on macOS Sonoma 14.5

# Requisites

- Emscripten
- PKG Config
- Python3

# Folders

- build
  - Holds the build from Emscripten.
- source
  - Holds the C++ source files.
- web
  - Holds a create-react-app application that loads the built WASM files.

# Submodules

# Configuration

1. Change the "em_source" Emscripten path in package.json. This is a util function to make sure the terminal used has all the Emscripten variables/paths.

2. Change the "EMSCRIPTEN_ROOT" path in makem.js.

# Build WASM

- Run `yarn/npm run build` to start the build process.
- Copy the contents of the "build" folder to `web/src/wasm`
- Make sure the Emscripten build files have the same name while importing in App.tsx
