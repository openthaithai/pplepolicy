'use client';

import { useState, useCallback } from 'react';
import PolicyGraph from '@/components/PolicyGraph';
import PolicyDetail from '@/components/PolicyDetail';
import { PolicyNode } from '@/types/policy';

export default function Home() {
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
    <main>
      <PolicyGraph onNodeSelect={handleNodeSelect} />
      <PolicyDetail
        node={selectedNode}
        breadcrumbs={breadcrumbs}
        onClose={handleCloseDetail}
      />
    </main>
  );
}
