

import { Link, Outlet, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí puedes limpiar sesión si usas Supabase/Auth
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-indigo-500">
          🛒 TIENDA
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="ventas"
            className="block px-3 py-2 rounded hover:bg-indigo-600"
          >
            Ventas
          </Link>
          <Link
            to="productos"
            className="block px-3 py-2 rounded hover:bg-indigo-600"
          >
            Productos
          </Link>
          <Link
            to="inventario"
            className="block px-3 py-2 rounded hover:bg-indigo-600"
          >
            Inventario
          </Link>
          <Link
            to="reportes"
            className="block px-3 py-2 rounded hover:bg-indigo-600"
          >
            Reportes
          </Link>
          <Link
            to="escanermovil"
            className="block px-3 py-2 rounded hover:bg-indigo-600"
          >
            Escáner móvil
          </Link>
        </nav>
        <div className="p-4 border-t border-indigo-500">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-500 py-2 rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
