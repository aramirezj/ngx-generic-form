import { Component, AfterViewInit, inject, Injector, ChangeDetectorRef } from '@angular/core';
import { MatFormField, MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

/** Directive of component that can be added to a mat-error and it will display automatically error messages */
@Component({
  selector: '[gf-matErrorMessages]',
  template: '{{ error }}',
  standalone: true,
  imports: [MatFormFieldModule]
})
export class GFMatErrorMessagesDirective implements AfterViewInit {
  /** Error to display */
  error:string = '';
  /** Reference in the dom */
  inputRef!: MatFormFieldControl<MatInput>;

  _inj:Injector = inject(Injector)

  cdRef:ChangeDetectorRef = inject(ChangeDetectorRef);

  ngAfterViewChecked(){
    this.cdRef.detectChanges();
  }
  ngAfterViewInit() {
    const container = this._inj.get(MatFormField);
    this.inputRef = container._control;

    // Asigno el cambio de estado a la función
    this.inputRef.ngControl?.statusChanges?.subscribe(this.updateErrors);
    this.updateErrors('INVALID');
  }

  /**
   * Función que controla los errores según cambia el estado
   *
   * @param state
   */
  private updateErrors = (state: 'VALID' | 'INVALID') => {
    if (state === 'INVALID') {
      const controlErrors = this.inputRef.ngControl?.errors ?? {} as any;
      const firstError = controlErrors ? Object.keys(controlErrors)[0] : null;
      switch (firstError) {
        case 'required':
          this.error = 'This field is required.';
          break;
        case 'minlength':
          this.error = 'This field must have ' + controlErrors?.minlength?.requiredLength + ' characters.';
          break;
        case 'maxlength':
          this.error = 'This field must not have more than ' + controlErrors?.maxlength?.requiredLength + ' characters.';
          break;
        case 'min':
          this.error = 'The value of this field must be more than ' + controlErrors?.min?.min.toFixed(2) + '.';
          break;
        case 'max':
          if (controlErrors['max'] === true) {
            this.error = 'The percentage must not be more than 100%.';
          } else {
            this.error = 'The value field must not be more than ' + +controlErrors?.max?.max.toFixed(2) + '.';
          }
          break;
        case 'email':
          this.error = 'The format of the email is invalid';
          break;
        case 'incorrect':
          this.error = 'The field is invalid';
          break;
        case 'numberRange':
          this.error = 'The value is not between the valid range.';
          break;
      }
    }
  }
}
