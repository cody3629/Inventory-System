import { useEffect, useState } from "react";

function App() {
  const [ping, setPing] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/ping")
      .then((res) => res.json())
      .then((data) => setPing(data.time));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Inventory SaaS</h1>
      <p>Server time: {ping || "Loading..."}</p>
    </div>
  );
}

export default App;
