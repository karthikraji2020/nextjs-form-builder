import { create } from "zustand";

import {
  arrayMove
} from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { devtools, persist } from "zustand/middleware";


// interface Field {
//   id: string;
//   type: "text" | "textarea" | "select";
//   label: string;
//   required: boolean;
// }

// interface FormState {
//   fields: Field[];
//   addField: (field: Field) => void;
// }

// export const useFormStore = create<FormState>((set) => ({
//   fields: [],
//   addField: (field) => set((state) => ({ fields: [...state.fields, field] })),
// }));



// 1. --- TYPES ---

interface FormElementBase {
  id: string;
  label: string;
  required?: boolean;
}

interface TextElement extends FormElementBase {
  type: "text";
  value: string;
}

interface TextareaElement extends FormElementBase {
  type: "textarea";
  value: string;
}

interface CheckboxElement extends FormElementBase {
  type: "checkbox";
  value: boolean;
}

interface EmailElement extends FormElementBase {
  type: "email";
  value: string;
}

interface NumberElement extends FormElementBase {
  type: "number";
  value: number | "";
}

interface SelectElement extends FormElementBase {
  type: "select";
  value: string;
  options: string[];
}

interface RadioElement extends FormElementBase {
  type: "radio";
  value: string;
  options: string[];
}

interface SubmitElement {
  id: string;
  type: "submit";
  label: string;
}

export type FormElement =
  | TextElement
  | TextareaElement
  | CheckboxElement
  | EmailElement
  | NumberElement
  | SelectElement
  | RadioElement
  | SubmitElement;

export type FormElementType = FormElement["type"];

export const elementTypes: {
  type: Exclude<FormElementType, "submit">;
  label: string;
}[] = [
  { type: "text", label: "Text Input" },
  { type: "textarea", label: "Textarea" },
  { type: "checkbox", label: "Checkbox" },
  { type: "email", label: "Email" },
  { type: "number", label: "Number" },
  { type: "select", label: "Select" },
  { type: "radio", label: "Radio Group" },
];
/* eslint-disable  @typescript-eslint/no-explicit-any */
const formElementDefaults: Record<Exclude<FormElementType, "submit">, any> = {
  text: { label: "Text Input", required: false, value: "" },
  textarea: { label: "Textarea", required: false, value: "" },
  checkbox: { label: "Checkbox", required: false, value: false },
  email: { label: "Email", required: false, value: "" },
  number: { label: "Number", required: false, value: "" },
  select: {
    label: "Select Dropdown",
    required: false,
    value: "",
    options: ["Option 1", "Option 2"],
  },
  radio: {
    label: "Radio Group",
    required: false,
    value: "",
    options: ["Option 1", "Option 2"],
  },
};

interface FormStore {
  elements: FormElement[];
  addElement: (type: Exclude<FormElementType, "submit">) => void;
  updateElement: (id: string, updated: Partial<FormElement>) => void;
  removeElement: (id: string) => void;
  reorderElements: (oldIndex: number, newIndex: number) => void;
  reset: () => void;
}

export const useFormStore = create<FormStore>()(
  devtools(
    persist(
      (set) => ({
        elements: [
          {
            id: "submit-button",
            type: "submit",
            label: "Submit",
          },
        ],
        addElement: (type) =>
          set((state) => {
            const sameTypeCount = state.elements.filter(
              (el) => el.type === type
            ).length;
            const baseLabel = formElementDefaults[type].label;
            const label = `${baseLabel} ${sameTypeCount + 1}`;
            const newElement = {
              id: uuidv4(),
              type,
              ...formElementDefaults[type],
              label,
            };
            return {
              elements: [
                ...state.elements.filter((el) => el.type !== "submit"),
                newElement,
                ...state.elements.filter((el) => el.type === "submit"),
              ],
            };
          }),
        updateElement: (id, updated) =>
          set((state) => ({
            elements: state.elements.map((el) =>
              el.id === id ? ({ ...el, ...updated } as FormElement) : el
            ),
          })),
        removeElement: (id) =>
          set((state) => ({
            elements: state.elements.filter((el) => el.id !== id),
          })),
        reorderElements: (oldIndex, newIndex) =>
          set((state) => {
            const filtered = state.elements.filter(
              (el) => el.type !== "submit"
            );
            const submitEl = state.elements.find((el) => el.type === "submit")!;
            const reordered = arrayMove(filtered, oldIndex, newIndex);
            return { elements: [...reordered, submitEl] };
          }),
        reset: () =>
          set(() => ({
            elements: [
              {
                id: "submit-button",
                type: "submit",
                label: "Submit",
              },
            ],
          })),
      }),
      {
        name: "form-builder-storage", // localStorage key
        partialize: (state) => ({ elements: state.elements }),
      }
    ),
    { name: "FormBuilderStore", enabled: true } // 👈 This name shows up in devtools
  )
);
