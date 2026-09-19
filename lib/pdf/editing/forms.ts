import { PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import { loadPdf } from '../core/load';
import { savePdf } from '../core/save';
import { FormFieldInfo, ProgressCallback } from '../types';

/**
 * Inspects a PDF document and extracts all interactive AcroForm field definitions.
 */
export async function getFormFields(buffer: ArrayBuffer | Uint8Array): Promise<FormFieldInfo[]> {
  const doc = await loadPdf(buffer);
  const form = doc.getForm();
  const fields = form.getFields();

  return fields.map((field) => {
    const name = field.getName();
    if (field instanceof PDFTextField) {
      return {
        name,
        type: 'text',
        value: field.getText() || '',
      };
    } else if (field instanceof PDFCheckBox) {
      return {
        name,
        type: 'checkbox',
        value: field.isChecked(),
      };
    } else if (field instanceof PDFDropdown) {
      return {
        name,
        type: 'dropdown',
        value: field.getSelected()[0] || '',
        options: field.getOptions(),
      };
    }
    return {
      name,
      type: 'other',
      value: '',
    };
  });
}

/**
 * Fills out form field values in a PDF and exports the completed document.
 */
export async function fillFormFields(
  buffer: ArrayBuffer | Uint8Array,
  fieldValues: Record<string, string | boolean>,
  flatten = false,
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(15, 'Loading form document...');
  const doc = await loadPdf(buffer);
  const form = doc.getForm();

  onProgress?.(45, 'Updating form fields...');
  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (field instanceof PDFTextField && typeof val === 'string') {
        field.setText(val);
      } else if (field instanceof PDFCheckBox && typeof val === 'boolean') {
        if (val) field.check();
        else field.uncheck();
      } else if (field instanceof PDFDropdown && typeof val === 'string') {
        field.select(val);
      }
    } catch {
      // Ignore individual missing field errors
    }
  }

  if (flatten) {
    onProgress?.(75, 'Flattening form appearances...');
    form.flatten();
  }

  onProgress?.(90, 'Saving filled document...');
  const result = await savePdf(doc);
  onProgress?.(100, 'Form completed!');
  return result;
}
