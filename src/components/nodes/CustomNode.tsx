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
    level?: number;
    isHighlighted?: boolean;
    isDimmed?: boolean;
}

const CustomNode = ({ data, id, isConnectable }: NodeProps<CustomNodeData>) => {
    const isFolder = data.type === 'Folder';
    const imageUrl = data.image
        ? `https://directus.pplethai.org/assets/${data.image}.jpg`
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
            {/* Target Handle (Input) */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className={styles.handle}
            />

            {/* Background Image or Fallback */}
            {/* Background Image or Fallback */}
            <div
                className={styles.imageLayer}
                style={{ backgroundImage: `url(${imageUrl || '/placeholder_policy.png'})` }}
            />

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
            {isFolder && (
                <Handle
                    type="source"
                    position={Position.Right}
                    isConnectable={isConnectable}
                    className={styles.handle}
                />
            )}
        </div>
    );
};

export default memo(CustomNode);
