import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api, getToken } from "./api.js";
import Login from "./pages/Login.jsx";
import Layout from "./layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import WorkList from "./pages/WorkList.jsx";
import WorkEdit from "./pages/WorkEdit.jsx";
import HomeContent from "./pages/HomeContent.jsx";
import AboutContent from "./pages/AboutContent.jsx";
import ContactContent from "./pages/ContactContent.jsx";
import CareerPageContent from "./pages/CareerPageContent.jsx";
import CareerList from "./pages/CareerList.jsx";
import CareerEdit from "./pages/CareerEdit.jsx";

function RequireAuth({ children }) {
  const [ok, setOk] = useState(null);

  useEffect(() => {
    const onStorage = () => {
      if (!getToken()) setOk(false);
    };
    const onAuthLost = () => setOk(false);
    window.addEventListener("storage", onStorage);
    window.addEventListener("fb-auth-lost", onAuthLost);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("fb-auth-lost", onAuthLost);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!getToken()) {
        if (!cancelled) setOk(false);
        return;
      }
      try {
        await api("/auth/me");
        if (!cancelled) setOk(true);
      } catch {
        if (!cancelled) setOk(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (ok === null) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center text-secondary">
        Loading…
      </div>
    );
  }
  if (!ok) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="home-content" element={<HomeContent />} />
          <Route path="about-content" element={<AboutContent />} />
          <Route path="contact-content" element={<ContactContent />} />
          <Route path="career-page" element={<CareerPageContent />} />
          <Route path="career-jobs" element={<CareerList />} />
          <Route path="career-jobs/new" element={<CareerEdit />} />
          <Route path="career-jobs/:id" element={<CareerEdit />} />
          <Route path="work" element={<WorkList />} />
          <Route path="work/new" element={<WorkEdit />} />
          <Route path="work/:id" element={<WorkEdit />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
