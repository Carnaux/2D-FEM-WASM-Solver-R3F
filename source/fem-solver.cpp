#include <stdio.h>
#include <vector>
#include <cmath>
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

struct Element {
    float length;
    float stiffness;
    std::vector<float> R;
};

class FEMSolver {
    public:
        FEMSolver(float _nNodes, float _nElements){
            nNodes = _nNodes;
            nElements = _nElements;

            nodeInputData.resize(_nNodes, std::vector<float>(6.0, 0.0));
            nodeInputDataUnknowns.resize(_nNodes, std::vector<float>(6.0, 0.0));

            elementsInputData.resize(_nElements, std::vector<float>(4.0, 0.0));
        }

        void SetSizes(int _nNodes, int _nElements){
            nNodes = _nNodes;
            nElements = _nElements;
        }

        void SetNodeInputData(uintptr_t data, int size){
            float* casted_data = reinterpret_cast<float*>(data);
            for(int i = 0; i < size/2; i+=6){
                nodeInputData[i/6][0] = casted_data[i];
                nodeInputData[i/6][1] = casted_data[i+1];
                nodeInputData[i/6][2] = casted_data[i+2];
                nodeInputData[i/6][3] = casted_data[i+3];
                nodeInputData[i/6][4] = casted_data[i+4];
                nodeInputData[i/6][5] = casted_data[i+5];
                
                int nextHalf = size/2 + i;

                nodeInputDataUnknowns[i/6][0] = casted_data[nextHalf];
                nodeInputDataUnknowns[i/6][1] = casted_data[nextHalf+1];
                nodeInputDataUnknowns[i/6][2] = casted_data[nextHalf+2];
                nodeInputDataUnknowns[i/6][3] = casted_data[nextHalf+3];
                nodeInputDataUnknowns[i/6][4] = casted_data[nextHalf+4];
                nodeInputDataUnknowns[i/6][5] = casted_data[nextHalf+5];
            }
        }

        void SetElementInputData(uintptr_t data, int size){
            float* casted_data = reinterpret_cast<float*>(data);

            for(int i = 0; i < size; i+=4){
                elementsInputData[i/4][0] = casted_data[i];
                elementsInputData[i/4][1] = casted_data[i+1];
                elementsInputData[i/4][2] = casted_data[i+2];
                elementsInputData[i/4][3] = casted_data[i+3];
            };
        }

        void ProcessData(){
            for(int i = 0; i < nElements; i++){
                ComputeElementProperties(elementsInputData[i]);
            };
        }

        void ComputeElementProperties(std::vector<float> elementInput){
            printf("Computing: \n");
            int start = elementInput[0];
            int end = elementInput[1];
            printf("Start: %i, End: %i \n", start, end);

            float x_coord_start = nodeInputData[start][0];
            float x_coord_end = nodeInputData[end][0];
            printf("X Start: %f, X End: %f \n", x_coord_start, x_coord_end);

            float y_coord_start = nodeInputData[start][1];
            float y_coord_end = nodeInputData[end][1];
            printf("Y Start: %f, Y End: %f \n", y_coord_start, y_coord_end);

            float deltaX = x_coord_end - x_coord_start;
            float deltaY = y_coord_end - y_coord_start;
            printf("deltaX: %f, deltaY: %f \n", deltaX, deltaY);

            float length = sqrt(pow(deltaX, 2) + pow(deltaY, 2));
            printf("2: %f, 3: %f \n", elementInput[2],  elementInput[3]);
            float stiffness = elementInput[3] * elementInput[2] / length;

            float c = deltaX / length;
            float s = deltaY / length;

            std::vector<float> R{c*c, c*s, -c*c, -c*s, c*s, s*s, -c*s, -s*s, -c*c, -c*s, c*c, c*s, -c*s, -s*s, c*s, s*s};

            Element newEl;
            newEl.length = length;
            newEl.stiffness = stiffness;
            newEl.R = R;

            printf("New Element: \n");
            printf("Length: %f \n", newEl.length);
            printf("Stiffness: %f \n", newEl.stiffness);
            printf("R: %zu\n", newEl.R.size());
           
            elements.push_back(newEl);
        }

        void Solve(){

        }

    private:
        int nNodes;
        int nElements;
        std::vector<std::vector<float>> nodeInputData;
        std::vector<std::vector<float>> nodeInputDataUnknowns;
        std::vector<std::vector<float>> elementsInputData;

        std::vector<Element> elements;
};

// Binding code
EMSCRIPTEN_BINDINGS(FemSolver) {
  class_<FEMSolver>("FEMSolver")
    .constructor<int, int>()
    .function("SetSizes", &FEMSolver::SetSizes)
    .function("SetNodeInputData", &FEMSolver::SetNodeInputData)
    .function("SetElementInputData", &FEMSolver::SetElementInputData)

    .function("Compute", &FEMSolver::Compute)
    ;
}
