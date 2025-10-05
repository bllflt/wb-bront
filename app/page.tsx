'use client';

import React, { useRef, useEffect } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { Stylesheet } from 'cytoscape';

// Register the Dagre layout extension
cytoscape.use(dagre);

// 1. Define the data structure for the elements
// We use special 'Family Unit' nodes to connect parents and children,
// which is a common pattern for displaying complex parent-child links in graph libraries.

const initialElements = [
  // Generation 1 (Grandparents)
  { data: { id: 'm1', label: 'Grandpa John', gender: 'male' } },
  { data: { id: 'f1', label: 'Grandma Mary', gender: 'female' } },
  // Marriage Unit 1 (Invisible node to represent the couple/family)
  { data: { id: 'mu1', parent: 'g1_family', type: 'marriage_unit' } },
  { data: { id: 'm2', label: 'Uncle Tom', gender: 'male' } }, // Child 1
  { data: { id: 'f2', label: 'Aunt Jane', gender: 'female' } }, // Child 2

  // Generation 2 (Parents)
  { data: { id: 'm3', label: 'Dad Robert', gender: 'male' } },
  { data: { id: 'f3', label: 'Mom Sarah', gender: 'female' } },
  // Marriage Unit 2
  { data: { id: 'mu2', parent: 'g2_family', type: 'marriage_unit' } },

  // Generation 3 (Child)
  { data: { id: 'c1', label: 'Child David', gender: 'male' } },

  // Edges: Connections represent relationships

  // 1. Marriage/Spousal Edges (Horizontal lines connecting individuals to their marriage unit)
  { data: { source: 'm1', target: 'mu1', type: 'spouse' } },
  { data: { source: 'f1', target: 'mu1', type: 'spouse' } },

  { data: { source: 'm3', target: 'mu2', type: 'spouse' } },
  { data: { source: 'f3', target: 'mu2', type: 'spouse' } },

  // 2. Parent-Child Edges (Vertical lines connecting marriage units to children)
  // Grandparents to their children (Uncle Tom and Aunt Jane)
  { data: { source: 'mu1', target: 'm2', type: 'parent_child' } },
  { data: { source: 'mu1', target: 'f2', type: 'parent_child' } },
  // Grandparents to their child (Dad Robert - linking through an intermediate parent unit)
  // NOTE: This example focuses on the m3/f3 -> c1 relationship for simplicity in the smaller tree,
  // but a complete tree would link m3's parents to m3 (e.g., mu1 -> m3)

  // Parents to their child
  { data: { source: 'mu2', target: 'c1', type: 'parent_child' } },
];

// 2. Define the Cytoscape Stylesheet for conventions
const styleSheet: Stylesheet[] = [
  // --- Node Styles (People) ---
  {
    selector: 'node[gender = "male"]',
    style: {
      'background-color': '#1E90FF', // Dodger Blue
      'shape': 'square',
      'label': 'data(label)',
      'text-valign': 'center',
      'color': 'white',
      'width': 80,
      'height': 40,
      'font-size': 10,
    },
  },
  {
    selector: 'node[gender = "female"]',
    style: {
      'background-color': '#FF69B4', // Hot Pink
      'shape': 'circle',
      'label': 'data(label)',
      'text-valign': 'center',
      'color': 'white',
      'width': 60,
      'height': 60,
      'font-size': 10,
    },
  },

  // --- Invisible Marriage Unit Node ---
  {
    selector: 'node[type = "marriage_unit"]',
    style: {
      'background-color': '#fff', // Transparent background
      'border-width': 0,
      'width': 1,
      'height': 1,
      'label': '',
      'opacity': 0, // Make the node invisible
    },
  },

  // --- Edge Styles (Relationships) ---
  // Spouse/Marriage Line (Horizontal)
  {
    selector: 'edge[type = "spouse"]',
    style: {
      'curve-style': 'bezier', // Dagre layout uses straight lines for edges
      'line-color': '#ccc', // Gray
      'target-arrow-shape': 'none',
      'width': 2,
    },
  },
  // Parent-Child Line (Vertical)
  {
    selector: 'edge[type = "parent_child"]',
    style: {
      'curve-style': 'taxi', // Forces a straight connection, often vertical in Dagre
      'taxi-direction': 'downward',
      'line-color': '#000', // Black
      'target-arrow-shape': 'none',
      'width': 2,
    },
  },
];

// 3. Define the Dagre Layout
// Dagre is a directed graph layout, excellent for hierarchical data (top-down flow).
// We use the 'parent_child' edges to define the hierarchy (downward flow).
const layoutOptions = {
  name: 'dagre',
  rankDir: 'TB', // Top-to-Bottom (Generations flow downward)
  rankSep: 60,   // Separation between ranks (generations)
  nodeSep: 20,   // Horizontal separation between nodes in the same rank
  padding: 10,
  // Other Dagre options can be tweaked for better results
  // e.g., 'align', 'nodeSep', 'edgeSep'
};

const FamilyTree: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '800px',
    border: '1px solid #ccc',
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Family Tree Example (React-Cytoscapejs)</h2>
      <div style={containerStyle}>
        <CytoscapeComponent
          elements={initialElements}
          stylesheet={styleSheet}
          layout={layoutOptions}
          // The cy instance is available for more advanced control if needed
          cy={(cy) => {
            // cy.fit(); // You can call methods on the cytoscape instance here
          }}
          // Basic component style
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default FamilyTree;