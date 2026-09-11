/**
 * iLikePDF — Client-Side AcroForm Form Filling Engine
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
  totalFields: number;
  fields: InteractiveFormField[];
}

/**
 * Inspects all interactive form fields present in a PDF document.
 */
export async function inspectInteractiveForm(
  pdfBytes: Uint8Array
): Promise<FormInspectionResult> {
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF file is empty.');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  let form;
  try {
    form = pdfDoc.getForm();
  } catch {
    return { hasAcroForm: false, totalFields: 0, fields: [] };
  }

  let fields;
  try {
    fields = form.getFields();
  } catch {
    return { hasAcroForm: false, totalFields: 0, fields: [] };
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

  return {
    hasAcroForm: interactiveFields.length > 0,
    totalFields: interactiveFields.length,
    fields: interactiveFields,
  };
}

export interface FillFormOptions {
  values: Record<string, string | boolean>;
  flatten?: boolean;
}

/**
 * Fills PDF form fields with provided user values and returns new PDF bytes.
 */
export async function fillPdfForm(
  pdfBytes: Uint8Array,
  options: FillFormOptions
): Promise<{ bytes: Uint8Array; blob: Blob }> {
  if (!pdfBytes || pdfBytes.length === 0) {
    throw new Error('PDF file is empty.');
  }

  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  for (const field of fields) {
    const name = field.getName();
    if (!(name in options.values)) continue;

    const val = options.values[name];

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

  if (options.flatten) {
    try {
      form.flatten();
    } catch (err) {
      console.warn('Could not flatten form:', err);
    }
  }

  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  await assertValidPdfOutput(outBytes);

  return {
    bytes: outBytes,
    blob: new Blob([outBytes as BlobPart], { type: 'application/pdf' }),
  };
}
