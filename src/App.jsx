

import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ventas from "./pages/Ventas";
import Productos from "./pages/Productos";
import Reportes from "./pages/Reportes";
import EscanerMovil from "./pages/EscanerMovil"; // nuevo
import Inventario from "./pages/Inventario";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route path="ventas" element={<Ventas />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="escanermovil" element={<EscanerMovil />} /> {/* nuevo */}
      </Route>
    </Routes>
  );
}

export default App;






