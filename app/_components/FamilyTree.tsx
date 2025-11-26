'use client';

import cytoscape from 'cytoscape';
import React, { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import CharacterService from '../services/CharacterService';
import cytoscapeFcose from 'cytoscape-fcose';

cytoscape.use(cytoscapeFcose);

const layoutOptions: cytoscapeFcose.FcoseLayoutOptions = {
  name: 'fcose',
  // Function for ideal edge length
  idealEdgeLength: edge => {
    switch (edge.data('relationship')) {
      case 'spouse': return 30;
      case 'parent': return 120;
      default: return 80;
    }
  },
  // Function for edge elasticity (spring stiffness)
  edgeElasticity: edge => {
    return edge.data('relationship') === 'spouse' ? 0.05 : 0.5;
  },
  // Function for node repulsion (avoid overlapping generations)
  nodeRepulsion: node => {
    return node.data('type') === 'person' ? 4000 : 10000;
  },
  nodeSeparation: 100,
  gravity: 0.25,
  animate: true
};

const styleSheet: cytoscape.StylesheetJsonBlock[] = [{
  selector: 'node[gender = "male"]',
  style: {
    'label': 'data(label)',
    'text-valign': 'center',
    'font-size': 10,
    'color': 'white',
    'width': 'label',
    'height': 'label',
    'padding': '6px',
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
    'width': 'label',
    'height': 'label',
    'padding': '6px',
    'background-color': '#FF69B4', // Hot Pink
    'shape': 'ellipse',
    'border-width': 1
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
// --- Invisible Faction Node ---
{
  selector: 'node[type = "faction"]',
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
},
{
  selector: 'edge[type = "org_member"]',
  style: {
    'curve-style': 'straight',
    'line-color': '#ccc', // Gray
    'target-arrow-shape': 'none',
    'width': 2,
  },
}]


interface FamilyTreeProps {
  characterId: number;
}

interface Participant {
  id: number;
  role: 1 | 2 | 3; // 1 for parent, 2 for child, 3 for member
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
        const unionType = union.type === 1 ? 'marriage_unit' : 'faction';
        elements.push({ data: { id: unionNodeId, type: unionType } });

        const parents = union.participants.filter(p => p.role === 1);
        const children = union.participants.filter(p => p.role === 2);
        const members = union.participants.filter(p => p.role === 3);

        // Add parent nodes and connect them to the union node.
        parents.forEach(parent => {
          if (!seenParticipants.has(parent.id)) {
            const gender = parent.sex === 1 ? 'male' : 'female';
            elements.push({
              data: { id: parent.id.toString(), gender: gender, label: parent.name }
            });
            seenParticipants.add(parent.id);
          }
          const edgeType = union.legitimate ? 'spouse' : 'affair';
          elements.push({ data: { source: parent.id.toString(), target: unionNodeId, type: edgeType, directed: false } });
        });

        // Add child nodes and connect them to the union node. 
        children.forEach(child => {
          if (!seenParticipants.has(child.id)) {
            const gender = child.sex === 1 ? 'male' : 'female';
            elements.push({ data: { id: child.id.toString(), gender: gender, label: child.name } });
            seenParticipants.add(child.id);
          }
          elements.push({ data: { source: unionNodeId, target: child.id.toString(), type: 'parent_child' } });
        });

        // Add member nodes.
        members.forEach(member => {
          if (!seenParticipants.has(member.id)) {
            const gender = member.sex === 1 ? 'male' : 'female';
            elements.push({ data: { id: member.id.toString(), gender: gender, label: member.name } });
            seenParticipants.add(member.id);
          }
          elements.push({ data: { source: unionNodeId, target: member.id.toString(), type: 'org_member' } });
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
        cy.nodes().forEach(n => {
          const parents = n.incomers('edge[relationship="parent_child"]').sources();
          if (parents.nonempty()) {
            const avgY = parents.map(p => p.position('y')).reduce((a, b) => a + b, 0) / parents.length;
            if (n.position('y') < avgY + 100)
              n.position('y', avgY + 100);
          }
        });

        const targetNode = cy.getElementById(characterId.toString());
        if (targetNode.length > 0) {
          cy.center(targetNode);
          cy.maxZoom(1.0);
          cy.minZoom(0.3);
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