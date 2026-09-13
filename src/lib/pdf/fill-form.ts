/**
 * PDFSimplify — Client-Side AcroForm Form Filling Engine
 * Detects interactive form fields (Text, Checkbox, Radio, Dropdown)
 * and updates them natively using pdf-lib in the browser. Zero backend.
 */

import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
} from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';

export type FormFieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'other';

export interface InteractiveFormField {
  name: string;
  type: FormFieldType;
  value: string | boolean;
  options?: string[]; // for dropdowns / radios
  readOnly: boolean;
}

export interface FormInspectionResult {
  hasAcroForm: boolean;
  hasXfa: boolean;
  isXfaOnly: boolean;
  totalFields: number;
  fields: InteractiveFormField[];
  notice?: string;
}

/**
 * Inspects all interactive form fields present in a PDF document.
 */
export async function inspectInteractiveForm(
  pdfBytes: Uint8Array
): Promise<InteractiveFormField[] & FormInspectionResult> {
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF file is empty.');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  let hasXfa = false;
  try {
    const rawStr = Buffer.from(pdfBytes).toString('latin1');
    if (/\/XFA\b/i.test(rawStr)) {
      hasXfa = true;
    }
  } catch {
    hasXfa = false;
  }

  let form;
  try {
    form = pdfDoc.getForm();
  } catch {
    const isXfaOnly = hasXfa;
    return Object.assign([] as InteractiveFormField[], {
      hasAcroForm: false,
      hasXfa,
      isXfaOnly,
      totalFields: 0,
      fields: [],
      notice: isXfaOnly
        ? 'This document contains dynamic XML Forms Architecture (XFA). Only standard static AcroForms are supported for in-browser editing.'
        : undefined,
    }) as InteractiveFormField[] & FormInspectionResult;
  }

  let fields;
  try {
    fields = form.getFields();
  } catch {
    const isXfaOnly = hasXfa;
    return Object.assign([] as InteractiveFormField[], {
      hasAcroForm: false,
      hasXfa,
      isXfaOnly,
      totalFields: 0,
      fields: [],
      notice: isXfaOnly
        ? 'This document contains dynamic XML Forms Architecture (XFA). Only standard static AcroForms are supported for in-browser editing.'
        : undefined,
    }) as InteractiveFormField[] & FormInspectionResult;
  }

  const interactiveFields: InteractiveFormField[] = [];

  for (const field of fields) {
    const name = field.getName();
    let readOnly = false;
    try {
      readOnly = field.isReadOnly();
    } catch {
      readOnly = false;
    }

    if (field instanceof PDFTextField) {
      interactiveFields.push({
        name,
        type: 'text',
        value: field.getText() || '',
        readOnly,
      });
    } else if (field instanceof PDFCheckBox) {
      interactiveFields.push({
        name,
        type: 'checkbox',
        value: field.isChecked(),
        readOnly,
      });
    } else if (field instanceof PDFRadioGroup) {
      interactiveFields.push({
        name,
        type: 'radio',
        value: field.getSelected() || '',
        options: field.getOptions(),
        readOnly,
      });
    } else if (field instanceof PDFDropdown) {
      interactiveFields.push({
        name,
        type: 'dropdown',
        value: field.getSelected()[0] || '',
        options: field.getOptions(),
        readOnly,
      });
    }
  }

  const isXfaOnly = hasXfa && interactiveFields.length === 0;
  const result = Object.assign(interactiveFields, {
    hasAcroForm: interactiveFields.length > 0,
    hasXfa,
    isXfaOnly,
    totalFields: interactiveFields.length,
    fields: interactiveFields,
    notice: isXfaOnly
      ? 'This document contains dynamic XML Forms Architecture (XFA). Only standard static AcroForms are supported for in-browser editing.'
      : undefined,
  });

  return result as InteractiveFormField[] & FormInspectionResult;
}

export type FillFormFieldInput = { name: string; type?: string; value: string | boolean };

export interface FillFormOptions {
  values?: Record<string, string | boolean>;
  flatten?: boolean;
}

/**
 * Fills PDF form fields with provided user values and returns new PDF bytes.
 */
export async function fillPdfForm(
  pdfBytes: Uint8Array,
  options: FillFormOptions | FillFormFieldInput[]
): Promise<Uint8Array & { bytes: Uint8Array; pdfBytes: Uint8Array; uint8Array: Uint8Array; blob: Blob }> {
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF file is empty.');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  let form;
  try {
    form = pdfDoc.getForm();
  } catch {
    throw new Error('This PDF contains no interactive form fields to fill.');
  }

  const fields = form.getFields();
  if (fields.length === 0) {
    try {
      const rawStr = Buffer.from(pdfBytes).toString('latin1');
      if (/\/XFA\b/i.test(rawStr)) {
        throw new Error(
          'This document uses dynamic Adobe XML Forms Architecture (XFA). PDFSimplify supports standard static AcroForms.'
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('XML Forms Architecture')) {
        throw err;
      }
    }
    throw new Error('This PDF contains no interactive form fields to fill.');
  }

  const valuesMap: Record<string, string | boolean> = {};
  let shouldFlatten = false;

  if (Array.isArray(options)) {
    for (const item of options) {
      if (item && item.name) {
        valuesMap[item.name] = item.value;
      }
    }
  } else if (options && typeof options === 'object') {
    if (options.values) {
      Object.assign(valuesMap, options.values);
    }
    shouldFlatten = !!options.flatten;
  }

  for (const field of fields) {
    const name = field.getName();
    if (!(name in valuesMap)) continue;

    const val = valuesMap[name];

    try {
      if (field instanceof PDFTextField && typeof val === 'string') {
        field.setText(val);
      } else if (field instanceof PDFCheckBox && typeof val === 'boolean') {
        if (val) {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFRadioGroup && typeof val === 'string') {
        if (val) field.select(val);
      } else if (field instanceof PDFDropdown && typeof val === 'string') {
        if (val) field.select(val);
      }
    } catch (err) {
      console.warn(`Could not set field "${name}":`, err);
    }
  }

  if (shouldFlatten) {
    try {
      form.flatten();
    } catch (err) {
      console.warn('Could not flatten form:', err);
    }
  }

  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  await assertValidPdfOutput(outBytes);

  const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
  const result = Object.assign(outBytes, {
    bytes: outBytes,
    pdfBytes: outBytes,
    uint8Array: outBytes,
    blob,
  });

  return result as Uint8Array & { bytes: Uint8Array; pdfBytes: Uint8Array; uint8Array: Uint8Array; blob: Blob };
}
