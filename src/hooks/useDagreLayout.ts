import { useCallback } from 'react';
import { Node, Edge, useReactFlow } from 'reactflow';
import dagre from 'dagre';

interface UseDagreLayoutProps {
    setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void;
    setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
}

const useDagreLayout = ({ setNodes, setEdges }: UseDagreLayoutProps) => {
    const { fitView } = useReactFlow();

    const getLayoutedElements = useCallback(
        (nodes: Node[], edges: Edge[]) => {
            const dagreGraph = new dagre.graphlib.Graph();
            dagreGraph.setDefaultEdgeLabel(() => ({}));

            dagreGraph.setGraph({
                rankdir: 'LR',
                nodesep: 50, // Vertical spacing between nodes
                ranksep: 100 // Horizontal spacing between ranks
            });

            nodes.forEach((node) => {
                // Dimensions matching CustomNode
                const isRoot = node.id === 'root';
                const width = isRoot ? 320 : 240;
                const height = isRoot ? 400 : 320;

                dagreGraph.setNode(node.id, { width, height });
            });

            edges.forEach((edge) => {
                dagreGraph.setEdge(edge.source, edge.target);
            });

            dagre.layout(dagreGraph);

            const layoutedNodes = nodes.map((node) => {
                const nodeWithPosition = dagreGraph.node(node.id);
                // Dagre returns center point, ReactFlow expects top-left
                const isRoot = node.id === 'root';
                const width = isRoot ? 320 : 240;
                const height = isRoot ? 400 : 320;

                return {
                    ...node,
                    targetPosition: 'left',
                    sourcePosition: 'right',
                    position: {
                        x: nodeWithPosition.x - width / 2,
                        y: nodeWithPosition.y - height / 2,
                    },
                };
            });

            return { nodes: layoutedNodes, edges };
        },
        []
    );

    // Better approach: Expose a function to run layout that accepts nodes/edges
    const runLayout = useCallback((nodes: Node[], edges: Edge[]) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
        setNodes(layoutedNodes as Node[]);
        setEdges(layoutedEdges as Edge[]);

        // Fit view after a brief delay to allow render
        setTimeout(() => {
            window.requestAnimationFrame(() => fitView({ duration: 800, padding: 0.2 }));
        }, 10);
    }, [getLayoutedElements, setNodes, setEdges, fitView]);

    return { runLayout };
};

export default useDagreLayout;
