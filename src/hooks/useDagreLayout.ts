import { useCallback } from 'react';
import { Node, Edge, useReactFlow, Position } from 'reactflow';
import dagre from 'dagre';

interface UseDagreLayoutProps {
    setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
    setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
}

// Helper to determine branch
const getBranch = (nodeId: string): 'A' | 'B' | 'C' | 'D' | 'ROOT' => {
    if (nodeId === 'root') return 'ROOT';
    if (nodeId.startsWith('A')) return 'A';
    if (nodeId.startsWith('B')) return 'B';
    if (nodeId.startsWith('C')) return 'C';
    if (nodeId.startsWith('D')) return 'D';
    return 'ROOT'; // Fallback
};

const useDagreLayout = ({ setNodes, setEdges }: UseDagreLayoutProps) => {
    const { fitView } = useReactFlow();

    const getLayoutedElements = useCallback(
        (nodes: Node[], edges: Edge[]) => {
            // Separate nodes and edges by branch
            const branches = {
                A: { nodes: [] as Node[], edges: [] as Edge[], rankdir: 'BT' }, // Up
                B: { nodes: [] as Node[], edges: [] as Edge[], rankdir: 'LR' }, // Right
                C: { nodes: [] as Node[], edges: [] as Edge[], rankdir: 'TB' }, // Down
                D: { nodes: [] as Node[], edges: [] as Edge[], rankdir: 'RL' }, // Left
            };

            const rootNode = nodes.find(n => n.id === 'root');
            if (!rootNode) return { nodes, edges };

            // Assign nodes to branches
            nodes.forEach(node => {
                if (node.id === 'root') return;
                const branch = getBranch(node.id);
                if (branch !== 'ROOT' && branches[branch]) {
                    branches[branch].nodes.push(node);
                }
            });

            // Assign edges to branches (only internal edges)
            edges.forEach(edge => {
                const sourceBranch = getBranch(edge.source);
                const targetBranch = getBranch(edge.target);

                if (sourceBranch !== 'ROOT' && sourceBranch === targetBranch && branches[sourceBranch]) {
                    branches[sourceBranch].edges.push(edge);
                }
            });

            let finalNodes: Node[] = [
                {
                    ...rootNode,
                    targetPosition: Position.Left, // Default, though unused for root
                    sourcePosition: Position.Right, // Default
                    position: { x: 0, y: 0 }
                }
            ];

            // Process each branch
            (Object.keys(branches) as Array<keyof typeof branches>).forEach(branchKey => {
                const branch = branches[branchKey];
                if (branch.nodes.length === 0) return;

                const g = new dagre.graphlib.Graph();
                g.setDefaultEdgeLabel(() => ({}));
                g.setGraph({
                    rankdir: branch.rankdir,
                    nodesep: 50,
                    ranksep: 100
                });

                // Add nodes to dagre
                branch.nodes.forEach(node => {
                    // Dimensions need to be accurate for layout
                    // Ideally we should know sizes, but we use defaults for now like before
                    const width = 240;
                    const height = 320;
                    g.setNode(node.id, { width, height });
                });

                // Add edges to dagre
                branch.edges.forEach(edge => {
                    g.setEdge(edge.source, edge.target);
                });

                dagre.layout(g);

                // Find the Level 1 node for this branch (A, B, C, or D)
                const level1NodeId = branchKey;
                const level1Params = g.node(level1NodeId);

                // If level 1 node is not found (maybe filtered out?), skip
                if (!level1Params) {
                    return;
                }

                // Calculate Offset to place Level 1 node correctly relative to Actual Root (0,0)
                // Root is at 0,0. 
                // Root width=320, height=400.
                const rootWidth = 320;
                const rootHeight = 400;
                const gap = 150; // Distance from root to level 1

                let anchorX = 0;
                let anchorY = 0;

                // We want Level 1 node Center to be at specific spot relative to Root Center (0,0)
                switch (branchKey) {
                    case 'A': // Up
                        anchorX = 0;
                        anchorY = -(rootHeight / 2 + gap + 320 / 2); // 320 is level 1 height roughly
                        break;
                    case 'B': // Right
                        anchorX = (rootWidth / 2 + gap + 240 / 2);
                        anchorY = 0;
                        break;
                    case 'C': // Down
                        anchorX = 0;
                        anchorY = (rootHeight / 2 + gap + 320 / 2);
                        break;
                    case 'D': // Left
                        anchorX = -(rootWidth / 2 + gap + 240 / 2);
                        anchorY = 0;
                        break;
                }

                // Delta needed: TargetPosition - CurrentPosition
                const dx = anchorX - level1Params.x;
                const dy = anchorY - level1Params.y;

                // Map back to nodes
                branch.nodes.forEach(node => {
                    const pos = g.node(node.id);

                    // Determine handles based on rankdir
                    let sourcePosition = Position.Right;
                    let targetPosition = Position.Left;

                    if (branch.rankdir === 'LR') {
                        sourcePosition = Position.Right; targetPosition = Position.Left;
                    } else if (branch.rankdir === 'RL') {
                        sourcePosition = Position.Left; targetPosition = Position.Right;
                    } else if (branch.rankdir === 'TB') {
                        sourcePosition = Position.Bottom; targetPosition = Position.Top;
                    } else if (branch.rankdir === 'BT') {
                        sourcePosition = Position.Top; targetPosition = Position.Bottom;
                    }

                    finalNodes.push({
                        ...node,
                        sourcePosition,
                        targetPosition,
                        position: {
                            x: pos.x + dx - (240 / 2), // ReactFlow pos is TopLeft, Dagre is Center
                            y: pos.y + dy - (320 / 2)
                        }
                    });
                });
            });

            return { nodes: finalNodes, edges };
        },
        []
    );

    const runLayout = useCallback((nodes: Node[], edges: Edge[]) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
        setNodes(layoutedNodes as Node[]);
        setEdges(layoutedEdges as Edge[]);
    }, [getLayoutedElements, setNodes, setEdges]);

    return { runLayout };
};

export default useDagreLayout;
