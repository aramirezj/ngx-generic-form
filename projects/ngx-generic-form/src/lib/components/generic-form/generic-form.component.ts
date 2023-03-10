import { Component, OnInit, Inject, LOCALE_ID, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Dialog,
  DialogModule,
  DialogRef,
  DIALOG_DATA,
} from '@angular/cdk/dialog';

import { GF_ExtraAction, GF_Form } from '../../classes/Form';
import { GF_TypeForm } from '../../enums/TypeForm';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GF_TypeControl } from '../../enums/TypeControl';
import { GF_FormElement } from '../../classes/FormElement';
import { GF_APIRequest } from '../../classes/APIRequest';
import { GFConversionDirective } from '../../directives/conversion.directive';
import { MatSelectModule } from '@angular/material/select';
import { GF_TypeConversion } from '../../enums/TypeConversion';
import { GFMasterSelectComponent } from '../master-select/master-select.component';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { GFMatErrorMessagesDirective } from '../../directives/matErrorMessages.directive';
import { GFTranslatePipe } from '../../directives/translate.directive';
import { Res } from '../../directives/res';

/** Component for opening through the service. It uses an object GTForm and displays it with the configuration provided */
@Component({
  selector: 'gt-generic-form',
  templateUrl: './generic-form.component.html',
  styleUrls: ['./generic-form.component.scss'],
  standalone: true,
  imports: [
    DialogModule,
    GFConversionDirective,
    MatFormFieldModule,
    MatSnackBarModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    GFMasterSelectComponent,
    MatNativeDateModule,
    MatDatepickerModule,
    GFMatErrorMessagesDirective,
    GFTranslatePipe,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgIf
  ],
})
export class GFGenericFormComponent<T> implements OnInit {
  /** Configura el formulario para que sea de solo lectura o editable */
  soloLectura: boolean = false;
  /** GTForm del componente */
  cForm!: FormGroup;
  /** Instancia del modelo formulario a cargar */
  form!: GF_Form<T>;
  /** Fecha m??xima para los campos fechas para evitar 5 digitos en a??os */
  maxDate: Date = new Date(9999, 12, 31);
  /** Injection of the language */
  locale: string = inject(LOCALE_ID);
  constructor(
    private dialogRef: DialogRef<T>,
    @Inject(DIALOG_DATA) data: GF_Form<T>,
    private snackBar: MatSnackBar,
    public dialog: Dialog
  ) {
    if (data) {

      this.form = data;
      this.soloLectura = this.form.type === GF_TypeForm.INSPECTION;
    }
  }

  ngOnInit(): void {
    if (this.checkEnums()) {
      this.createComponentForm();
      this.form.title = this.form.title ?? 'Create / Edit of element';
    }
  }

  /** Accesor to the enum */
  public get GF_TypeConversion() {
    return GF_TypeConversion;
  }

  /** Accesor to the enum */
  public get GF_TypeControl() {
    return GF_TypeControl;
  }

  /** Check the enums set to the list of controls
   *
   * @returns Si est?? todo correcto
   */
  checkEnums(): boolean {
    let campoErroneo: string | null = null;
    for (const modelo of this.form.model) {
      let ele: GF_FormElement = this.form.getElement(modelo);
      if (!ele) {
        ele = this.form.addElement(modelo, new GF_FormElement(modelo));
      }
      const tipo: GF_TypeControl = ele.type;
      if (!Object.values(GF_TypeControl).includes(tipo)) campoErroneo = modelo;
    }
    if (campoErroneo) {
      this.snackBar.open(
        `Error en construcci??n de formulario: ${campoErroneo} tiene mal el tipado`,
        'Cerrar',
        { duration: 3000, panelClass: 'customSnackbar' }
      );
      return false;
    } else return true;
  }

