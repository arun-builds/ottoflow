import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import HomePage from '@/pages/HomePage';
import WorkflowsList from '@/pages/WorkflowsList';
import WorkflowEditor from '@/pages/WorkflowEditor';
import WorkflowExecutions from '@/pages/WorkflowExecutions';
import ExecutionDetail from '@/pages/ExecutionDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Editor has its own full-screen layout (no navbar) ─────── */}
        <Route path="/workflows/new" element={<WorkflowEditor />} />
        <Route path="/workflows/:id" element={<WorkflowEditor />} />

        {/* ── All other pages share the standard layout ────────────── */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/workflows" element={<WorkflowsList />} />
          <Route
            path="/workflows/:workflowId/executions"
            element={<WorkflowExecutions />}
          />
          <Route
            path="/executions/:executionId"
            element={<ExecutionDetail />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
