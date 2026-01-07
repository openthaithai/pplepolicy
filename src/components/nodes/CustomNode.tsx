import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react';
import styles from './CustomNode.module.css';

interface CustomNodeData {
    title: string;
    isExpanded?: boolean;
    type: 'Folder' | 'File';
    loading?: boolean;
    image?: string;
    childImages?: string[];
    level?: number;
    isHighlighted?: boolean;
    isDimmed?: boolean;
}

const CustomNode = ({ data, id, isConnectable, sourcePosition = Position.Right, targetPosition = Position.Left }: NodeProps<CustomNodeData>) => {
    const isFolder = data.type === 'Folder';
    const imageUrl = data.image
        ? (data.image.startsWith('/') || data.image.startsWith('http'))
            ? data.image
            : `https://directus.pplethai.org/assets/${data.image}.jpg`
        : null;

    // Dynamic sizing based on hierarchy level
    // Root (no level?) or Level 1 = Large
    // Deeper levels get smaller
    const isRoot = id === 'root';
    const level = data.level || (isRoot ? 0 : 1);

    const fontSize = isRoot ? '32px' :
        level === 1 ? '24px' :
            '18px';

    return (
        <div
            className={`
                ${styles.node} 
                ${data.isHighlighted ? styles.highlighted : ''} 
                ${data.isDimmed ? styles.dimmed : ''}
                ${isRoot || level === 1 ? styles.source : ''}
                ${level > 1 ? styles.target : ''}
            `}
            role="button"
            tabIndex={0}
            onClick={() => {/* Handled by ReactFlow onNodeClick */ }}
            style={{
                width: isRoot ? 320 : 240,
                height: isRoot ? 400 : 320,
            }}
        >
            {/* Target Handle (Input) - Not needed for Root */}
            {!isRoot && (
                <Handle
                    type="target"
                    position={targetPosition}
                    isConnectable={isConnectable}
                    className={styles.handle}
                // Hide handle visual if desired, or keep it
                />
            )}

            {/* Background Image or Fallback */}
            {data.image ? (
                <div
                    className={styles.imageLayer}
                    style={{ backgroundImage: `url(${imageUrl || '/pplepolicy/placeholder_policy.png'})` }}
                />
            ) : data.childImages && data.childImages.length > 0 ? (
                <div className={styles.mixContainer}>
                    {data.childImages.slice(0, 4).map((img, index) => (
                        <div
                            key={index}
                            className={styles.mixImage}
                            style={{
                                backgroundImage: `url(https://directus.pplethai.org/assets/${img}.jpg)`,
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div
                    className={styles.imageLayer}
                    style={{ backgroundImage: `url('/pplepolicy/placeholder_policy.png')` }}
                />
            )}

            {/* Gradient Overlay */}
            <div className={styles.overlay} />

            {/* Content Overlay */}
            <div className={styles.content}>
                <div className={styles.label} style={{ fontSize }}>
                    {data.title}
                </div>
            </div>

            {/* Loading Spinner */}
            {data.loading && <div className={styles.spinner} />}

            {/* Source Handle (Output) - Only for Folders */}
            {isFolder && !isRoot && (
                <Handle
                    type="source"
                    position={sourcePosition}
                    isConnectable={isConnectable}
                    className={styles.handle}
                />
            )}

            {/* Root Special Handles - 4 directions */}
            {isRoot && (
                <>
                    <Handle type="source" position={Position.Top} id="source-top" isConnectable={isConnectable} className={styles.handle} style={{ top: 0, left: '50%', transform: 'translate(-50%, -50%)' }} />
                    <Handle type="source" position={Position.Right} id="source-right" isConnectable={isConnectable} className={styles.handle} style={{ top: '50%', right: 0, transform: 'translate(50%, -50%)' }} />
                    <Handle type="source" position={Position.Bottom} id="source-bottom" isConnectable={isConnectable} className={styles.handle} style={{ bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }} />
                    <Handle type="source" position={Position.Left} id="source-left" isConnectable={isConnectable} className={styles.handle} style={{ top: '50%', left: 0, transform: 'translate(-50%, -50%)' }} />
                </>
            )}
        </div>
    );
};

export default memo(CustomNode);
