import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.css']
})
export class TerminosComponent {
  @Output() aceptado = new EventEmitter<void>();
  @Output() rechazado = new EventEmitter<void>();

  public aceptaTerminos = false;
}