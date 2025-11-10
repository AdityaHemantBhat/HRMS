import React, { useState, useEffect, useRef } from 'react';
import { Alert } from 'antd';
import { ArrowRight } from 'lucide-react';

const MobileTableWrapper = ({ children }) => {
  const [showScrollHint, setShowScrollHint] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    const checkIfScrollable = () => {
      if (tableRef.current) {
        const { scrollWidth, clientWidth } = tableRef.current;
        setShowScrollHint(scrollWidth > clientWidth && window.innerWidth <= 768);
      }
    };

    checkIfScrollable();
    window.addEventListener('resize', checkIfScrollable);
    
    return () => window.removeEventListener('resize', checkIfScrollable);
  }, [children]);

  const handleScroll = () => {
    if (tableRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        setShowScrollHint(false);
      }
    }
  };

  return (
    <div>
      {showScrollHint && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowRight size={16} />
              <span>Swipe left to see more columns</span>
            </div>
          }
          type="info"
          closable
          onClose={() => setShowScrollHint(false)}
          style={{ marginBottom: 12 }}
        />
      )}
      <div
        ref={tableRef}
        onScroll={handleScroll}
        style={{
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileTableWrapper;
