"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import clsx from "clsx";
import { DragEvent, useState } from "react";

import { useShallow } from "zustand/react/shallow";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { elementTypes, FormElementType, useFormStore } from "@/lib/store";
import { lazy, Suspense } from "react";

const SortableFormItem = lazy(() => import("@/components/SortableFormItem"));

import { Input } from "@/components/ui/input";


export default function BuilderPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [elements, addElement, reorderElements] = useFormStore(
    useShallow((s) => [s.elements, s.addElement, s.reorderElements])
  );
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  /* eslint-disable  @typescript-eslint/no-unused-vars */
  const [submittedData, setSubmittedData] = useState<Record<
    string,
    any
  > | null>(null);

  const [showPreview, setShowPreview] = useState(true);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const getDynamicSchema = () => {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const shape: Record<string, z.ZodType<any, any, any>> = {};

    for (const el of elements) {
      if (["text", "textarea", "email", "select", "radio"].includes(el.type)) {
        let schema = z.string();
        if ("required" in el && el.required)
          schema = schema.min(1, `${el.label} is required`);

        if (el.type === "email")
          schema = schema.email(`${el.label} must be a valid email`);
        shape[el.id] = schema;
      } else if (el.type === "number") {
        const base = z.preprocess(
          (val) => (val === "" || val === null ? undefined : Number(val)),
          z.number({ invalid_type_error: `${el.label} must be a number` })
        );

        shape[el.id] = el.required
          ? base.refine((val) => val !== undefined && !isNaN(val), {
              message: `${el.label} is required`,
            })
          : base.optional();
      } else if (el.type === "checkbox") {
        let schema: z.ZodTypeAny = z.boolean();
        if (el.required) {
          schema = schema.refine((val) => val === true, {
            message: `${el.label} must be checked`,
          });
        }
        shape[el.id] = schema;
      }
    }

    return z.object(shape);
  };
  const schema = getDynamicSchema();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

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
                className="outline p-2 mb-2 rounded cursor-move text-sm"
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
              "radio",
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
                <Suspense fallback={<div>Loading item...</div>}>
                  {elements.map((el) => (
                    <SortableFormItem key={el.id} element={el} />
                  ))}
                </Suspense>
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
              <form
                className="space-y-4"
                onSubmit={handleSubmit((data) => setSubmittedData(data))}
              >
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
                          <Input
                            {...register(el.id)}
                            defaultValue={el.value}
                            className={errors[el.id] && "border-red-500"}
                          />
                        )}

                        {el.type === "textarea" && (
                          <Textarea
                            {...register(el.id)}
                            defaultValue={el.value}
                            className={errors[el.id] && "border-red-500"}
                          />
                        )}

                        {el.type === "email" && (
                          <Input
                            type="email"
                            {...register(el.id)}
                            defaultValue={el.value}
                            className={errors[el.id] && "border-red-500"}
                          />
                        )}

                        {el.type === "number" && (
                          <Input
                            type="number"
                            {...register(el.id)}
                            defaultValue={el.value}
                            className={errors[el.id] && "border-red-500"}
                          />
                        )}

                        {el.type === "checkbox" && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              {...register(el.id)}
                              defaultChecked={el.value}
                              onCheckedChange={(checked) =>
                                useFormStore
                                  .getState()
                                  .updateElement(el.id, { value: checked })
                              }
                            />
                            <label className="text-sm font-medium">
                              {el.label}
                            </label>
                          </div>
                        )}

                        {el.type === "select" && (
                          <Select
                            defaultValue={el.value}
                            onValueChange={(val) =>
                              useFormStore
                                .getState()
                                .updateElement(el.id, { value: val })
                            }
                          >
                            <SelectTrigger
                              className={errors[el.id] && "border-red-500"}
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
                              useFormStore
                                .getState()
                                .updateElement(el.id, { value: val })
                            }
                          >
                            {el.options.map((opt, idx) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-2"
                              >
                                <RadioGroupItem
                                  value={opt}
                                  id={`${el.id}-preview-${idx}`}
                                />
                                <label
                                  htmlFor={`${el.id}-preview-${idx}`}
                                  className="text-sm"
                                >
                                  {opt}
                                </label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {errors[el.id] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[el.id]?.message as string}
                          </p>
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
