import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import RequireAuth from "./components/auth/RequireAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ResponsesPage from "./pages/ResponsesPage";
import Signup from "./pages/Signup";

export default function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/responses");

  return (
    <div className="app">
      <Header />
      <main className={isDashboard ? "w-full flex-1" : "page"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/responses"
            element={
              <RequireAuth>
                <ResponsesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/responses/:itemId"
            element={
              <RequireAuth>
                <ResponsesPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
