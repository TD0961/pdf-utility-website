/**
 * PDFSimplify — Form Flattening Engine
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
  hasInteractiveForm: boolean;
  hasAcroForm: boolean;
  fieldCount: number;
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
  buffer: ArrayBuffer | Uint8Array | { bytes?: Uint8Array; buffer?: ArrayBuffer }
): Promise<FlattenInspectionResult> {
  let rawBuffer: ArrayBuffer | Uint8Array;
  if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer) {
    rawBuffer = buffer;
  } else if (buffer && typeof buffer === 'object') {
    rawBuffer = (buffer as { bytes?: Uint8Array; buffer?: ArrayBuffer }).bytes ||
                (buffer as { bytes?: Uint8Array; buffer?: ArrayBuffer }).buffer ||
                (buffer as unknown as ArrayBuffer);
  } else {
    rawBuffer = buffer as unknown as ArrayBuffer;
  }

  const pdfDoc = await PDFDocument.load(rawBuffer, { ignoreEncryption: true });
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
    const catalogDict = pdfDoc.catalog as unknown as { get: (key: unknown) => unknown };
    const acroFormDict = catalogDict.get(pdfDoc.context.obj('AcroForm'));
    if (acroFormDict && typeof acroFormDict === 'object' && 'has' in (acroFormDict as Record<string, unknown>)) {
      isXfa = (acroFormDict as { has: (key: unknown) => boolean }).has(pdfDoc.context.obj('XFA'));
    }
  } catch {
    isXfa = false;
  }

  return {
    hasForm: fields.length > 0,
    hasInteractiveForm: fields.length > 0,
    hasAcroForm: fields.length > 0,
    fieldCount: fields.length,
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
  buffer: ArrayBuffer | Uint8Array | { bytes?: Uint8Array; flattenedBytes?: Uint8Array; uint8Array?: Uint8Array; pdfBytes?: Uint8Array },
  options: { cancellationToken?: CancellationToken } = {}
): Promise<Uint8Array & FlattenResult & { bytes: Uint8Array; pdfBytes: Uint8Array; uint8Array: Uint8Array }> {
  const startTime = Date.now();

  if (options.cancellationToken?.isCancelled) {
    throw new Error('Form flattening cancelled by user.');
  }

  let rawBuffer: ArrayBuffer | Uint8Array;
  if (buffer instanceof Uint8Array || buffer instanceof ArrayBuffer) {
    rawBuffer = buffer;
  } else if (buffer && typeof buffer === 'object') {
    const b = (buffer as { bytes?: Uint8Array; flattenedBytes?: Uint8Array; uint8Array?: Uint8Array; pdfBytes?: Uint8Array }).bytes ||
              (buffer as { bytes?: Uint8Array; flattenedBytes?: Uint8Array; uint8Array?: Uint8Array; pdfBytes?: Uint8Array }).flattenedBytes ||
              (buffer as { bytes?: Uint8Array; flattenedBytes?: Uint8Array; uint8Array?: Uint8Array; pdfBytes?: Uint8Array }).uint8Array ||
              (buffer as { bytes?: Uint8Array; flattenedBytes?: Uint8Array; uint8Array?: Uint8Array; pdfBytes?: Uint8Array }).pdfBytes;
    if (b) {
      rawBuffer = b;
    } else {
      rawBuffer = buffer as unknown as ArrayBuffer;
    }
  } else {
    rawBuffer = buffer as unknown as ArrayBuffer;
  }

  const pdfDoc = await PDFDocument.load(rawBuffer, { ignoreEncryption: true });
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

  const result = Object.assign(flattenedBytes, {
    flattenedBytes,
    bytes: flattenedBytes,
    pdfBytes: flattenedBytes,
    uint8Array: flattenedBytes,
    fieldCountBefore,
    fieldCountAfter,
    pageCount,
    durationMs: Date.now() - startTime,
  });

  return result as Uint8Array & FlattenResult & { bytes: Uint8Array; pdfBytes: Uint8Array; uint8Array: Uint8Array };
}
