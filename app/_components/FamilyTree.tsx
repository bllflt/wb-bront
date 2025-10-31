'use client';

import cytoscape from 'cytoscape';
import klay from 'cytoscape-klay';
import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import CharacterService from '../services/CharacterService';

cytoscape.use(klay);

interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    type?: string;
    parent?: string;
  };
}

interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label?: string;
  };
}

const layoutOptions = {
  name: 'klay',
  klay: {
    direction: "DOWN",
    edgeRouting: "POLYLINE",
    layoutHierarchy: true,
    borderSpacing: 40,
    spacing: 70,
    inLayerSpacingFactor: 1.3,
    nodePlacement: 'BRANDES_KOEPF',
    separateConnectedComponents: false 
  }
};


const styleSheet = [{
  selector: 'node[gender = "male"]',
  style: {
    'label': 'data(label)',
    'text-valign': 'center',
    'font-size': 10,
    'color': 'white',
    'width': 80,
    'height': 40,
    'background-color': '#1E90FF', // Dodger Blue
    'border-width': 1,
    'shape': 'rectangle'
  }
}, {
  selector: 'node[gender = "female"]',
  style: {
    'label': 'data(label)',
    'text-valign': 'center',
    'font-size': 10,
    'color': 'white',
    'width': 60,
    'height': 60,
    'background-color': '#FF69B4', // Hot Pink
    'shape': 'ellipse',
    'border-width': 1
  },
},

// --- Invisible Marriage Unit Node ---
{
  selector: 'node[type = "marriage_unit"]',
  style: {
    'background-opacity': 0,
    'border-opacity': 0,
    shape: 'rectangle',
    padding: '20',
    width: 'label',
    height: 'label'
  },
},

// --- Edge Styles (Relationships) ---
// Spouse/Marriage Line (Horizontal)
{
  selector: 'edge[type = "spouse"]',
  style: {
    'curve-style': 'straight',
    'line-color': '#ccc', // Gray
    'target-arrow-shape': 'none',
    'width': 2,
  },
},
{
  selector: 'edge[type = "affair"]',
  style: {
    'curve-style': 'straight',
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
    'curve-style': 'taxi',
    'taxi-direction': 'downward',
    'line-color': '#000', // Black
    'target-arrow-shape': 'none',
    'width': 2,
  },
}]


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
        const unionType = union.type === 1 ? 'marriage_unit' : 'lumberjack';
        elements.push({ data: { id: unionNodeId, type: unionType } });

        const parents = union.participants.filter(p => p.role === 1);
        const children = union.participants.filter(p => p.role === 2);

        // Add parent nodes and connect them to the union node.
        parents.forEach(parent => {
          if (!seenParticipants.has(parent.id)) {
            const gender = parent.sex === 1 ? 'male' : 'female';
            elements.push({
              data: { id: parent.id.toString(), gender: gender, label: parent.name, parent: unionNodeId }
            });
            seenParticipants.add(parent.id);
          }
        });
        const [first, ...rest] = parents
        rest.forEach(parent => {
          const edgeType = union.legitimate ? 'spouse' : 'affair';
          elements.push({ data: { source: first.id.toString(), target: parent.id.toString(), type: edgeType } });
        })


        // Add child nodes and connect them to the union node. 
        children.forEach(child => {
          if (!seenParticipants.has(child.id)) {
            const gender = child.sex === 1 ? 'male' : 'female';
            elements.push({ data: { id: child.id.toString(), gender: gender, label: child.name } });
            seenParticipants.add(child.id);
          }
          elements.push({ data: { source: unionNodeId, target: child.id.toString(), type: 'parent_child' } });
        });
      }
      return elements;
    };


    const retrieveCharacterConnections = () => {
      CharacterService.getCharacterConnections(characterId, 3)
        .then(response => {
          const elements = expander(response.data as Union[]);
          setElements(elements);
        })
        .catch(e => {
          console.log(e);
        });
    };

    retrieveCharacterConnections();
  }, [characterId]); // Rerun when characterId changes

  useEffect(() => {
    if (cy && elements.length > 0) {
      cy.layout(layoutOptions).run();

      cy.ready(() => {
        const targetNode = cy.getElementById(characterId.toString());
        if (targetNode.length > 0) {
          console.log(targetNode);
          cy.center(targetNode);
          cy.zoom(0.5);
        } else {
          cy.fit(undefined, 30); // Fallback if the node isn't found
        }
      });

      cy.on('tap', 'node', (event) => {
        const nodeId = event.target.id();
        // Filter out taps on the invisible union nodes
        if (nodeId && !nodeId.startsWith('p')) {
          onNodeClick(nodeId);
        }
      });
    }
  }, [cy, elements, onNodeClick, characterId]); // Rerun when cy, elements, or characterId change

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: '1px solid #ccc',
  };

  return (
    <div style={containerStyle}>
      <CytoscapeComponent
        elements={elements}
        stylesheet={styleSheet}
        cy={setCy}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default FamilyTree;