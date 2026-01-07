import { useEffect, useRef, useCallback } from 'react';
import { Node, Edge, ReactFlowState, useStore } from 'reactflow';
import * as d3 from 'd3-force';

type D3Node = {
    id: string;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
    [key: string]: any;
};

type D3Link = {
    source: string | D3Node;
    target: string | D3Node;
    id: string;
    [key: string]: any;
};

interface UseForceLayoutProps {
    nodes: Node[];
    edges: Edge[];
    setNodes: (nodes: Node[] | ((start: Node[]) => Node[])) => void;
    strength?: number;
    distance?: number;
}

const useForceLayout = ({ nodes, edges, setNodes }: UseForceLayoutProps) => {
    const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
    const nodesRef = useRef<Node[]>(nodes);

    // Keep a ref to the latest nodes to avoid stale closures in tick
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        if (!nodes.length) return;

        // Initialize simulation if it doesn't exist
        if (!simulationRef.current) {
            const simulation = d3.forceSimulation<D3Node, D3Link>()
                .force('charge', d3.forceManyBody().strength((d: any) => {
                    // Stronger repulsion for folder nodes or root
                    return d.id === 'root' ? -2000 : -1000;
                }))
                .force('collide', d3.forceCollide().radius((d: any) => {
                    // Node dimensions: Root 320x400, Others 240x320
                    // We need a radius that covers the corners to prevent overlap.
                    // Root diagonal/2 ~= 256. Let's use 220 as a safe bounding circle + padding.
                    // Others diagonal/2 ~= 200. Let's use 180 + padding.
                    return d.id === 'root' ? 250 : 200;
                }).strength(1).iterations(2))
                .force('center', d3.forceCenter(0, 0).strength(0.05)) // Gentle centering
                .alphaDecay(0.02) // Slightly Higher decay to stabilize quicker after drift
                .velocityDecay(0.6); // Higher friction to prevent high-speed collisions

            simulationRef.current = simulation;
        }

        const simulation = simulationRef.current;

        // Convert ReactFlow nodes/edges to D3 format
        // We map existing nodes to preserve their current positions (if any) to prevent jumping
        const d3Nodes: D3Node[] = nodes.map((node) => ({
            ...node,
            x: node.position.x || 0,
            y: node.position.y || 0,
            // If dragging, we might set fx/fy here, but for now let's let free flow
        }));

        const d3Links: D3Link[] = edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target
        }));

        simulation.nodes(d3Nodes);

        // Setup Link Force
        const linkForce = d3.forceLink<D3Node, D3Link>(d3Links)
            .id((d) => d.id)
            .distance(250) // Desired distance
            .strength(0.5); // Rigidity

        simulation.force('link', linkForce);

        // Tick Function
        simulation.on('tick', () => {
            // Check if significant movement occurred to reduce renders? 
            // For now, just sync.
            setNodes((prevNodes) => {
                return prevNodes.map((node) => {
                    const d3Node = d3Nodes.find((d) => d.id === node.id);
                    if (!d3Node) return node;

                    // Only update if position changed significantly to avoid spamming?
                    // Actually ReactFlow handles reference equality checks internally often

                    return {
                        ...node,
                        position: {
                            x: d3Node.x,
                            y: d3Node.y,
                        },
                    };
                });
            });
        });

        // Restart with some alpha to "heat up" simulation when nodes change
        simulation.alpha(0.3).restart();

        return () => {
            simulation.stop();
        };
    }, [nodes.length, edges.length, setNodes]); // Re-run when graph structure changes

    // Responsive Force Adjustment
    useEffect(() => {
        if (!simulationRef.current) return;

        const updateForces = () => {
            const isMobile = window.innerWidth < 768;
            const simulation = simulationRef.current;
            if (!simulation) return;

            if (isMobile) {
                // Mobile: Vertical bias
                simulation
                    .force('center', null) // Remove uniform center
                    .force('x', d3.forceX(0).strength(0.15)) // Keep centered horizontally
                    .force('y', d3.forceY(0).strength(0.05)) // Allow vertical drift
                    .force('charge', d3.forceManyBody().strength((d: any) => {
                        return d.id === 'root' ? -1500 : -800; // Slightly weaker repulsion to fit screen
                    }))
                    .force('link', d3.forceLink<D3Node, D3Link>([]).id((d) => d.id).distance(150).strength(0.6));
            } else {
                // Desktop: Uniform center
                simulation
                    .force('center', d3.forceCenter(0, 0).strength(0.05))
                    .force('x', null)
                    .force('y', null)
                    .force('charge', d3.forceManyBody().strength((d: any) => {
                        return d.id === 'root' ? -2000 : -1000;
                    }))
                    .force('link', d3.forceLink<D3Node, D3Link>([]).id((d) => d.id).distance(250).strength(0.5));
            }

            // Re-initialize links because defining forceLink(newLinks) usually expects links array.
            // But here we are just changing parameters. 
            // However, forceLink() resets links if called without arguments? No.
            // Actually, we need to pass the current links to the new forceLink, OR just update the existing force.
            // Better to update existing force if possible.

            const linkForce = simulation.force('link') as d3.ForceLink<D3Node, D3Link>;
            if (linkForce) {
                linkForce.distance(isMobile ? 150 : 250);
            }

            simulation.alpha(0.3).restart();
        };

        updateForces();
        window.addEventListener('resize', updateForces);

        return () => {
            window.removeEventListener('resize', updateForces);
        };
    }, []);

    return simulationRef.current;
};

export default useForceLayout;
