"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { GripVertical, Trash } from "lucide-react";
import { DragEvent, FormEvent, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import { Plus, Trash2 } from "lucide-react"; // for option add/remove icons

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

type FormElementType = FormElement["type"];

const elementTypes: {
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

const useFormStore = create<FormStore>()(
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
          el.id === id
            ? ({ ...el, ...updated } as FormElement)
            : el
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

function SortableFormItem({ element }: { element: FormElement }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: element.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const updateElement = useFormStore((s) => s.updateElement);
  const removeElement = useFormStore((s) => s.removeElement);

  if (element.type === "submit") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-4 rounded-xl border mb-4 shadow-sm"
      >
        <Button className="w-full" disabled>
          {element.label}
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="p-4 rounded-xl border mb-4 shadow-sm"
    >
      <div className="flex justify-between mb-2">
        <div className="flex gap-2 items-center cursor-move" {...listeners}>
          <GripVertical className="w-4 h-4 text-gray-500" />
          <Input
            value={element.label}
            onChange={(e) =>
              updateElement(element.id, { label: e.target.value })
            }
            className="text-base"
          />
        </div>
        <Trash
          className="w-4 h-4 text-red-500 cursor-pointer"
          onClick={() => removeElement(element.id)}
        />
      </div>
      <div className="mb-2">
        {element.type === "text" && (
          <Input
            type="text"
            placeholder={element.label}
            value={element.value}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        )}
        {element.type === "textarea" && (
          <Textarea
            placeholder={element.label}
            value={element.value}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        )}

        {element.type === "email" && (
          <Input
            type="email"
            placeholder={"name@example.com"}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        )}

        {element.type === "number" && (
          <Input
            type="number"
            placeholder={"Enter Number"}
            value={element.value}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        )}

        {element.type === "checkbox" && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={element.value}
              onChange={(e) =>
                updateElement(element.id, { value: e.target.checked })
              }
            />
            <label className="text-sm">{element.label}</label>
          </div>
        )}

        {element.type === "select" && (
          <div className="space-y-2">
            <Select
              value={element.value}
              onValueChange={(val) => updateElement(element.id, { value: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {element.options.map((opt, idx) => (
                  <SelectItem key={idx} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Dynamic Option Editor */}
            <div className="space-y-2 border-t pt-2 mt-2">
              <label className="text-sm font-medium">Options:</label>
              {element.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...element.options];
                      newOptions[idx] = e.target.value;
                      updateElement(element.id, { options: newOptions });
                    }}
                  />
                  <Trash2
                    className="w-4 h-4 text-red-500 cursor-pointer"
                    onClick={() => {
                      const newOptions = element.options.filter(
                        (_, i) => i !== idx
                      );
                      updateElement(element.id, { options: newOptions });
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  updateElement(element.id, {
                    options: [
                      ...element.options,
                      `Option ${element.options.length + 1}`,
                    ],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {element.type === "radio" && (
  <div className="space-y-2">
    <RadioGroup
      value={element.value}
      onValueChange={(val) =>
        updateElement(element.id, { value: val })
      }
    >
      {element.options.map((opt, idx) => (
        <div key={idx} className="flex items-center space-x-2">
          <RadioGroupItem value={opt} id={`${element.id}-${idx}`} />
          <label htmlFor={`${element.id}-${idx}`} className="text-sm">
            {opt}
          </label>
        </div>
      ))}
    </RadioGroup>

    {/* Option Editor */}
    <div className="space-y-2 border-t pt-2 mt-2">
      <label className="text-sm font-medium">Options:</label>
      {element.options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={opt}
            onChange={(e) => {
              const newOptions = [...element.options];
              newOptions[idx] = e.target.value;
              updateElement(element.id, { options: newOptions });
            }}
          />
          <Trash2
            className="w-4 h-4 text-red-500 cursor-pointer"
            onClick={() => {
              const newOptions = element.options.filter((_, i) => i !== idx);
              updateElement(element.id, { options: newOptions });
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          updateElement(element.id, {
            options: [...element.options, `Option ${element.options.length + 1}`],
          })
        }
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Option
      </Button>
    </div>
  </div>
)}

      </div>

      {
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id={`required-${element.id}`}
            checked={element.required}
            onCheckedChange={(checked: boolean) =>
              updateElement(element.id, { required: checked })
            }
          />
          <label htmlFor={`required-${element.id}`} className="text-sm">
            Required
          </label>
        </div>
      }
    </div>
  );
}

export default function BuilderPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [elements, addElement, reorderElements] = useFormStore(
    useShallow((s) => [s.elements, s.addElement, s.reorderElements])
  );
  const [submittedData, setSubmittedData] = useState<Record<
    string,
    any
  > | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showPreview, setShowPreview] = useState(true);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let isValid = true;
    const data: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const el of elements) {
      if (el.type !== "submit") {
        if (
          el.required &&
          (el.value === "" || (el.type === "checkbox" && !el.value))
        ) {
          errors[el.label] = "This field is required";
          isValid = false;
        }
        data[el.label] = el.value;
      }
    }
    console.log("Form submitted with values:", data);
    if (!isValid) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setSubmittedData(data);
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
      <div className="md:col-span-3">
        <Card className="min-h-[600px]">
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
          </CardHeader>
          <CardContent>
            {elementTypes.map((el) => (
              <div
                key={el.type}
                draggable
                onDragStart={(e: DragEvent<HTMLDivElement>) => {
                  e.dataTransfer.setData("application/type", el.type);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="p-2 mb-2 rounded cursor-move text-sm"
              >
                ➕ {el.label}
              </div>
            ))}
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => useFormStore.getState().reset()}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
              >
                🔄 Reset Form
              </Button>

              <Button
                disabled={elements.length <= 1}
                onClick={() => {
                  const json = JSON.stringify(elements, null, 2);
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "form-data.json";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-50"
              >
                📤 Export JSON
              </Button>

              <Button
                onClick={() => setShowPreview((prev) => !prev)}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                {showPreview ? "👁️ Hide Preview" : "👁️ Show Preview"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div
        className={clsx(
          "relative group border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors duration-200  min-h-[200px] transition-all duration-300",
          showPreview ? "md:col-span-5 col-span-1" : "md:col-span-9 col-span-1"
        )}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          setIsDragging(false);
          const type = e.dataTransfer.getData(
            "application/type"
          ) as FormElementType;
          if (
            [
              "text",
              "textarea",
              "checkbox",
              "email",
              "number",
              "select",
              "radio"
            ].includes(type)
          ) {
            addElement(type as Exclude<FormElementType, "submit">);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/60 text-gray-500 text-sm">
            ➕ Drop form element here
          </div>
        )}
        <Card className="min-h-[600px]">
          <CardHeader>
            <CardTitle>Form Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }: DragEndEvent) => {
                if (active.id !== over?.id) {
                  const filtered = elements.filter(
                    (el) => el.type !== "submit"
                  );
                  const oldIndex = filtered.findIndex(
                    (el) => el.id === active.id
                  );
                  const newIndex = filtered.findIndex(
                    (el) => el.id === over?.id
                  );
                  reorderElements(oldIndex, newIndex);
                }
              }}
            >
              <SortableContext
                items={elements
                  .filter((el) => el.type !== "submit")
                  .map((el) => el.id)}
                strategy={verticalListSortingStrategy}
              >
                {elements.map((el) => (
                  <SortableFormItem key={el.id} element={el} />
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>

      {showPreview && (
        <div className="md:col-span-4 col-span-1">
          <Card className="min-h-[600px]">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {elements.map((el) => (
                  <div key={el.id}>
                    {el.type !== "submit" && (
                      <>
                        <label className="block mb-1 font-medium">
                          {el.label}{" "}
                          {el.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        {el.type === "text" && (
                          <>
                            <Input
                              required={el.required}
                              placeholder={"Enter TextInput"}
                              value={el.value}
                              onChange={(e) =>
                                useFormStore.getState().updateElement(el.id, {
                                  value: e.target.value,
                                })
                              }
                              className={clsx({
                                "border-red-500": validationErrors[el.label],
                              })}
                            />
                          </>
                        )}
                        {el.type === "textarea" && (
                          <>
                            <Textarea
                              required={el.required}
                              value={el.value}
                              placeholder={"Enter Description"}
                              onChange={(e) =>
                                useFormStore.getState().updateElement(el.id, {
                                  value: e.target.value,
                                })
                              }
                              className={clsx({
                                "border-red-500": validationErrors[el.label],
                              })}
                            />
                          </>
                        )}
                        {el.type === "email" && (
                          <Input
                            type="email"
                            placeholder={"name@example.com"}
                            value={el.value}
                            onChange={(e) =>
                              useFormStore.getState().updateElement(el.id, {
                                value: e.target.value,
                              })
                            }
                          />
                        )}
                        {el.type === "number" && (
                          <Input
                            type="number"
                            placeholder={"Enter Number"}
                            value={el.value}
                            onChange={(e) =>
                              useFormStore.getState().updateElement(el.id, {
                                value: e.target.value,
                              })
                            }
                          />
                        )}
                        {el.type === "checkbox" && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={el.value}
                              onCheckedChange={(checked: boolean) =>
                                useFormStore.getState().updateElement(el.id, {
                                  value: checked,
                                })
                              }
                            />
                            <label className="text-sm font-medium ">
                              {el.label} {el.required && "*"}
                            </label>
                          </div>
                        )}

                        {el.type === "select" && (
                          <Select
                            value={el.value}
                            onValueChange={(val) =>
                              useFormStore
                                .getState()
                                .updateElement(el.id, { value: val })
                            }
                          >
                            <SelectTrigger
                              className={clsx({
                                "border-red-500": validationErrors[el.label],
                              })}
                            >
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {el.options.map((opt, idx) => (
                                <SelectItem key={idx} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {el.type === "radio" && (
  <RadioGroup
    value={el.value}
    onValueChange={(val) =>
      useFormStore.getState().updateElement(el.id, {
        value: val,
      })
    }
  >
    {el.options.map((opt, idx) => (
      <div key={idx} className="flex items-center space-x-2">
        <RadioGroupItem value={opt} id={`${el.id}-preview-${idx}`} />
        <label htmlFor={`${el.id}-preview-${idx}`} className="text-sm">
          {opt}
        </label>
      </div>
    ))}
  </RadioGroup>
)}

                      </>
                    )}
                    {el.type === "submit" && (
                      <Button type="submit" className="w-full">
                        {el.label}
                      </Button>
                    )}
                  </div>
                ))}
              </form>
              {submittedData && (
                <pre className="mt-4 p-2 rounded text-sm">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
