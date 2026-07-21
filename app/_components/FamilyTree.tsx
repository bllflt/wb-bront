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
    switch (edge.data('type')) {
      case 'spouse': return 15;
      case 'parent_child': return 120;
      case 'relationship': return 60;
      default: return 80;
    }
  },
  // Function for edge elasticity (spring stiffness)
  edgeElasticity: edge => {
    const type = edge.data('type');
    if (type === 'spouse') return 0.05;
    if (type === 'relationship') return 0.1;
    return 0.5;
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
}, {
  selector: 'node[gender = ""], node[gender = "unknown"]',
  style: {
    'label': 'data(label)',
    'text-valign': 'center',
    'font-size': 10,
    'color': 'white',
    'width': 'label',
    'height': 'label',
    'padding': '6px',
    'background-color': '#ffcb69', // Light Orange
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
{
  selector: 'edge',
  style: {
    'curve-style': 'straight',
    'line-color': '#ccc', // Gray
    'target-arrow-shape': 'none',
    'width': 2,
  },
},
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
    'curve-style': 'haystack',
    'line-color': '#ccc', // Gray
    'target-arrow-shape': 'none',
    'width': 2,
  },
},
{
  selector: 'edge[type = "relationship"]',
  style: {
    'curve-style': 'haystack',
    'line-color': '#00FF00', // Green
    'target-arrow-shape': 'none',
    'width': 2,
  },
}]


interface FamilyTreeProps {
  characterId: string;
}

interface Participant {
  id: string;
  role: string;
  sex: number;
  name: string;
}

interface Union {
  id: number;
  type: number;
  participants: Participant[];
}

interface FamilyTreeProps {
  characterId: string;
  onNodeClick: (id: string) => void;
  refreshTrigger?: number;
}


const FamilyTree: React.FC<FamilyTreeProps> = ({ characterId, onNodeClick, refreshTrigger }) => {
  const [elements, setElements] = useState<cytoscape.ElementDefinition[]>([]);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!characterId) {
      return;
    }

    const expander = (unions: Union[]): cytoscape.ElementDefinition[] => {
      const elements: cytoscape.ElementDefinition[] = [];
      const seenParticipants = new Set<string>();

      for (const union of unions) {
        // Each union from the API represents a family unit.
        // We create an invisible "union" node in the graph for it.
        const unionNodeId = `p${union.id}`;
        const unionType = union.type === 1 ? 'marriage_unit' : 'faction';

        const parents = union.participants.filter(p => ['MATE', 'PARAMOUR', 'CONCUBINE'].includes(p.role));
        const children = union.participants.filter(p => p.role === 'CHILD');
        const members = union.participants.filter(p => p.role === 'MEMBER');
        const directs = union.participants.filter(p => union.type === 2 && p.role !== 'MEMBER' && p.role !== 'CHILD' && !['MATE', 'PARAMOUR', 'CONCUBINE'].includes(p.role));

        // Create invisible node only if needed for grouping
        const needsInvisible = union.type === 1 || (union.type === 2 && members.length > 0);
        if (needsInvisible) {
          elements.push({ data: { id: unionNodeId, type: unionType } });
        }

        // Add parent nodes and connect them to the union node.
        parents.forEach(parent => {
          if (!seenParticipants.has(parent.id)) {
            const gender = {
              1: 'male',
              2: 'female',
              0: 'unknown',
              9: 'na'
            }[parent.sex] || 'unknown';
            elements.push({
              data: { id: parent.id.toString(), gender: gender, label: parent.name }
            });
            seenParticipants.add(parent.id);
          }
          // Determine edge type: affair if LIAISON and all parents are PARAMOUR, else spouse
          const isAffair = union.type === 1 && parents.every(p => p.role === 'PARAMOUR');
          const edgeType = isAffair ? 'affair' : 'spouse';
          if (union.type === 1) {
            elements.push({ data: { source: parent.id.toString(), target: unionNodeId, type: edgeType, directed: false } });
          }
        });

        // Add child nodes and connect them to the union node. 
        children.forEach(child => {
          if (!seenParticipants.has(child.id)) {
            const gender = {
              1: 'male',
              2: 'female',
              0: 'unknown',
              9: 'na'
            }[child.sex] || 'unknown';
            elements.push({ data: { id: child.id.toString(), gender: gender, label: child.name } });
            seenParticipants.add(child.id);
          }
          if (union.type === 1) {
            elements.push({ data: { source: unionNodeId, target: child.id.toString(), type: 'parent_child' } });
          }
        });

        // Add member nodes.
        members.forEach(member => {
          if (!seenParticipants.has(member.id)) {
            const gender = {
              1: 'male',
              2: 'female',
              0: 'unknown',
              9: 'na'
            }[member.sex] || 'unknown';
            elements.push({ data: { id: member.id.toString(), gender: gender, label: member.name } });
            seenParticipants.add(member.id);
          }
          if (union.type === 2) {
            elements.push({ data: { source: unionNodeId, target: member.id.toString(), type: 'org_member' } });
          }
        });

        // Add direct connections (for factions, roles like FRIEND, PROTEGE)
        directs.forEach(direct => {
          if (!seenParticipants.has(direct.id)) {
            const gender = {
              1: 'male',
              2: 'female',
              0: 'unknown',
              9: 'na'
            }[direct.sex] || 'unknown';
            elements.push({ data: { id: direct.id.toString(), gender: gender, label: direct.name } });
            seenParticipants.add(direct.id);
          }
        });

        // Create edges between direct participants for type 2 unions
        if (union.type === 2 && directs.length === 2) {
          const p1 = directs[0];
          const p2 = directs[1];
          elements.push({
            data: {
              source: p1.id.toString(),
              target: p2.id.toString(),
              type: 'relationship',
            },
          });
        }
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
  }, [characterId, refreshTrigger]); // Rerun when characterId or refreshTrigger changes

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