import React from 'react';
import { Search } from 'lucide-react';

interface UIControlsProps {
    onCenter: () => void;
}

const UIControls = ({ onCenter }: UIControlsProps) => {
    return (
        <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 10
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
    );
};

export default UIControls;
