export const NodeInfo = ({ selected }: any) => {
  return (
    <div className="nodeInfoContainer">
      <div>
        <h1>Node Info</h1>
        <p>Name: {selected.name}</p>
      </div>
    </div>
  );
};
