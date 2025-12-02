import React from 'react';
import RecursiveFamilyNode from './RecursiveFamilyNode';
import '../../styles/treeStyles.css';

const FamilyTree = ({ data, onNodeClick }) => {
  if (!data) return null;

  return (
    <div className="tree-canvas">
      
      {/* FIX: We removed <div className="children-wrapper"><div className="branch-node"> 
         The Root node should NOT have a branch line going up.
      */}
      
      <RecursiveFamilyNode person={data} onNodeClick={onNodeClick} />

    </div>
  );
};

export default FamilyTree;