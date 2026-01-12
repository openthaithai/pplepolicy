

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    ReactFlowProvider,
    useReactFlow,
    MarkerType,
    NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { INITIAL_NODES } from '@/services/policy';
import CustomNode from './nodes/CustomNode';
import { PolicyNode } from '@/types/policy';
import UIControls from './UIControls';
import useDagreLayout from '@/hooks/useDagreLayout';

const nodeTypes: NodeTypes = {
    custom: CustomNode,
};

interface PolicyGraphProps {
    onNodeSelect: (node: PolicyNode, breadcrumbs: PolicyNode[]) => void;
}

const PolicyGraphContent = ({ onNodeSelect }: PolicyGraphProps) => {
    const rootNode: Node = {
        id: 'root',
        type: 'custom',
        data: { title: "People's Party Policies", type: 'Folder', isExpanded: true },
        position: { x: 0, y: 0 },
    };

    const [nodes, setNodes, onNodesChange] = useNodesState([rootNode]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    // Layout Hook
    const { runLayout } = useDagreLayout({ setNodes, setEdges });

    const fetchChildrenJson = async (level: number, slug: string) => {
        try {
            const module = await import(`../data/policy/${level}/${slug}.json`);
            return module.default.policy.children;
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    // Load initial branches
    useEffect(() => {
        if (nodes.length === 1) {
            const newNodes: Node[] = [];
            const newEdges: Edge[] = [];

            // Helper to load missing images for initial nodes
            const loadInitialData = async () => {
                const enrichedPolicies = await Promise.all(INITIAL_NODES.map(async (policy) => {
                    let imageUrl = (policy as any).image;
                    let childImages: string[] = [];

                    // Fallback: If no image, try to fetch children and use first child's image
                    if (!imageUrl) {
                        const children = await fetchChildrenJson(policy.level, policy.slug);
                        if (children && children.length > 0) {
                            childImages = children.map((c: any) => c.image).filter(Boolean);
                        }
                    }

                    return { ...policy, image: imageUrl, childImages };
                }));

                enrichedPolicies.forEach((policy, index) => {
                    const id = policy.slug;

                    newNodes.push({
                        id,
                        type: 'custom',
                        data: {
                            title: policy.title,
                            type: 'Folder',
                            slug: policy.slug,
                            level: policy.level,
                            hasLoaded: false,
                            image: policy.image,
                            childImages: (policy as any).childImages
                        },
                        position: { x: 0, y: 0 }, // Initial position, will be fixed by layout
                    });

                    let sourceHandle = null;
                    if (id.startsWith('A')) sourceHandle = 'source-top';
                    if (id.startsWith('B')) sourceHandle = 'source-right';
                    if (id.startsWith('C')) sourceHandle = 'source-bottom';
                    if (id.startsWith('D')) sourceHandle = 'source-left';

                    newEdges.push({
                        id: `root-${id}`,
                        source: 'root',
                        target: id,
                        sourceHandle,
                        type: 'smoothstep', // Better for directional graph
                        style: { stroke: 'rgba(244, 117, 36, 0.3)', strokeWidth: 2 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: 'rgba(244, 117, 36, 0.3)',
                        },
                    });
                });

                setNodes((nds) => {
                    const existingIds = new Set(nds.map(n => n.id));
                    const uniqueNewNodes = newNodes.filter(n => !existingIds.has(n.id));
                    return [...nds, ...uniqueNewNodes];
                });
                setEdges((eds) => {
                    const existingIds = new Set(eds.map(e => e.id));
                    const uniqueNewEdges = newEdges.filter(e => !existingIds.has(e.id));
                    return [...eds, ...uniqueNewEdges];
                });

                // Trigger layout after state update? 
                // We depend on nodes/edges in next render to run layout?
                // Or we can manually run it here if we had the state referencing new objects.
                // Since hooks are async in state updates, we can't run immediately on 'nodes' variable.
                // But we can trigger a flag or useEffect.
            };

            loadInitialData();
        }
    }, [nodes.length]); // Run once when only root exists

    // Auto-run layout when edges change and handle initial fit
    useEffect(() => {
        if (nodes.length > 1 && edges.length > 0) {
            runLayout(nodes, edges);

            // If this is the first substantial layout (e.g. just root and level 1), fit view
            if (nodes.length <= 6) { // Heuristic: Initial load usually has few nodes
                setTimeout(() => {
                    window.requestAnimationFrame(() => fitView({ duration: 800, padding: 0.2 }));
                }, 50);
            }
        }
    }, [nodes.length, edges.length, runLayout, fitView]);


    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const fetchChildren = async (node: Node) => {
        return fetchChildrenJson(node.data.level, node.data.slug);
    };

    const getBreadcrumbs = (nodeId: string, currentNodes: Node[], currentEdges: Edge[]): PolicyNode[] => {
        const path: PolicyNode[] = [];
        let currentId = nodeId;

        while (currentId) {
            const node = currentNodes.find(n => n.id === currentId);
            if (node) {
                path.unshift({
                    id: node.id as any,
                    slug: node.data.slug,
                    title: node.data.title,
                    type: node.data.type
                });
            }

            const edge = currentEdges.find(e => e.target === currentId);
            currentId = edge ? edge.source : '';
        }
        return path;
    };

    // Interaction Handlers
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Effect to handle Dimming/Highlighting based on Selection
    useEffect(() => {
        if (!selectedNodeId) {
            // Reset if needed
            const hasDimmed = nodes.some(n => n.data.isDimmed || n.data.isHighlighted);
            if (hasDimmed) {
                setNodes((nds) => nds.map(n => ({
                    ...n,
                    data: { ...n.data, isDimmed: false, isHighlighted: false }
                })));
                setEdges((eds) => eds.map(e => ({
                    ...e,
                    style: { ...e.style, opacity: 1 },
                })));
            }
            return;
        }

        const relatedNodeIds = new Set<string>();

        const findAncestors = (currentId: string) => {
            relatedNodeIds.add(currentId);
            const parentEdge = edges.find(e => e.target === currentId);
            if (parentEdge) {
                relatedNodeIds.add(parentEdge.source);
                findAncestors(parentEdge.source);
            }
        };

        const findDescendants = (currentId: string) => {
            relatedNodeIds.add(currentId);
            const childEdges = edges.filter(e => e.source === currentId);
            childEdges.forEach(e => {
                relatedNodeIds.add(e.target);
                findDescendants(e.target);
            });
        };

        findAncestors(selectedNodeId);
        findDescendants(selectedNodeId);

        let hasChanges = false;
        const newNodes = nodes.map(n => {
            const isRelated = relatedNodeIds.has(n.id);
            const shouldDim = !isRelated;
            const shouldHighlight = n.id === selectedNodeId;

            if (!!n.data.isDimmed !== shouldDim || !!n.data.isHighlighted !== shouldHighlight) {
                hasChanges = true;
                return {
                    ...n,
                    data: { ...n.data, isDimmed: shouldDim, isHighlighted: shouldHighlight }
                };
            }
            return n;
        });

        if (hasChanges) {
            setNodes(newNodes);
            setEdges((eds) => eds.map(e => {
                const isRelatedEdge = relatedNodeIds.has(e.source) && relatedNodeIds.has(e.target);
                const opacity = isRelatedEdge ? 1 : 0.1;
                if (e.style?.opacity !== opacity) {
                    return { ...e, style: { ...e.style, opacity } };
                }
                return e;
            }));
        }

    }, [selectedNodeId, nodes.length, edges.length]);

    const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
        if (selectedNodeId) return;

        setHoveredNodeId(node.id);

        setEdges((eds) => eds.map(e => {
            if (e.source === node.id || e.target === node.id) {
                return {
                    ...e,
                    animated: true,
                    style: { ...e.style, stroke: '#F47524', strokeWidth: 2.5, opacity: 1 },
                    zIndex: 1000
                };
            }
            return {
                ...e,
                animated: false,
                style: { ...e.style, stroke: 'rgba(244, 117, 36, 0.3)', strokeWidth: 1.5, opacity: 0.3 },
                zIndex: 0
            };
        }));

        setNodes((nds) => nds.map(n => {
            const isConnected = edges.some(e =>
                (e.source === node.id && e.target === n.id) ||
                (e.target === node.id && e.source === n.id)
            );

            if (n.id === node.id) {
                return { ...n, data: { ...n.data, isHighlighted: true } };
            }
            if (isConnected) {
                return { ...n, data: { ...n.data, isHighlighted: true } };
            }
            return { ...n, data: { ...n.data, isHighlighted: false } };
        }));

    }, [edges, setEdges, setNodes]);

    const onNodeMouseLeave = useCallback((event: React.MouseEvent, node: Node) => {
        setHoveredNodeId(null);

        setEdges((eds) => eds.map(e => ({
            ...e,
            animated: false,
            style: { ...e.style, stroke: 'rgba(244, 117, 36, 0.3)', strokeWidth: e.source === 'root' ? 2 : 1.5, opacity: 1 },
            zIndex: 0
        })));

        setNodes((nds) => nds.map(n => ({
            ...n,
            data: {
                ...n.data,
                isHighlighted: false,
            }
        })));

    }, [setEdges, setNodes, selectedNodeId]);

    const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);

        if (node.id === 'root') {
            setSelectedNodeId('root');
            return;
        }

        if (node.data.type === 'File') {
            const breadcrumbs = getBreadcrumbs(node.id, nodes, edges);
            onNodeSelect({
                id: node.id as any,
                slug: node.data.slug,
                title: node.data.title,
                type: 'File',
                summary: node.data.summary,
                contentBlocks: node.data.contentBlocks,
                image: node.data.image,
                level: node.data.level,
            }, breadcrumbs);
            return;
        }

        const isExpanded = !!node.data.isExpanded;

        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        data: { ...n.data, loading: !n.data.hasLoaded && !isExpanded },
                    };
                }
                return n;
            })
        );

        if (!isExpanded) {
            let childrenToAdd: any[] = [];

            if (!node.data.hasLoaded) {
                const children = await fetchChildren(node);

                if (children && children.length > 0) {
                    childrenToAdd = children.map((child: any) => ({
                        id: child.slug,
                        type: 'custom',
                        data: {
                            title: child.title,
                            type: child.type,
                            slug: child.slug,
                            level: (node.data.level || 1) + 1,
                            hasLoaded: false,
                            image: child.image
                        },
                        position: { x: 0, y: 0 },
                    }));
                }
            }

            // Focus on the clicked node
            setTimeout(() => {
                fitView({
                    nodes: [{ id: node.id }],
                    duration: 1200,
                    padding: 2,
                    minZoom: 0.5,
                    maxZoom: 1.5
                });
            }, 100);

            // We need to add nodes and edges, then layout will trigger via effect
            setNodes((nds) => {
                const existingIds = new Set(nds.map(n => n.id));
                const newNodes = childrenToAdd.filter((n: any) => !existingIds.has(n.id));
                const childIdsToUnhide = new Set<string>();
                // If loaded, find existing children to unhide
                if (node.data.hasLoaded) {
                    edges.filter(e => e.source === node.id).forEach(e => childIdsToUnhide.add(e.target));
                }

                return nds.map((n) => {
                    if (n.id === node.id) {
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                isExpanded: true,
                                loading: false,
                                hasLoaded: true,
                                childImages: childrenToAdd.map((c: any) => c.data.image).filter(Boolean)
                            }
                        };
                    }
                    if (childIdsToUnhide.has(n.id)) {
                        return { ...n, hidden: false };
                    }
                    return n;
                }).concat(newNodes);
            });

            setEdges((eds) => {
                const newEdges = childrenToAdd.map((child: any) => ({
                    id: `${node.id}-${child.id}`,
                    source: node.id,
                    target: child.id,
                    type: 'smoothstep',
                    style: { stroke: 'rgba(244, 117, 36, 0.3)', strokeWidth: 1.5 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: 'rgba(244, 117, 36, 0.3)',
                    },
                }));
                const uniqueEdges = newEdges.filter((ne: any) => !eds.some(e => e.id === ne.id));
                const childIdsToUnhide = new Set<string>();
                if (node.data.hasLoaded) {
                    // unhide edges?
                    // Actually logic below handles hiding, so we need to unhide here
                    // But simpler is to reconstruct logic:
                    // The existing edge logic filters out duplicates.
                    // We just need to ensure existing edges are unhidden.
                    return eds.map(e => {
                        if (e.source === node.id) return { ...e, hidden: false };
                        return e;
                    }).concat(uniqueEdges);
                }

                return [...eds, ...uniqueEdges];
            });

        } else {
            // Collapse logic
            const getDescendants = (parentId: string, allEdges: Edge[]) => {
                let descendants: string[] = [];
                const children = allEdges.filter(e => e.source === parentId).map(e => e.target);
                descendants = [...children];
                children.forEach(childId => {
                    descendants = [...descendants, ...getDescendants(childId, allEdges)];
                });
                return descendants;
            };

            const descendants = getDescendants(node.id, edges);

            setNodes((nds) => {
                const nodesToRemove = new Set(descendants);
                return nds.map(n => {
                    if (n.id === node.id) {
                        return { ...n, data: { ...n.data, isExpanded: false } };
                    }
                    if (nodesToRemove.has(n.id)) {
                        return { ...n, hidden: true };
                    }
                    return n;
                });
            });

            setEdges((eds) =>
                eds.map(e => {
                    if (descendants.includes(e.source) || descendants.includes(e.target) || e.source === node.id) {
                        return { ...e, hidden: true };
                    }
                    return e;
                })
            );
        }

    }, [nodes, edges, setNodes, setEdges, onNodeSelect, fetchChildrenJson]); // fetchChildrenJson added

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const handleSearchSelect = useCallback(async (node: PolicyNode) => {
        const targetSlug = node.slug;
        const parts = targetSlug.split('-');

        let currentSlug = parts[0];
        let currentLevel = 1;

        // Expand loop for ancestors
        for (let i = 0; i < parts.length - 1; i++) {
            const slugToExpand = parts.slice(0, i + 1).join('-');
            const levelToExpand = i + 1;

            // Check if node exists in current nodes state
            // Note: Since setNodes is async, we can't rely on 'nodes' state updated in previous loop iteration.
            // But we can check if it's already expanded or loaded.
            // Ideally we fetch sequentially and build a cumulative list of new nodes.

            // However, simpler approach: Just trigger expansion if we can find the node, 
            // or if we can't find it, we might need to assume it will be added by previous expansion.
            // This is tricky with async state.

            // Alternative: Re-implement expansion here without relying on 'nodes' state for intermediate steps.
            // We can fetch data, build nodes/edges arrays, and call setNodes ONCE at the end.
        }

        // BETTER APPROACH:
        // 1. Identify all ancestor slugs that need expansion.
        // 2. Fetch all of them in parallel or sequence.
        // 3. Construct all missing nodes and edges.
        // 4. Update state once.

        const ancestorSlugs: { slug: string; level: number }[] = [];
        for (let i = 0; i < parts.length - 1; i++) {
            ancestorSlugs.push({
                slug: parts.slice(0, i + 1).join('-'),
                level: i + 1
            });
        }

        const existingNodeIds = new Set(nodes.map(n => n.id));
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        // Identify which ancestors are NOT expanded/loaded.
        // But since we don't know if they are loaded without checking 'nodes', 
        // and 'nodes' might be stale if we chain updates... 
        // Actually, we can just fetch children for ALL ancestors just to be safe, 
        // or check 'nodes' (which is stable enough for start of function).

        const promises = ancestorSlugs.map(async ({ slug, level }) => {
            const children = await fetchChildrenJson(level, slug);
            return { parentSlug: slug, children };
        });

        const results = await Promise.all(promises);

        results.forEach(({ parentSlug, children }) => {
            if (!children) return;

            // Mark parent as expanded (we'll need to update parent node in state)

            children.forEach((child: any) => {
                const childId = child.slug;

                // Add node if not exists (checked against generic 'existing' + 'new')
                // We use a temp set for this local scope

                newNodes.push({
                    id: childId,
                    type: 'custom',
                    data: {
                        title: child.title,
                        type: child.type,
                        slug: child.children ? child.slug : childId, // slug consistency
                        level: (child.slug.split('-').length),
                        hasLoaded: false, // We haven't loaded ITS children yet
                        image: child.image,
                        // If this child is an ancestor of target, mark it expanded? 
                        // We will update that below.
                    },
                    position: { x: 0, y: 0 }
                });

                newEdges.push({
                    id: `${parentSlug}-${childId}`,
                    source: parentSlug,
                    target: childId,
                    type: 'smoothstep',
                    style: { stroke: 'rgba(244, 117, 36, 0.3)', strokeWidth: 1.5 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: 'rgba(244, 117, 36, 0.3)',
                    },
                });
            });
        });


        setNodes((nds) => {
            const nodeMap = new Map(nds.map(n => [n.id, n]));

            // Merge new nodes
            newNodes.forEach(n => {
                if (!nodeMap.has(n.id)) {
                    nodeMap.set(n.id, n);
                }
            });

            // Update ancestor expansion states
            ancestorSlugs.forEach(({ slug }) => {
                const n = nodeMap.get(slug);
                if (n) {
                    nodeMap.set(slug, {
                        ...n,
                        data: { ...n.data, isExpanded: true, hasLoaded: true, loading: false }
                    });
                }
            });

            // Highlight target
            const targetNode = nodeMap.get(targetSlug);
            // We also need to un-dim others (handled by effect on selectedNodeId change)

            return Array.from(nodeMap.values());
        });

        setEdges((eds) => {
            const edgeMap = new Map(eds.map(e => [e.id, e]));

            newEdges.forEach(e => {
                if (!edgeMap.has(e.id)) {
                    edgeMap.set(e.id, e);
                }
            });

            // Unhide logic?
            // If we are expanding, we should ensure edges from ancestors are visible/not hidden.
            // Simplified: Just set hidden=false for derived edges.
            ancestorSlugs.forEach(({ slug }) => {
                // edges originating from this slug
                // We can't easily iterate map values to find them efficiently without loop
            });

            // Brute force update all edges to be unhidden if they are part of the structure?
            // Or rely on the fact that new edges are not hidden. 
            // Existing edges might be hidden if previously collapsed.

            // Let's iterate all edges and unhide if source is in ancestorSlugs
            const ancestorSet = new Set(ancestorSlugs.map(a => a.slug));
            const updatedEdges = Array.from(edgeMap.values()).map(e => {
                if (ancestorSet.has(e.source)) {
                    return { ...e, hidden: false };
                }
                return e;
            });

            return updatedEdges;
        });

        // Set selection (triggers highlight effect)
        setSelectedNodeId(targetSlug);

        // Center view on target?
        // We need to wait for layout. Layout runs on effect [nodes, edges].
        // But we want to zoom to the node.
        // We can use a timeout or a specific effect for "search focus".
        setTimeout(() => {
            // const n = nodes.find(n => n.id === targetSlug) || newNodes.find(n => n.id === targetSlug);
            // Note: 'nodes' here is stale closure from start of function.
            // We can use react-flow instance to get node? internal state.
            // Or just fitView/zoomTo.

            // Simplest: trigger fitView
            // fitView({ nodes: [{id: targetSlug}], duration: 800, padding: 0.5 }); 
            // But fitView takes an array of nodes to fit. 
            // We assume layout has updated positions. D3/Dagre layout effect is also async/useEffect driven.
            // So 1000ms timeout might be enough.

            // Open Detail Panel
            // Construct breadcrumbs
            const breadcrumbs: PolicyNode[] = ancestorSlugs.map(a => {
                const n = nodes.find(n => n.id === a.slug) || newNodes.find(n => n.id === a.slug);
                if (n) {
                    return {
                        id: n.id as any,
                        slug: n.data.slug,
                        title: n.data.title,
                        type: n.data.type,
                        level: n.data.level
                    };
                }
                return null;
            }).filter(Boolean) as PolicyNode[];

            onNodeSelect(node, breadcrumbs);

        }, 1000);

    }, [nodes, fetchChildrenJson, fitView]);

    return (
        <div style={{ width: '100vw', height: '100vh', background: 'var(--color-bg)' }}>
            <UIControls
                onCenter={() => fitView({ duration: 800, padding: 0.2 })}
                onSearchSelect={handleSearchSelect}
            />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
            >
                <Background color="#F9F9F9" gap={24} size={1} />
                <Controls showInteractive={false} />
            </ReactFlow>
        </div>
    );
};

export default function PolicyGraph(props: PolicyGraphProps) {
    return (
        <ReactFlowProvider>
            <PolicyGraphContent {...props} />
        </ReactFlowProvider>
    );
}
