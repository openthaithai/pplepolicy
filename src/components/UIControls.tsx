import React from 'react';
import { Search } from 'lucide-react';

import { PolicyNode } from '@/types/policy';

interface UIControlsProps {
    onCenter: () => void;
    onSearchSelect: (node: PolicyNode) => void;
}


interface SearchResult {
    slug: string;
    title: string;
    summary: string;
    type: "Folder" | "File";
    level: number;
    searchText: string;
    image?: string;
}

const UIControls = ({ onCenter, onSearchSelect }: UIControlsProps) => {
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
    const [index, setIndex] = React.useState<SearchResult[]>([]);
    const [isLoadingIndex, setIsLoadingIndex] = React.useState(false);

    React.useEffect(() => {
        if (isSearchOpen && index.length === 0) {
            setIsLoadingIndex(true);
            fetch('/search-index.json')
                .then(res => res.json())
                .then(data => {
                    setIndex(data);
                    setIsLoadingIndex(false);
                })
                .catch(err => {
                    console.error('Failed to load search index', err);
                    setIsLoadingIndex(false);
                });
        }
    }, [isSearchOpen]);

    React.useEffect(() => {
        if (searchTerm.trim() === '' || index.length === 0) {
            setSearchResults([]);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const results = index.filter(item =>
            item.title.toLowerCase().includes(lowerTerm) ||
            item.searchText.includes(lowerTerm)
        ).slice(0, 50); // Limit to 50 results

        setSearchResults(results);
    }, [searchTerm, index]);

    const handleSelect = (item: SearchResult) => {
        onSearchSelect({
            id: -1, // ID not needed for simple display
            slug: item.slug,
            title: item.title,
            type: item.type,
            level: item.level,
            summary: item.summary
        } as PolicyNode);
        setIsSearchOpen(false);
        setSearchTerm('');
    };

    return (
        <>
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 10
            }}>
                <button
                    onClick={() => setIsSearchOpen(true)}
                    style={{
                        background: 'white',
                        padding: '8px 16px',
                        borderRadius: '24px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-prompt)',
                        fontSize: '14px',
                        color: '#666',
                        fontWeight: 500
                    }}
                >
                    <Search size={16} />
                    Search Policy
                </button>
            </div>

            <div style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 10
            }}>
                <button
                    onClick={onCenter}
                    style={{
                        background: 'white',
                        padding: '8px 16px',
                        borderRadius: '24px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-prompt)',
                        fontSize: '14px',
                        color: '#666',
                        fontWeight: 500
                    }}
                >
                    Reset View
                </button>
            </div>

            {isSearchOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 2000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    paddingTop: '100px',
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setIsSearchOpen(false)}>
                    <div style={{
                        width: '600px',
                        maxWidth: '90%',
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        maxHeight: '70vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
                            <Search size={20} color="#999" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search policy name or content..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '16px',
                                    flex: 1,
                                    fontFamily: 'var(--font-prompt)'
                                }}
                            />
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {isLoadingIndex && <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading index...</div>}

                            {!isLoadingIndex && searchTerm && searchResults.length === 0 && (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No results found</div>
                            )}

                            {searchResults.map((result, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(result)}
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        borderBottom: '1px solid #f5f5f5',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'start'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                    {result.image ? (
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            background: '#eee'
                                        }}>
                                            <img
                                                src={`https://directus.pplethai.org/assets/${result.image}.jpg`}
                                                alt={result.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    ) : (
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '6px',
                                            background: '#f0f0f0',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Search size={20} color="#ccc" />
                                        </div>
                                    )}

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '15px', color: '#333', fontFamily: 'var(--font-prompt)' }}>{result.title}</div>
                                        {result.summary && (
                                            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'var(--font-prompt)' }}>
                                                {result.summary}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontFamily: 'var(--font-prompt)' }}>
                                            {result.type} • Level {result.level}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UIControls;
