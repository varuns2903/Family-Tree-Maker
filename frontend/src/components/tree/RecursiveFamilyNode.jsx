import React, { useState } from 'react';
import NodeCard from './NodeCard';

// 1. Helper: Renders the Bridge + Spouse (Right Side)
const SpouseBranch = ({ spouse, childrenNodes, onNodeClick }) => {
  const hasChildren = childrenNodes && childrenNodes.length > 0;

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      
      {/* THE BRIDGE: Sits between Main Person and Spouse */}
      <div className="bridge-container">
        <div className={`marriage-line ${hasChildren ? "has-children" : ""}`}></div>
        {hasChildren && (
          <div className="bridge-children">
            <div className="siblings-row">
              {childrenNodes}
            </div>
          </div>
        )}
      </div>

      {/* THE SPOUSE */}
      <NodeCard person={spouse} onClick={onNodeClick} />
    </div>
  );
};


// 2. Main Component
const RecursiveFamilyNode = ({ person, onNodeClick }) => {
  const [activeSpouseIndex, setActiveSpouseIndex] = useState(0);

  if (!person) return null;

  const spouses = person.spouses || [];
  const activeSpouse = spouses[activeSpouseIndex];

  const handleToggleSpouse = (direction) => {
    setActiveSpouseIndex((prev) => {
      let next = prev + direction;
      if (next < 0) next = spouses.length - 1;
      if (next >= spouses.length) next = 0;
      return next;
    });
  };

  // Generate Children
  let childrenElements = null;
  if (activeSpouse && activeSpouse.children) {
    childrenElements = activeSpouse.children.map((child) => (
      <div className="branch-node" key={child.id}>
        <RecursiveFamilyNode person={child} onNodeClick={onNodeClick} />
      </div>
    ));
  }

  // --- RENDER LOGIC ---

  // Scenario A: Single
  if (spouses.length === 0) {
    return (
      <NodeCard person={person} onClick={onNodeClick} />
    );
  }

  // Scenario B: Married
  return (
    <div className="married-wrapper">
      
      {/* 1. LEFT SPACER (For Balance) */}
      <div className="spacer-node" />

      {/* 2. CENTER NODE (Main Person) */}
      <NodeCard 
        person={person} 
        spouses={spouses}
        activeSpouseIndex={activeSpouseIndex}
        onToggleSpouse={handleToggleSpouse}
        onClick={onNodeClick}
      />

      {/* 3. RIGHT BRANCH (Bridge + Spouse) */}
      {/* FIX: Removed the empty <div className="bridge-container"> that was here */}
      
      <SpouseBranch 
        spouse={activeSpouse}
        childrenNodes={childrenElements}
        onNodeClick={onNodeClick}
      />

    </div>
  );
};

export default RecursiveFamilyNode;