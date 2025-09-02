import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button.jsx';
import { FaSpinner, FaChevronDown } from 'react-icons/fa';

const LoadMore = ({ 
  items, 
  itemsPerPage = 20, 
  onLoadMore, 
  hasMore = true,
  loading = false,
  children,
  className = "",
  autoLoad = true
}) => {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const loadMoreRef = useRef(null);

  // Initialize with first page of items
  useEffect(() => {
    if (items.length > 0 && !isInitialized) {
      const initialItems = items.slice(0, itemsPerPage);
      setDisplayedItems(initialItems);
      setCurrentPage(1);
      setIsInitialized(true);
    }
  }, [items, itemsPerPage, isInitialized]);

  // Reset when items change (e.g., search results)
  useEffect(() => {
    if (items.length > 0) {
      const initialItems = items.slice(0, itemsPerPage);
      setDisplayedItems(initialItems);
      setCurrentPage(1);
      setIsInitialized(true);
    } else {
      setDisplayedItems([]);
      setCurrentPage(1);
      setIsInitialized(false);
    }
  }, [items, itemsPerPage]);

  // Check if there are more items to load
  const hasMoreItems = displayedItems.length < items.length;

  const handleLoadMore = async () => {
    if (isLoading || !hasMoreItems) return;
    
    setIsLoading(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Calculate next page items
    const nextPage = currentPage + 1;
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const nextBatch = items.slice(startIndex, endIndex);
    
    // Add next batch to displayed items
    setDisplayedItems(prev => [...prev, ...nextBatch]);
    setCurrentPage(nextPage);
    
    // Call the onLoadMore callback if provided
    if (onLoadMore) {
      await onLoadMore();
    }
    
    setIsLoading(false);
  };

  // Auto-load more when scrolling near the bottom
  useEffect(() => {
    if (!autoLoad) return;
    
    const handleScroll = () => {
      if (!loadMoreRef.current || isLoading || !hasMoreItems) return;
      
      const rect = loadMoreRef.current.getBoundingClientRect();
      const isVisible = rect.top <= window.innerHeight + 300; // Load when 300px away
      
      if (isVisible) {
        handleLoadMore();
      }
    };

    // Throttle scroll events for better performance
    let timeoutId;
    const throttledHandleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        handleScroll();
        timeoutId = null;
      }, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll);
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, hasMoreItems, autoLoad]);

  return (
    <div className={className}>
      {/* Render children with displayed items */}
      {children(displayedItems)}
      
      {/* Load More Section */}
      {hasMoreItems && (
        <div ref={loadMoreRef} className="flex flex-col items-center justify-center py-8">
          <div className="text-center space-y-4">
            {/* Items count info */}
            <div className="text-sm text-gray-600">
              Showing {displayedItems.length} of {items.length} items
            </div>
            
                         {/* Load More Button */}
             <Button
               onClick={handleLoadMore}
               disabled={isLoading}
               className="
                 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg
                 transition-colors duration-200 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2
                 disabled:bg-blue-400 disabled:cursor-not-allowed
                 flex items-center gap-2
               "
             >
               {isLoading ? (
                 <>
                   <FaSpinner className="w-4 h-4 animate-spin" />
                   Loading More...
                 </>
               ) : (
                 <>
                   <FaChevronDown className="w-4 h-4" />
                   Load More ({Math.min(itemsPerPage, items.length - displayedItems.length)} more items)
                 </>
               )}
             </Button>
            
            {/* Progress bar */}
            <div className="w-64 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(displayedItems.length / items.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* End of results message */}
      {!hasMoreItems && items.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="text-lg font-medium text-gray-700">
              All items loaded
            </div>
            <div className="text-sm text-gray-500">
              You've reached the end of the results ({items.length} total items)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadMore;
