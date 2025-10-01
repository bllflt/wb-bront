'use client';

import React from "react";

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
          <button
            type="button"
            onClick={() => handleDelete(index)}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Delete
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="bg-blue-500 text-white px-3 py-1 rounded"
      >
        + Add Attribute
      </button>
    </div>
  );
};

export default AttributeListEditor;
