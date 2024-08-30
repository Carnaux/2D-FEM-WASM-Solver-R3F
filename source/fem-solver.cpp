#include <stdio.h>
#include <vector>
#include <cmath>
#include <numeric>
#include <emscripten.h>
#include <emscripten/bind.h>

using namespace emscripten;

struct Element
{
    float start;
    float end;
    float length;
    float stiffness;
    std::vector<float> R;
};

class FEMSolver
{
public:
    FEMSolver(float _nNodes, float _nElements)
    {
        nNodes = _nNodes;
        nElements = _nElements;

        nodeInputData.resize(_nNodes, std::vector<float>(6.0, 0.0));
        nodeInputDataUnknowns.resize(_nNodes, std::vector<float>(6.0, 0.0));

        elementsInputData.resize(_nElements, std::vector<float>(4.0, 0.0));

        K.resize(_nNodes * 2, std::vector<float>(_nNodes * 2, 0.0));
    }

    void SetSizes(int _nNodes, int _nElements)
    {
        nNodes = _nNodes;
        nElements = _nElements;
    }

    void SetNodeInputData(uintptr_t data, int size)
    {
        float *casted_data = reinterpret_cast<float *>(data);
        for (int i = 0; i < size / 2; i += 6)
        {
            nodeInputData[i / 6][0] = casted_data[i];
            nodeInputData[i / 6][1] = casted_data[i + 1];
            nodeInputData[i / 6][2] = casted_data[i + 2];
            nodeInputData[i / 6][3] = casted_data[i + 3];
            nodeInputData[i / 6][4] = casted_data[i + 4];
            nodeInputData[i / 6][5] = casted_data[i + 5];

            int nextHalf = size / 2 + i;

            nodeInputDataUnknowns[i / 6][0] = casted_data[nextHalf];
            nodeInputDataUnknowns[i / 6][1] = casted_data[nextHalf + 1];
            nodeInputDataUnknowns[i / 6][2] = casted_data[nextHalf + 2];
            nodeInputDataUnknowns[i / 6][3] = casted_data[nextHalf + 3];
            nodeInputDataUnknowns[i / 6][4] = casted_data[nextHalf + 4];
            nodeInputDataUnknowns[i / 6][5] = casted_data[nextHalf + 5];
        }
    }

    void SetElementInputData(uintptr_t data, int size)
    {
        float *casted_data = reinterpret_cast<float *>(data);

        for (int i = 0; i < size; i += 4)
        {
            elementsInputData[i / 4][0] = casted_data[i];
            elementsInputData[i / 4][1] = casted_data[i + 1];
            elementsInputData[i / 4][2] = casted_data[i + 2];
            elementsInputData[i / 4][3] = casted_data[i + 3];
        };
    }

    void GetUnknowns()
    {
        for (int i = 0; i < nNodes; i++)
        {
            for (int j = 2; j < 6; j++)
            {
                // Get displacements X and Y
                if (j >= 2 && j <= 3)
                {
                    Uun.push_back(nodeInputDataUnknowns[i][j]);
                }
                // Get loads X and Y
                if (j >= 4 && j <= 5)
                {
                    Pun.push_back(nodeInputDataUnknowns[i][j]);
                }
            }
        }

        for (int i = 0; i < Uun.size(); i++)
        {
            if (Uun[i])
            {
                A.push_back(i);
            }
        }

        for (int i = 0; i < Pun.size(); i++)
        {
            if (Pun[i])
            {
                B.push_back(i);
            }
        }
    }

    void GetKnowns()
    {
        for (int i = 0; i < nNodes; i++)
        {
            for (int j = 2; j < 6; j++)
            {
                // Get displacements X and Y
                if (j >= 2 && j <= 3)
                {
                    if (!nodeInputDataUnknowns[i][j])
                    {
                        Uk.push_back(nodeInputData[i][j]);
                    }
                }
                // Get loads X and Y
                if (j >= 4 && j <= 5)
                {
                    if (!nodeInputDataUnknowns[i][j])
                    {
                        Pk.push_back(nodeInputData[i][j]);
                    }
                }
            }
        }
    }

    void ProcessData()
    {
        GetUnknowns();
        GetKnowns();

        for (int i = 0; i < nElements; i++)
        {
            ComputeElementProperties(elementsInputData[i]);
        };

        for (int i = 0; i < elements.size(); i++)
        {
            ComputeGlobalK(elements[i]);
        };

        KAA = Partition(A, A);
        KAB = Partition(A, B);
        KBA = Partition(B, A);
        KBB = Partition(B, B);
    }

