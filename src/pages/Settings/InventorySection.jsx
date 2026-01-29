
import React from 'react';
import StockManager from '../../components/StockManager';

const InventorySection = ({ searchTarget }) => {
    return <StockManager initialSearch={searchTarget} />;
};

export default InventorySection;
