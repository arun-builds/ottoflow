import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WorkflowsList from '@/pages/WorkflowsList';
import WorkflowEditor from '@/pages/WorkflowEditor';
import WorkflowExecutions from '@/pages/WorkflowExecutions';
import ExecutionDetail from '@/pages/ExecutionDetail';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WorkflowsList />} />
                <Route path="/workflows" element={<WorkflowsList />} />
                <Route path="/workflows/new" element={<WorkflowEditor />} />
                <Route path="/workflows/:id" element={<WorkflowEditor />} />
                <Route path="/workflows/:workflowId/executions" element={<WorkflowExecutions />} />
                <Route path="/executions/:executionId" element={<ExecutionDetail />} />
            </Routes>
        </BrowserRouter>
    );
}
