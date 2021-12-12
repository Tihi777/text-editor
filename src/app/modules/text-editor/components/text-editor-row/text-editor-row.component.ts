import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { TextEditorRow } from '../../models/text-editor-row';

@Component({
  selector: 'app-text-editor-row',
  templateUrl: './text-editor-row.component.html',
  styleUrls: ['./text-editor-row.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorRowComponent implements OnInit {
  @Input() data: TextEditorRow;

  constructor() {}

  ngOnInit(): void {}
}
