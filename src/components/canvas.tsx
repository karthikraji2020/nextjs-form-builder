"use client";

import { Header } from "@/components/header";
import { useFormStore } from "@/lib/store";
import { useEffect } from "react";

const FormBuilderCanvas = () => {
  const { fields, addField } = useFormStore();
  useEffect(() => {
    addField({
      type: "text",
      id: "2",
      label: "",
      required: false,
    });
    addField({
      type: "text",
      id: "1",
      label: "test1",
      required: true,
    });
  }, []);

  return (
    <div className="space-y-4">
      <Header />
      {fields.map((field, i) => (
        <div key={i} className="border rounded p-4">
          <label className="block font-medium mb-1">{field.label}</label>
          {/* Render input based on field.type */}
          <input
            type={field.type}
            className="border rounded px-2 py-1 w-full"
            placeholder="Field preview"
            disabled
            required={field.required}
          />
        </div>
      ))}
    </div>
  );
};

export { FormBuilderCanvas };
