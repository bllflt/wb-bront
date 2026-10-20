'use client';

import React from "react";
import Button from 'react-bootstrap/Button';

interface AttributeListEditorProps {
  attributes: string[];
  onChange: (newAttributes: string[]) => void;
}

const AttributeListEditor: React.FC<AttributeListEditorProps> = ({ attributes, onChange }) => {
  // Handle change of a single attribute
  const handleAttributeChange = (index: number, value: string) => {
    const updated = [...attributes];
    updated[index] = value;
    onChange(updated);
  };

  // Delete an attribute
  const handleDelete = (index: number) => {
    const updated = attributes.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Add a new attribute
  const handleAdd = () => {
    onChange([...attributes, ""]);
  };

  return (
    <div className="space-y-2">
      {attributes.map((attr, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={attr}
            onChange={(e) => handleAttributeChange(index, e.target.value)}
            className="border rounded px-2 py-1 flex-grow"
            placeholder={`Attribute ${index + 1}`}
          />
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDelete(index)}
          >
            -
          </Button>
        </div>
      ))}
      <Button
        variant="primary"
        onClick={handleAdd}
      >
        + Add Attribute
      </Button>
    </div>
  );
};

export default AttributeListEditor;
