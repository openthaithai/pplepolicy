import { useState, useCallback } from 'react';
// We will fix imports later when we move components
import PolicyGraph from './components/PolicyGraph';
// @ts-ignore - PolicyDetail might not be moved yet so imports might be broken temporarily
import PolicyDetail from './components/PolicyDetail';
import { PolicyNode } from './types/policy';

function App() {
  const [selectedNode, setSelectedNode] = useState<PolicyNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<PolicyNode[]>([]);

  const handleNodeSelect = useCallback((node: PolicyNode, bc: PolicyNode[]) => {
    setSelectedNode(node);
    setBreadcrumbs(bc);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <main style={{ fontFamily: '"Prompt", sans-serif' }}>
      <PolicyGraph onNodeSelect={handleNodeSelect} />
      <PolicyDetail
        node={selectedNode}
        breadcrumbs={breadcrumbs}
        onClose={handleCloseDetail}
      />
    </main>
  );
}

export default App;
