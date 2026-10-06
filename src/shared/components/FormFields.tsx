import { Fragment } from "react";
import { Field, Chips, SelectField, Toggle } from "@/shared/components/fields";
import type { FieldDefinition, FormValues } from "@/shared/models/entityDefinitions";
export function FormFields({
  fields,
  values,
  set,
}: {
  fields: FieldDefinition[];
  values: FormValues;
  set: (key: string, value: string) => void;
}) {
  return (
    <>
      {fields.map((f) => (
        <Fragment key={f.key}>
          {f.type === "chips" ? (
            <Chips
              label={f.label}
              value={values[f.key] ?? ""}
              options={f.options ?? []}
              onChange={(v) => set(f.key, v)}
            />
          ) : f.type === "select" ? (
            <SelectField
              label={f.label}
              value={values[f.key] ?? ""}
              options={f.options ?? []}
              onChange={(v) => set(f.key, v)}
            />
          ) : f.type === "toggle" ? (
            <Toggle
              label={f.label}
              value={values[f.key] === "1"}
              onChange={(v) => set(f.key, v ? "1" : "0")}
            />
          ) : (
            <Field
              label={f.label}
              required={f.required}
              value={values[f.key] ?? ""}
              onChange={(v) => set(f.key, v)}
              multiline={f.type === "multiline"}
              placeholder={
                f.type === "date"
                  ? "DD/MM/AAAA"
                  : f.type === "time"
                    ? "HH:MM"
                    : f.type === "money"
                      ? "0,00"
                      : undefined
              }
              keyboard={
                f.type === "money"
                  ? "decimal-pad"
                  : f.type === "number"
                    ? "number-pad"
                    : f.type === "phone"
                      ? "phone-pad"
                      : f.type === "email"
                        ? "email-address"
                        : f.type === "date" || f.type === "time"
                          ? "numbers-and-punctuation"
                          : "default"
              }
            />
          )}
        </Fragment>
      ))}
    </>
  );
}
