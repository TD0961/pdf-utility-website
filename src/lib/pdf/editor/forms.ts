/**
 * Phase 3C.5: PDF Form Awareness & Groundwork
 * Read-only inspection of AcroForm structures using pdf-lib.
 * 100% in-browser, deterministic, non-destructive.
 */

import {
  PDFDocument,
  PDFName,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFSignature,
} from 'pdf-lib';
import { PdfFormSummary, PdfFormFieldInfo, PdfFormFieldType } from './types';

export function getEmptyFormSummary(): PdfFormSummary {
  return {
    hasAcroForm: false,
    totalFields: 0,
    counts: {
      text: 0,
      checkbox: 0,
      radio: 0,
      dropdown: 0,
      optionList: 0,
      signature: 0,
      other: 0,
    },
    fields: [],
  };
}

/**
 * Detects and inspects AcroForm fields present in the loaded PDFDocument.
 * Non-destructive and read-only.
 */
export async function detectPdfForms(pdfDoc: PDFDocument): Promise<PdfFormSummary> {
  try {
    const hasAcroForm = pdfDoc.catalog.has(PDFName.of('AcroForm'));
    if (!hasAcroForm) {
      return getEmptyFormSummary();
    }

    let form;
    try {
      form = pdfDoc.getForm();
    } catch {
      // Catalog has AcroForm key but dictionary is corrupt/unsupported
      return {
        hasAcroForm: true,
        totalFields: 0,
        counts: {
          text: 0,
          checkbox: 0,
          radio: 0,
          dropdown: 0,
          optionList: 0,
          signature: 0,
          other: 0,
        },
        fields: [],
      };
    }

    const fields = form.getFields();
    const counts = {
      text: 0,
      checkbox: 0,
      radio: 0,
      dropdown: 0,
      optionList: 0,
      signature: 0,
      other: 0,
    };

    const inspectedFields: PdfFormFieldInfo[] = [];

    for (const field of fields) {
      let type: PdfFormFieldType = 'other';
      let value: string | boolean | string[] | undefined = undefined;

      try {
        if (field instanceof PDFTextField) {
          type = 'text';
          counts.text++;
          value = field.getText();
        } else if (field instanceof PDFCheckBox) {
          type = 'checkbox';
          counts.checkbox++;
          value = field.isChecked();
        } else if (field instanceof PDFRadioGroup) {
          type = 'radio';
          counts.radio++;
          value = field.getSelected();
        } else if (field instanceof PDFDropdown) {
          type = 'dropdown';
          counts.dropdown++;
          value = field.getSelected();
        } else if (field instanceof PDFOptionList) {
          type = 'optionList';
          counts.optionList++;
          value = field.getSelected();
        } else if (field instanceof PDFSignature) {
          type = 'signature';
          counts.signature++;
        } else {
          counts.other++;
        }
      } catch {
        counts.other++;
      }

      let readOnly = false;
      try {
        readOnly = field.isReadOnly();
      } catch {
        readOnly = false;
      }

      let name = 'Unnamed Field';
      try {
        name = field.getName() || 'Unnamed Field';
      } catch {
        name = 'Unnamed Field';
      }

      inspectedFields.push({
        name,
        type,
        readOnly,
        value,
      });
    }

    return {
      hasAcroForm: true,
      totalFields: fields.length,
      counts,
      fields: inspectedFields,
    };
  } catch (err) {
    console.warn('Unable to inspect PDF AcroForm:', err);
    return getEmptyFormSummary();
  }
}
