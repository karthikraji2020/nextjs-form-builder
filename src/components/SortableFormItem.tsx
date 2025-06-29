import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormElement, useFormStore } from "@/lib/store";
import { hasOptions } from "@/lib/utils";

export default function SortableFormItem({
  element,
}: {
  element: FormElement;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: element.id,
      animateLayoutChanges: defaultAnimateLayoutChanges,
    });

  const updateElement = useFormStore((s) => s.updateElement);
  const removeElement = useFormStore((s) => s.removeElement);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  const renderOptionEditor = (
    el: Extract<FormElement, { options: string[] }>
  ) => (
    <div className="space-y-2 border-t pt-2 mt-2">
      <label className="text-sm font-medium">Options:</label>
      {el.options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={opt}
            onChange={(e) => {
              const updated = [...el.options];
              updated[idx] = e.target.value;
              updateElement(el.id, { options: updated });
            }}
          />
          <Trash2
            className="w-4 h-4 text-red-500 cursor-pointer"
            onClick={() => {
              const filtered = el.options.filter((_, i) => i !== idx);
              updateElement(el.id, { options: filtered });
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          updateElement(el.id, {
            options: [...el.options, `Option ${el.options.length + 1}`],
          })
        }
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Option
      </Button>
    </div>
  );

  const renderField = () => {
    switch (element.type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={element.label}
            value={element.value}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        );
      case "textarea":
        return (
          <Textarea
            placeholder={element.label}
            value={element.value}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        );
      case "email":
        return (
          <Input
            type="email"
            placeholder="name@example.com"
            value={element.value}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder="Enter Number"
            value={element.value}
            onChange={(e) =>
              updateElement(element.id, { value: e.target.value })
            }
          />
        );
      case "checkbox":
        return (
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
        );
      case "select":
        if (!hasOptions(element)) return null;
        return (
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
            {renderOptionEditor(element)}
          </div>
        );

      case "radio":
        if (!hasOptions(element)) return null;
        return (
          <div className="space-y-2">
            <RadioGroup
              value={element.value}
              onValueChange={(val) => updateElement(element.id, { value: val })}
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
            {renderOptionEditor(element)}
          </div>
        );
      default:
        return null;
    }
  };

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

      <div className="mb-2">{renderField()}</div>

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
    </div>
  );
}
