import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const CategoryProducts = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const cat = categoryName ? decodeURIComponent(categoryName) : 'All';
        navigate(`/store?category=${encodeURIComponent(cat)}`, {
            state: location.state,
            replace: true
        });
    }, [categoryName, navigate, location.state]);

    return (
        <div className="min-h-screen bg-[#F7F8FA] dark:bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E5A2E]" />
        </div>
    );
};

export default CategoryProducts;
