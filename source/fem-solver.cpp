#include <stdio.h>
#include <vector>
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

class FEMSolver {
    public:
        FEMSolver(int x, std::string y)
            : x(x)
            , y(y)
        {}

        void incrementX() {
            ++x;
        }

        int getX() const { return x; }
        void setX(int x_) { x = x_; }

        static std::string getStringFromInstance(const FEMSolver& instance) {
            return instance.y;
        }

    private:
        int x;
        std::string y;
};

// Binding code
EMSCRIPTEN_BINDINGS(FemSolver) {
  class_<FEMSolver>("FEMSolver")
    .constructor<int, std::string>()
    .function("incrementX", &FEMSolver::incrementX)
    .property("x", &FEMSolver::getX, &FEMSolver::setX)
    .property("x_readonly", &FEMSolver::getX)
    .class_function("getStringFromInstance", &FEMSolver::getStringFromInstance)
    ;
}