  /** Detecta los campos que debe crear */
  createComponentForm(): void {
    this.cForm = new FormGroup({});
    switch (this.form.type) {
      case GF_TypeForm.EDITION:
      case GF_TypeForm.INSPECTION:
        this.form.originalEntity = Object.assign({}, this.form.entity);
        for (const atributo of this.form.model) {
          const eleFormulario: GF_FormElement = this.form.getElement(atributo);
          this.cForm.addControl(atributo, eleFormulario.control);
          this.cForm.get(atributo)?.setValue(this.form.entity[atributo]);
          this.cForm.get(atributo)?.enable();
          if (eleFormulario.type === GF_TypeControl.CHECKBOX) { this.cForm.get(atributo)?.setValue(this.form.entity[atributo] === true ? true : null); }
          if (eleFormulario.disabled || this.form.type === GF_TypeForm.INSPECTION) { this.cForm.get(atributo)?.disable(); }
        }
        break;
      case GF_TypeForm.CREATION:
        for (const atributo of this.form.model) {
          const eleFormulario: GF_FormElement = this.form.getElement(atributo);
          eleFormulario.control.reset();
          this.cForm.addControl(atributo, eleFormulario.control);
          this.cForm.get(atributo)?.enable();
          if (eleFormulario.disabled) this.cForm.get(atributo)?.disable();
        }
        break;
    }
  }

  /** Funci??n para cerrar el modal enviando el resultado de la edici??n */
  save(): void {
    this.cForm.markAllAsTouched();
    this.cForm.markAsDirty();
    if (this.cForm.valid) {
      for (const atributo of this.form.model) {
        switch (this.form.getElement(atributo).type) {
          case GF_TypeControl.SELECTBOOLEAN:
          case GF_TypeControl.CHECKBOX:
            this.form.entity[atributo] = this.cForm.get(atributo)?.value === true;
            break;
          default:
            this.form.entity[atributo] = this.cForm.get(atributo)?.value ?? null;
            break;
        }
      }
      if (this.form.APIRequest?.[this.form.type]) {
        this.ejecutaAPI();
      } else {
        this.close(this.form.entity);
      }
    } else {
      this.snackBar.open('The form has some errors', 'Cerrar', {
        duration: 3000, panelClass: 'customSnackbar',
      });
    }
  }

  /** Funci??n para cerrar el modal cancelando la edici??n */
  close(element?: any): void {
    if (this.cForm) this.cForm.reset();
    this.dialogRef.close(element || false);
  }


  /** Funci??n para ejecutar la API asignada al formulario */
  ejecutaAPI(borrado?: boolean): void {
    const peticionAPI: GF_APIRequest = this.form.APIRequest?.[this.form.type];

    const params: any[] = peticionAPI.prepareParams(this.form.entity);
    // Si la petici??n tiene asignado parametros extras predefinidos, se setean al this.form.entity para prepararlo en caso de ser un param
    peticionAPI.request(...params).subscribe({
      next: (response) => {
        this.form.entity = borrado ? 'BORRADO' : response;
        this.cForm.reset();
        this.dialogRef.close(this.form.entity);
      },
      error: () => {
        if (this.form.type === GF_TypeForm.EDITION) {
          this.rollbackElement();
        }
      },
    });
  }

  /** En caso de error durante una petici??n PUT, hace rollback al elemento sobre el elementoOriginal para que por fuera
   * no se reflejen los cambios de una petici??n que realmente ha sido erronea
   */
  rollbackElement(): void {
    for (const key of Object.keys(this.form.entity as object)) {
      this.form.entity[key] = this.form.originalEntity[key];
    }
  }

  /**
   * Realiza una acci??n extra asignada
   * @param extraAction Acci??n a ejecutar y su funci??n
   */
  doExtraAction(extraAction: GF_ExtraAction): void {
    extraAction.function();
    if (extraAction.close) this.dialogRef.close();

  }

  /**
   * Handle the file upload
   * @param event Event with the files
   * @param model Model of the control
   */
  protected fileUploaded(event: any, model: string): void {
    this.form.images = new FormData();
    let i: number = 0;
    if (event.target.files) {
      for (const file of event.target.files) {
        this.form.images.append(model + i, file);
        i++;
      }
    }
    this.cForm.get(model)?.setValue(`${i} ${Res.Get('UPLOADED', this.locale)}`);


  }
}
