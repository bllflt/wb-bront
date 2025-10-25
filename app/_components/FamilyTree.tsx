'use client';

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import CharacterService from '../services/CharacterService';

// Register the Dagre layout extension
cytoscape.use(dagre);

// 1. Define the data structure for the elements

// 2. Define the Cytoscape Stylesheet for conventions
const styleSheet: cytoscape.Stylesheet[] = [
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
  {
    selector: 'edge[type = "affair"]',
    style: {
      'curve-style': 'bezier', // Dagre layout uses straight lines for edges
      'line-color': '#ccc', // Gray
      'target-arrow-shape': 'none',
      'width': 2,
      'line-style': 'dashed',
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
  rankDir: 'TB',
  rankSep: 120, // Increase vertical separation between generations
  nodeSep: 50,  // Horizontal separation between nodes in the same rank
  padding: 40,
  align: 'UL',  // Align nodes in the same rank to the upper-left
  // align: 'UL', // Removing align often gives a more centered look
  // Other Dagre options can be tweaked for better results
  // e.g., 'align', 'nodeSep', 'edgeSep'
};

interface FamilyTreeProps {
  characterId: number;
}

interface Participant {
  id: number;
  role: 1 | 2; // 1 for parent, 2 for child
  sex: number;
  name: string;
}

interface Union {
  id: number;
  type: number;
  legitimate: boolean;
  participants: Participant[];
}

interface FamilyTreeProps {
  characterId: number;
  onNodeClick: (id: string) => void;
}


const FamilyTree: React.FC<FamilyTreeProps> = ({ characterId, onNodeClick }) => {
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!characterId) {
      return;
    }

    const expander = (unions: Union[]): cytoscape.ElementDefinition[] => {
      const elements: cytoscape.ElementDefinition[] = [];
      const seenParticipants = new Set<number>();

      for (const union of unions) {
        // Each union from the API represents a family unit.
        // We create an invisible "union" node in the graph for it.
        const unionNodeId = `p${union.id}`;
        elements.push({ data: { id: unionNodeId, type: union.type } });

        const parents = union.participants.filter(p => p.role === 1);
        const children = union.participants.filter(p => p.role === 2);

        // Add parent nodes and connect them to the union node.
        parents.forEach(parent => {
          if (!seenParticipants.has(parent.id)) {
            elements.push({ data: { id: parent.id.toString(), gender: parent.sex, label: parent.name } });
            seenParticipants.add(parent.id);
          }
          // An edge of type 1 is a marriage, type 2 is an affair.
          const edgeType = union.legitimate ? 1 : 2;
          elements.push({ data: { source: parent.id, target: unionNodeId, type: edgeType } });
        });

        // Add child nodes and connect them to the union node.
        children.forEach(child => {
          if (!seenParticipants.has(child.id)) {
            elements.push({ data: { id: child.id.toString(), gender: child.sex, label: child.name } });
            seenParticipants.add(child.id);
          }
          // An edge of type 3 represents a parent-child relationship.
          elements.push({ data: { source: child.id, target: unionNodeId, type: 3 } });
        });
      }

      return elements;
    };


    const retrieveCharacterConnections = () => {
      CharacterService.getCharacterConnections(characterId, 3)
        .then(response => {
          const elements = expander(response.data as Union[]);
          const compoundNodes: cytoscape.ElementDefinition[] = [];

          const processedElements = elements.map((el: any) => {
            const newEl = { data: { ...el.data } }; // Create a mutable copy

            // Process Genders and Node Types
            if (!newEl.data.source) {
              if (newEl.data.hasOwnProperty('gender')) {
                if (newEl.data.gender === 1) newEl.data.gender = 'male';
                if (newEl.data.gender === 2) newEl.data.gender = 'female';
              }
              if (newEl.data.type === 1 || newEl.data.type === 2) {
                newEl.data.type = 'marriage_unit';
              }
            }

            // Process Edge Types and create compound nodes
            if (newEl.data.source) {
              if (newEl.data.type === 1) newEl.data.type = 'spouse';
              if (newEl.data.type === 2) newEl.data.type = 'affair';
              if (newEl.data.type === 3) newEl.data.type = 'parent_child';

              // Group spouses and marriage units into a compound parent
              if (newEl.data.type === 'spouse' || newEl.data.type === 'affair') {
                const parentId = `family-${newEl.data.target}`;
                const sourceNode = elements.find((e: any) => e.data.id === newEl.data.source);
                const targetNode = elements.find((e: any) => e.data.id === newEl.data.target);
                if (sourceNode) sourceNode.data.parent = parentId;
                if (targetNode) targetNode.data.parent = parentId;
                if (!compoundNodes.some(n => n.data.id === parentId)) {
                  compoundNodes.push({ data: { id: parentId } });
                }
              }
            }
            return newEl;
          });
          setElements([...compoundNodes, ...processedElements]);
        })
        .catch(e => {
          console.log(e);
        });
    };

    retrieveCharacterConnections();
  }, [characterId]); // Rerun when characterId changes

  useEffect(() => {
    if (cy && elements.length > 0) {
      // Once the layout is done, fit the viewport to the graph
      cy.ready(() => {
        cy.fit(undefined, 30); // 30px padding
      });
      cy.on('tap', 'node', (event) => {
        const nodeId = event.target.id();
        if (nodeId) {
          onNodeClick(nodeId);
        }
      });
    }
  }, [cy, elements]); // Rerun when cy or elements change

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '800px',
    border: '1px solid #ccc',
  };

  return (
    <div style={containerStyle}>
      <CytoscapeComponent
        elements={elements}
        stylesheet={styleSheet}
        layout={layoutOptions}
        cy={setCy}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default FamilyTree;