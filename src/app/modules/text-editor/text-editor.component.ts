import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CaretPosition } from './models/caret-position';
import { TextEditorRow } from './models/text-editor-row';
import { BehaviorSubject } from 'rxjs';
import { KeyCode } from './models/key-code';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrls: ['./text-editor.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorComponent implements AfterViewInit {
  @ViewChild('caret') caret: ElementRef<HTMLSpanElement>;

  textEditorRows: TextEditorRow[];
  private caretPosition$: BehaviorSubject<CaretPosition>;

  constructor(
    private renderer: Renderer2,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.textEditorRows = [{ index: 0, content: 'Начните писать здесь ...' }];
    this.caretPosition$ = new BehaviorSubject({
      columnIndex:
        this.textEditorRows[this.textEditorRows.length - 1].content.length,
      rowIndex: this.textEditorRows.length,
    } as CaretPosition);
  }

  ngAfterViewInit(): void {
    this.caretPosition$.subscribe(({ columnIndex, rowIndex }) => {
      this.setCaretPosition(rowIndex, columnIndex);
    });
  }

  @HostListener('document:keypress', ['$event'])
  handleKeypressEvent(event: KeyboardEvent) {
    const keyCode = event.keyCode;
    const key = event.key;

    const rowIndex = this.caretPosition$.getValue().rowIndex;
    const columnIndex = this.caretPosition$.getValue().columnIndex;

    if (keyCode === KeyCode.Enter) {
      this.textEditorRows.push({
        index: this.textEditorRows.length,
        content: '',
      });
      this.caretPosition$.next({
        columnIndex: 0,
        rowIndex: rowIndex + 1,
      } as CaretPosition);
      return;
    }

    if (keyCode === KeyCode.Space) {
      const newContent = this.insertSubstring(
        this.textEditorRows[rowIndex - 1].content,
        columnIndex,
        ' '
      );
      this.textEditorRows[rowIndex - 1] = {
        ...this.textEditorRows[rowIndex - 1],
        content: newContent,
      };

      this.caretPosition$.next({
        columnIndex: columnIndex + 1,
        rowIndex,
      } as CaretPosition);
      return;
    }

    const newContent = this.insertSubstring(
      this.textEditorRows[rowIndex - 1].content,
      columnIndex,
      key
    );
    this.textEditorRows[rowIndex - 1] = {
      ...this.textEditorRows[rowIndex - 1],
      content: newContent,
    };

    this.caretPosition$.next({
      columnIndex: columnIndex + 1,
      rowIndex,
    } as CaretPosition);

    this.changeDetectorRef.detectChanges();
  }

  @HostListener('document:keydown', ['$event.keyCode'])
  handleKeyboardEvent(keyCode: KeyCode) {
    const { rowIndex, columnIndex } = this.caretPosition$.getValue();

    if (keyCode === KeyCode.ArrowLeft) {
      this.caretPosition$.next({
        columnIndex: columnIndex - 1,
        rowIndex,
      } as CaretPosition);
      return;
    }

    if (keyCode === KeyCode.ArrowRight) {
      this.caretPosition$.next({
        columnIndex: columnIndex + 1,
        rowIndex,
      } as CaretPosition);
      return;
    }

    if (keyCode === KeyCode.ArrowUp) {
      this.caretPosition$.next({
        rowIndex: rowIndex - 1,
        columnIndex: Math.min(
          this.textEditorRows[rowIndex - 2].content.length,
          columnIndex
        ),
      } as CaretPosition);
      return;
    }

    if (keyCode === KeyCode.ArrowDown) {
      this.caretPosition$.next({
        rowIndex: rowIndex + 1,
        columnIndex: Math.min(
          this.textEditorRows[rowIndex].content.length,
          columnIndex
        ),
      } as CaretPosition);
      return;
    }

    if (keyCode === KeyCode.Home) {
      this.caretPosition$.next({
        rowIndex: rowIndex,
        columnIndex: 0,
      } as CaretPosition);
      return;
    }

    if (keyCode === KeyCode.End) {
      this.caretPosition$.next({
        rowIndex: rowIndex,
        columnIndex: this.textEditorRows[rowIndex - 1].content.length,
      } as CaretPosition);
      return;
    }

    if (keyCode === KeyCode.Backspace || keyCode === KeyCode.Delete) {
      const newContent = this.deleteSymbol(
        this.textEditorRows[rowIndex - 1].content,
        columnIndex - 1
      );

      this.textEditorRows[rowIndex - 1] = {
        ...this.textEditorRows[rowIndex - 1],
        content: newContent,
      };

      this.caretPosition$.next({
        columnIndex: columnIndex - 1,
        rowIndex,
      } as CaretPosition);

      if (!newContent) {
        this.caretPosition$.next({
          columnIndex: this.textEditorRows[rowIndex - 2].content.length,
          rowIndex: rowIndex - 1,
        } as CaretPosition);

        this.textEditorRows = this.textEditorRows.slice(0, rowIndex - 1);
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  saveToFile() {
    const text = this.textEditorRows.reduce((text, row) => {
      return text + row.content + '\n';
    }, '');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });

    const anchor = this.renderer.createElement('a');
    this.renderer.setAttribute(anchor, 'href', URL.createObjectURL(blob));
    this.renderer.setAttribute(
      anchor,
      'download',
      `file-${new Date().toLocaleString()}`
    );
    anchor.click();
  }

  async openFileInEditor(file?: File | null) {
    if (!file) {
      return;
    }

    const text = await file.text();

    const stringRows = text.split('\n');

    this.textEditorRows = [];
    stringRows.forEach((stringRow, index) => {
      this.textEditorRows.push({ content: stringRow, index });
    });

    this.caretPosition$.next({
      rowIndex: 1,
      columnIndex: this.textEditorRows[0].content.length - 1,
    });
    this.changeDetectorRef.detectChanges();
  }

  private setCaretPosition(rowIndex: number, columnIndex: number) {
    if (rowIndex < 1) {
      rowIndex = 1;
    }

    if (rowIndex > this.textEditorRows.length) {
      rowIndex = this.textEditorRows.length;
    }

    if (columnIndex < 0) {
      columnIndex = 0;
    }

    const x = columnIndex * 9.9 + 50;
    const y = rowIndex * 20 + 2;

    this.renderer.setStyle(this.caret.nativeElement, 'left', x + 'px');
    this.renderer.setStyle(this.caret.nativeElement, 'top', y + 'px');
  }

  private insertSubstring(str: string, index: number, value: string) {
    return str.substr(0, index) + value + str.substr(index);
  }

  private deleteSymbol(str: string, index: number) {
    return str.substr(0, index) + str.substr(index + 1);
  }
}