    void ComputeElementProperties(std::vector<float> elementInput)
    {
        int start = elementInput[0];
        int end = elementInput[1];

        float x_coord_start = nodeInputData[start][0];
        float x_coord_end = nodeInputData[end][0];

        float y_coord_start = nodeInputData[start][1];
        float y_coord_end = nodeInputData[end][1];

        float deltaX = x_coord_end - x_coord_start;
        float deltaY = y_coord_end - y_coord_start;

        float length = sqrt(pow(deltaX, 2) + pow(deltaY, 2));
        float stiffness = elementInput[3] * elementInput[2] / length;

        float c = deltaX / length;
        float s = deltaY / length;

        std::vector<float> R{c * c, c * s, -c * c, -c * s, c * s, s * s, -c * s, -s * s, -c * c, -c * s, c * c, c * s, -c * s, -s * s, c * s, s * s};

        Element newEl;
        newEl.length = length;
        newEl.stiffness = stiffness;
        newEl.R = R;
        newEl.start = start;
        newEl.end = end;

        elements.push_back(newEl);
    }

    void ComputeGlobalK(Element element)
    {
        std::vector<std::vector<float>> tempK;
        tempK.resize(nNodes * 2, std::vector<float>(nNodes * 2, 0.0));

        int indicesListSize = nNodes * 2;
        std::vector<int> indicesList;
        for (int i = 0; i < indicesListSize; i++)
        {
            indicesList.push_back(i);
        }

        std::vector<std::vector<int>> indices2D;
        for (int i = 0; i < indicesListSize; i += 2)
        {
            indices2D.push_back(std::vector<int>{indicesList[i], indicesList[i + 1]});
        }

        std::vector<int> indicesFlat;
        for (int i = 0; i < indices2D.size(); i++)
        {

            if (i == element.start)
            {
                indicesFlat.push_back(indices2D[i][0]);
                indicesFlat.push_back(indices2D[i][1]);
            }
        }

        for (int i = 0; i < indices2D.size(); i++)
        {
            if (i == element.end)
            {
                indicesFlat.push_back(indices2D[i][0]);
                indicesFlat.push_back(indices2D[i][1]);
            }
        }

        for (int i = 0; i < indicesFlat.size(); i++)
        {
            for (int j = 0; j < indicesFlat.size(); j++)
            {
                int x = indicesFlat[i];
                int y = indicesFlat[j];
                tempK[x][y] = element.R[(i * 4) + j] * element.stiffness;
            }
        }

        for (int i = 0; i < nNodes * 2; i++)
        {
            for (int j = 0; j < nNodes * 2; j++)
            {
                K[i][j] += tempK[i][j];
            }
        }
    }

    std::vector<std::vector<float>> Partition(std::vector<int> X, std::vector<int> Y)
    {
        std::vector<std::vector<float>> out;
        out.resize(X.size(), std::vector<float>(Y.size(), 0.0));
        for (int i = 0; i < X.size(); i++)
        {
            for (int j = 0; j < Y.size(); j++)
            {
                out[i][j] = K[X[i]][Y[j]];
            }
        }

        return out;
    }

    void Solve()
    {
        // Solve Displacements
        std::vector<std::vector<float>> KAB_Uk = Multiply(KAB, Uk);
        printf("Size KAB_Uk: %i \n", KAB_Uk.size());
        // UA = np.dot(np.linalg.inv(KAA), (PA - np.dot(KAB, UB)))

        // PB = np.dot(KBA, UA) + np.dot(KBB, UB)
    }

    std::vector<std::vector<float>> Multiply(std::vector<std::vector<float>> a, std::vector<float> b)
    {
        int n = a.size();
        int m = a[0].size();
        int p = b.size();

        std::vector<std::vector<float>> c(n, std::vector<float>(p, 0));
        for (int j = 0; j < p; ++j)
        {
            for (int k = 0; k < m; ++k)
            {
                for (int i = 0; i < n; ++i)
                {
                    c[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return c;
    }

private:
    int nNodes;
    int nElements;
    std::vector<std::vector<float>> nodeInputData;
    std::vector<std::vector<float>> nodeInputDataUnknowns;
    std::vector<std::vector<float>> elementsInputData;
    std::vector<std::vector<float>> K;
    std::vector<Element> elements;

    std::vector<float> Uun;
    std::vector<float> Pun;
    std::vector<float> Uk;
    std::vector<float> Pk;
    std::vector<int> A;
    std::vector<int> B;

    std::vector<std::vector<float>> KAA;
    std::vector<std::vector<float>> KAB;
    std::vector<std::vector<float>> KBA;
    std::vector<std::vector<float>> KBB;
};

// Binding code
EMSCRIPTEN_BINDINGS(FemSolver)
{
    class_<FEMSolver>("FEMSolver")
        .constructor<int, int>()
        .function("SetSizes", &FEMSolver::SetSizes)
        .function("SetNodeInputData", &FEMSolver::SetNodeInputData)
        .function("SetElementInputData", &FEMSolver::SetElementInputData)

        .function("ProcessData", &FEMSolver::ProcessData);
}
