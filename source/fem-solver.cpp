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
        N = _nNodes;

        Results.resize(_nNodes, std::vector<double>(6.0, 0.0));
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

        for (int i = 0; i < Uun.size(); i++)
        {
            if (!Uun[i])
            {
                Ak.push_back(i);
            }
        }

        for (int i = 0; i < Pun.size(); i++)
        {
            if (!Pun[i])
            {
                Bk.push_back(i);
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

    std::vector<std::vector<double>> Partition(std::vector<int> X, std::vector<int> Y)
    {
        std::vector<std::vector<double>> out;
        out.resize(X.size(), std::vector<double>(Y.size(), 0.0));
        for (int i = 0; i < X.size(); i++)
        {
            for (int j = 0; j < Y.size(); j++)
            {
                out[i][j] = K[X[i]][Y[j]];
            }
        }

        return out;
    }

    uintptr_t Solve()
    {
        // printMatrixFloat("input data", nodeInputData);
        // printMatrixFloat("unknowns data", nodeInputDataUnknowns);

        // Solve Displacements
        std::vector<double> KAB_Uk = SumProduct(KAB, Uk);
        // printVector("KAB_Uk", KAB_Uk);

        std::vector<double> Diff = DiffVectors(Pk, KAB_Uk);
        // printVector("Diff", Diff);

        std::vector<std::vector<double>> invKAA(N, std::vector<double>(N));
        inverse(KAA, invKAA);
        // printMatrix("invKAA", invKAA);

        UA = SumProduct(invKAA, Diff);
        // printVector("UA", UA);
        // printMatrix("KBA", KBA);

        std::vector<double> KBB_Uk = SumProduct(KBB, Uk);
        std::vector<double> KBA_UA = SumProductFlip(KBA, UA);
        // printVector("KBB_Uk", KBB_Uk);
        // printVector("KBA_UA", KBA_UA);

        PB = SumVectors(KBA_UA, KBB_Uk);
        // printVector("SUM", PB);

        // printVector("Uk", Uk);
        // printVector("Pk", Pk);
        // printVector("Uun", Uun);
        // printVector("Pun", Pun);

        // printVectorInt("A", A);
        // printVectorInt("B", B);
        // printVectorInt("Ak", Ak);
        // printVectorInt("Bk", Bk);

        std::vector<double> SolvedDisplacements(Uun.size(), 0);
        std::vector<double> SolvedLoads(Pun.size(), 0);

        for (int i = 0; i < Uk.size(); ++i)
        {
            SolvedDisplacements[Ak[i]] = Uk[i];
        }
        for (int i = 0; i < A.size(); ++i)
        {
            SolvedDisplacements[A[i]] = UA[i];
        }

        for (int i = 0; i < Pk.size(); ++i)
        {
            SolvedLoads[Bk[i]] = Pk[i];
        }
        for (int i = 0; i < B.size(); ++i)
        {
            SolvedLoads[B[i]] = PB[i];
        }

        // printVector("Solved Displacements", SolvedDisplacements);
        // printVector("Solved Loads", SolvedLoads);

        std::vector<float> resultsFlat(nNodes * 6, 0);

        for (int i = 0; i < nNodes; ++i)
        {
            Results[i][2] = SolvedDisplacements[(i * 2)];
            Results[i][3] = SolvedDisplacements[(i * 2 + 1)];

            Results[i][4] = SolvedLoads[(i * 2)];
            Results[i][5] = SolvedLoads[(i * 2 + 1)];

            for (int j = 0; j < 6; ++j)
            {
                if (!nodeInputDataUnknowns[i][j])
                {
                    Results[i][j] = nodeInputData[i][j];
                }

                resultsFlat[(i * 6) + j] = Results[i][j];
            }
        }

        // printVectorFloat("Results flat", resultsFlat);
        // printMatrix("\nResults", Results);

        auto a = uintptr_t(&resultsFlat[0]);
        return a;
    }

    // C++ version of np.dot in the case of "N-D array and b is a 1-D array"
    std::vector<double> SumProduct(std::vector<std::vector<double>> a, std::vector<double> b)
    {
        int n = a.size();
        int m = a[0].size();
        int p = b.size();

        std::vector<double> c(n, 0);
        for (int i = 0; i < p; ++i)
        {
            for (int j = 0; j < m; ++j)
            {
                c[i] += a[j][i] * b[j];
            }
        }

        return c;
    }

    std::vector<double> SumProductFlip(std::vector<std::vector<double>> a, std::vector<double> b)
    {
        int n = a.size();
        int m = a[0].size();
        int p = b.size();

        std::vector<double> c(n, 0);
        for (int i = 0; i < p; ++i)
        {
            for (int j = 0; j < m; ++j)
            {
                c[i] += a[i][j] * b[j];
            }
        }

        return c;
    }

    std::vector<double> DiffVectors(std::vector<double> a, std::vector<double> b)
    {
        std::vector<double> diff(a.size(), 0);
        for (int i = 0; i < a.size(); i++)
        {
            diff[i] = a[i] - b[i];
        }

        return diff;
    }

    std::vector<double> SumVectors(std::vector<double> a, std::vector<double> b)
    {
        std::vector<double> sum(a.size(), 0);
        for (int i = 0; i < a.size(); i++)
        {
            sum[i] = a[i] + b[i];
        }

        return sum;
    }

    void getCofactor(const std::vector<std::vector<double>> &A, std::vector<std::vector<double>> &temp, int p, int q, int n)
    {
        int i = 0, j = 0;

        // Looping for each element of the matrix
        for (int row = 0; row < n; row++)
        {
            for (int col = 0; col < n; col++)
            {
                // Copying into temporary matrix only those
                // element which are not in given row and column
                if (row != p && col != q)
                {
                    temp[i][j++] = A[row][col];

                    // Row is filled, so increase row index and
                    // reset col index
                    if (j == n - 1)
                    {
                        j = 0;
                        i++;
                    }
                }
            }
        }
    }

    float determinant(const std::vector<std::vector<double>> &A, int n)
    {
        float D = 0.0; // Initialize result

        // Base case : if matrix contains single element
        if (n == 1)
            return A[0][0];

        std::vector<std::vector<double>> temp(
            N, std::vector<double>(N)); // To store cofactors

        int sign = 1; // To store sign multiplier

        // Iterate for each element of first row
        for (int f = 0; f < n; f++)
        {
            // Getting Cofactor of A[0][f]
            getCofactor(A, temp, 0, f, n);
            D += sign * A[0][f] * determinant(temp, n - 1);

            // terms are to be added with alternate sign
            sign = -sign;
        }

        // printf("determinant: %f\n", D);

        return D;
    }

    void adjoint(const std::vector<std::vector<double>> &A, std::vector<std::vector<double>> &adj)
    {
        if (N == 1)
        {
            adj[0][0] = 1;
            return;
        }

        // temp is used to store cofactors of A[][]
        int sign = 1;
        std::vector<std::vector<double>> temp(N, std::vector<double>(N));

        for (int i = 0; i < N; i++)
        {
            for (int j = 0; j < N; j++)
            {
                // Get cofactor of A[i][j]
                getCofactor(A, temp, i, j, N);

                // sign of adj[j][i] positive if sum of row
                // and column indexes is even.
                sign = ((i + j) % 2 == 0) ? 1 : -1;

                // Interchanging rows and columns to get the
                // transpose of the cofactor matrix
                adj[j][i] = (sign) * (determinant(temp, N - 1));
            }
        }
    }

    bool inverse(const std::vector<std::vector<double>> &A, std::vector<std::vector<double>> &inv)
    {
        // Find determinant of A[][]
        int det = determinant(A, N);
        if (det == 0)
        {
            printf("Singular matrix, can't find its inverse\n");
            return false;
        }

        // Find adjoint
        std::vector<std::vector<double>> adj(N, std::vector<double>(N));
        adjoint(A, adj);

        // Find Inverse using formula "inverse(A) =
        // adj(A)/det(A)"
        for (int i = 0; i < N; i++)
            for (int j = 0; j < N; j++)
                inv[i][j] = adj[i][j] / float(det);

        return true;
    }

    void printVector(std::string name, std::vector<double> vec)
    {
        printf("Displaying %s\n", name.c_str());
        for (int i = 0; i < vec.size(); i++)
        {
            printf(" %.9f ", vec[i]);
        }
        printf("\n");
    }

    void printVectorFloat(std::string name, std::vector<float> vec)
    {
        printf("Displaying %s\n", name.c_str());
        for (int i = 0; i < vec.size(); i++)
        {
            printf(" %.9f ", vec[i]);
        }
        printf("\n");
    }

    void printVectorInt(std::string name, std::vector<int> vec)
    {
        printf("Displaying %s\n", name.c_str());
        for (int i = 0; i < vec.size(); i++)
        {
            printf(" %i ", vec[i]);
        }
        printf("\n");
    }

    void printMatrix(std::string name, std::vector<std::vector<double>> mat)
    {
        printf("Displaying %s\n", name.c_str());
        for (int i = 0; i < mat.size(); i++)
        {
            for (int j = 0; j < mat[0].size(); j++)
            {
                printf(" %ix%i: %.9f,", i, j, mat[i][j]);
            }
            printf("\n");
        }
    }

    void printMatrixFloat(std::string name, std::vector<std::vector<float>> mat)
    {
        printf("Displaying %s\n", name.c_str());
        for (int i = 0; i < mat.size(); i++)
        {
            for (int j = 0; j < mat[0].size(); j++)
            {
                printf(" %ix%i: %.9f,", i, j, mat[i][j]);
            }
            printf("\n");
        }
    }

private:
    int nNodes;
    int nElements;
    std::vector<std::vector<float>> nodeInputData;
    std::vector<std::vector<float>> nodeInputDataUnknowns;
    std::vector<std::vector<float>> elementsInputData;
    std::vector<std::vector<float>> K;
    std::vector<Element> elements;

    std::vector<double> Uun;
    std::vector<double> Pun;
    std::vector<double> Uk;
    std::vector<double> Pk;
    std::vector<int> A;
    std::vector<int> B;
    std::vector<int> Ak;
    std::vector<int> Bk;

    std::vector<std::vector<double>> KAA;
    std::vector<std::vector<double>> KAB;
    std::vector<std::vector<double>> KBA;
    std::vector<std::vector<double>> KBB;

    std::vector<std::vector<double>> invKAA;
    int N;

    std::vector<double> UA;
    std::vector<double> PB;

    std::vector<std::vector<double>> Results;
};

// Binding code
EMSCRIPTEN_BINDINGS(FemSolver)
{
    class_<FEMSolver>("FEMSolver")
        .constructor<int, int>()
        .function("SetSizes", &FEMSolver::SetSizes)
        .function("SetNodeInputData", &FEMSolver::SetNodeInputData)
        .function("SetElementInputData", &FEMSolver::SetElementInputData)
        .function("ProcessData", &FEMSolver::ProcessData)
        .function("Solve", &FEMSolver::Solve, return_value_policy::take_ownership());
}
