/**
 * iLikePDF — Form Flattening Engine
 * Converts interactive AcroForm fields into permanent page content,
 * locking all current values into the visual page stream.
 */

import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
} from 'pdf-lib';
import { assertValidPdfOutput } from './output-validator';
import { CancellationToken } from './conversion/types';

export interface FormFieldSummary {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'optionlist' | 'unknown';
  value?: string | boolean;
}

export interface FlattenInspectionResult {
  hasForm: boolean;
  totalFields: number;
  fields: FormFieldSummary[];
  isXfa: boolean;
  pageCount: number;
}

export interface FlattenResult {
  flattenedBytes: Uint8Array;
  fieldCountBefore: number;
  fieldCountAfter: number;
  pageCount: number;
  durationMs: number;
}

/**
 * Inspects a PDF for interactive form fields before flattening.
 */
export async function inspectFormForFlattening(
  buffer: ArrayBuffer
): Promise<FlattenInspectionResult> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  const fieldSummaries: FormFieldSummary[] = fields.map((f) => {
    let type: FormFieldSummary['type'] = 'unknown';
    let value: string | boolean | undefined;

    if (f instanceof PDFTextField) {
      type = 'text';
      try {
        value = f.getText();
      } catch {
        value = '';
      }
    } else if (f instanceof PDFCheckBox) {
      type = 'checkbox';
      try {
        value = f.isChecked();
      } catch {
        value = false;
      }
    } else if (f instanceof PDFRadioGroup) {
      type = 'radio';
      try {
        value = f.getSelected();
      } catch {
        value = '';
      }
    } else if (f instanceof PDFDropdown) {
      type = 'dropdown';
      try {
        value = f.getSelected()?.join(', ');
      } catch {
        value = '';
      }
    } else if (f instanceof PDFOptionList) {
      type = 'optionlist';
      try {
        value = f.getSelected()?.join(', ');
      } catch {
        value = '';
      }
    }

    return {
      name: f.getName(),
      type,
      value,
    };
  });

  // Check for XFA dictionary presence
  let isXfa = false;
  try {
    const acroFormDict = pdfDoc.catalog.get(pdfDoc.context.obj('AcroForm'));
    if (acroFormDict && typeof acroFormDict === 'object' && 'has' in (acroFormDict as unknown as Record<string, unknown>)) {
      isXfa = (acroFormDict as unknown as { has: (key: unknown) => boolean }).has(pdfDoc.context.obj('XFA'));
    }
  } catch {
    isXfa = false;
  }

  return {
    hasForm: fields.length > 0,
    totalFields: fields.length,
    fields: fieldSummaries,
    isXfa,
    pageCount: pdfDoc.getPageCount(),
  };
}

/**
 * Flattens all interactive AcroForm fields into the document's visual stream.
 */
export async function flattenPdf(
  buffer: ArrayBuffer,
  options: { cancellationToken?: CancellationToken } = {}
): Promise<FlattenResult> {
  const startTime = Date.now();

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Form flattening cancelled by user.');
  }

  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const fieldCountBefore = fields.length;
  const pageCount = pdfDoc.getPageCount();

  if (fieldCountBefore > 0) {
    // Flatten burns all field appearances permanently into page content streams
    form.flatten();
  }

  const flattenedBytes = await pdfDoc.save();

  // Validate output
  await assertValidPdfOutput(flattenedBytes, {
    expectedPages: pageCount,
  });

  // Verify that interactive form fields are 0 after flattening
  const reloadedDoc = await PDFDocument.load(flattenedBytes);
  const fieldCountAfter = reloadedDoc.getForm().getFields().length;

  return {
    flattenedBytes,
    fieldCountBefore,
    fieldCountAfter,
    pageCount,
    durationMs: Date.now() - startTime,
  };
}
