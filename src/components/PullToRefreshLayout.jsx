
import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useData } from '../context/DataContext';

const PullToRefreshLayout = ({ children }) => {
    const { refreshData } = useData();

    const handleRefresh = async () => {
        try {
            await refreshData();
        } catch (error) {
            console.error("Refresh failed:", error);
        }
    };

    return (
        <PullToRefresh
            onRefresh={handleRefresh}
            pullingContent={
                <div className="flex justify-center py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 text-sm font-medium animate-pulse">
                        Pull to refresh...
                    </span>
                </div>
            }
            refreshingContent={
                <div className="flex justify-center py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            }
            backgroundColor="transparent"
        >
            <div className="w-full">
                {children}
            </div>
        </PullToRefresh>
    );
};

export default PullToRefreshLayout;
