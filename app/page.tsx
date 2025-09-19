'use client';

import { useState } from "react";
import { Button } from "react-bootstrap";

type AttributeListEditorProps = {
  initial?: string[];
  onChange?: (attributes: string[]) => void;
};

export default function AttributeListEditor({ initial = [], onChange }: AttributeListEditorProps) {
  const [attributes, setAttributes] = useState(initial);

  const update = (newList: string[]) => {
    setAttributes(newList);
    onChange?.(newList);
  };

  const addAttribute = () => update([...attributes, ""]);
  const editAttribute = (i: number, value: string) => {
    const copy = [...attributes];
    copy[i] = value;
    update(copy);
  };
  const removeAttribute = (i: number) => {
    update(attributes.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      {attributes.map((attr, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            className="border rounded p-2 flex-1"
            value={attr}
            onChange={(e) => editAttribute(i, e.target.value)}
            placeholder="Describe a physical trait..."
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeAttribute(i)}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addAttribute}>
        + Add Attribute
      </Button>
    </div>
  );
}
