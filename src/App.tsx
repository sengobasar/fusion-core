import { Routes, Route, Navigate } from "react-router-dom";
import WorkerView from "./views/WorkerView";
import SupervisorView from "./views/SupervisorView";
import HousesView from "./views/HousesView";
import SetupView from "./views/SetupView";
import MainLayout from "./components/MainLayout";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/setup" element={<SetupView />} />
        <Route path="/supervisor/houses" element={<HousesView />} />
        <Route path="/" element={<Navigate to="/worker" />} />
        <Route path="/worker" element={<WorkerView />} />
        <Route path="/supervisor" element={<SupervisorView />} />
      </Routes>
    </MainLayout>
  );
}
