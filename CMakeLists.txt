cmake_minimum_required( VERSION 3.5 )
project( VISUAL_ODOMETRY )

set( CMAKE_CXX_STANDARD 11 )

if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE Release)
endif(NOT CMAKE_BUILD_TYPE)

set( CMAKE_CXX_FLAGS_RELEASE "-g -Wall -O3" )

set( JS ${CMAKE_SOURCE_DIR}/dist )
file( MAKE_DIRECTORY ${JS} )
set( CMAKE_RUNTIME_OUTPUT_DIRECTORY ${JS} )

set( SRC_DIR source/ )

include_directories( ${SRC_DIR} )
file( GLOB WASM_SRCS ${SRC_DIR}/fem-solver.cpp )

add_executable( fem-solver ${WASM_SRCS} )
target_link_libraries( fem-solver ${opencv_js} )

set_target_properties( fem-solver PROPERTIES LINK_FLAGS "-lembind -s EXPORT_NAME='FEMSolver' -s USE_ZLIB=1 -s MODULARIZE=1 -s ENVIRONMENT='web' -s EXPORT_ES6=1 -s ALLOW_MEMORY_GROWTH=1 -s EXPORTED_FUNCTIONS='['_malloc', '_free']' -s EXPORTED_RUNTIME_METHODS='['ccall', 'cwrap', 'FS', 'stringToUTF8']' -s WASM=1 " )
