import { Routes, Route, Navigate } from "react-router-dom";
import WorkerView from "./views/WorkerView";
import SupervisorView from "./views/SupervisorView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/worker" />} />
      <Route path="/worker" element={<WorkerView />} />
      <Route path="/supervisor" element={<SupervisorView />} />
    </Routes>
  );
}
