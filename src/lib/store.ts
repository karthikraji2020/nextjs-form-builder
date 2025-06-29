import { create } from "zustand";

interface Field {
  id: string;
  type: "text" | "textarea" | "select";
  label: string;
  required: boolean;
}

interface FormState {
  fields: Field[];
  addField: (field: Field) => void;
}

export const useFormStore = create<FormState>((set) => ({
  fields: [],
  addField: (field) => set((state) => ({ fields: [...state.fields, field] })),
}));
