import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GFGenericFormComponent } from './components/generic-form/generic-form.component';
import { GF_Form } from './classes/Form';
import { FormGroup, UntypedFormArray } from '@angular/forms';

/** Service for the form utilies */
@Injectable({ providedIn: 'root' })
export class GFFormService {
  /** Reference of the dialog */
  private readonly dialog: Dialog = inject(Dialog);

  /**
   * Open the GenericForm component with a form
   * @param form Form to open
   * @param width Width of the dialog with the form
   * @returns An entity of the form
   */
  openForm(form: GF_Form<any>, width: string = '35vw'): Observable<any> {
    const dialogRef = this.dialog.open(GFGenericFormComponent, {
      data: form,
      minWidth:width,
      maxWidth:width
    });
    return dialogRef.closed;
  }

  /**
  * Function that receives a formGroup to investigate and return a list with the names of the invalid controls
  *
  * @param formToInvestigate Form to investigate
  */
  findInvalidControlsRecursive(formToInvestigate: FormGroup | UntypedFormArray): string[] {
    const invalidControls: string[] = [];
    const recursiveFunc = (form: FormGroup | UntypedFormArray): void => {
      Object.keys(form.controls).forEach(field => {
        const control = form.get(field);
        if (control?.invalid) { invalidControls.push(field); }
        if (control instanceof FormGroup) {
          recursiveFunc(control);
        } else if (control instanceof UntypedFormArray) {
          recursiveFunc(control);
        }
      });
    };
    recursiveFunc(formToInvestigate);
    return invalidControls;
  }

  
}
