import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { PolicyNode, ContentBlock } from '@/types/policy';
import { usePolicy } from '@/services/policy';
import styles from './PolicyDetail.module.css';

interface PolicyDetailProps {
    node: PolicyNode | null;
    breadcrumbs?: PolicyNode[];
    onClose: () => void;
}

const PolicyDetail = ({ node, breadcrumbs = [], onClose }: PolicyDetailProps) => {
    const { policy, isLoading } = usePolicy(
        node ? (node as any).level || 3 : 0,
        node?.slug || ''
    );

    const displayPolicy = policy || node;

    if (!node) return null;

    return (
        <div className={`${styles.panel} ${node ? styles.open : ''}`}>
            <div className={styles.header}>
                <div className={styles.breadcrumbs}>
                    {breadcrumbs.map((bc, idx) => (
                        <span key={bc.id} className={styles.breadcrumbItem}>
                            {bc.title}
                            {idx < breadcrumbs.length - 1 && <ChevronRight size={14} />}
                        </span>
                    ))}
                </div>
                <div className={styles.headerTop}>
                    <h2 className={styles.title}>{displayPolicy?.title || 'Loading...'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                {isLoading ? (
                    <div className={styles.loading}>Loading policy details...</div>
                ) : (
                    <>
                        {displayPolicy?.image && (
                            <img
                                src={`https://directus.pplethai.org/assets/${displayPolicy.image}.jpg`}
                                alt={displayPolicy.title}
                                style={{
                                    width: '100%',
                                    borderRadius: '8px',
                                    marginBottom: '24px',
                                    display: 'block'
                                }}
                            />
                        )}

                        {displayPolicy?.summary && (
                            <div className={styles.summary}>
                                {displayPolicy.summary}
                            </div>
                        )}

                        {displayPolicy?.contentBlocks && (
                            <div className={styles.blocks}>
                                {displayPolicy.contentBlocks.map((block: ContentBlock, idx: number) => (
                                    <div key={idx} className={styles.block}>
                                        {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
                                        <div dangerouslySetInnerHTML={{ __html: block.content }} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {displayPolicy?.content && !displayPolicy?.contentBlocks && (
                            <div
                                className={styles.rawContent}
                                dangerouslySetInnerHTML={{ __html: displayPolicy.content }}
                            />
                        )}


                    </>
                )}
            </div>
        </div>
    );
};

export default PolicyDetail;
