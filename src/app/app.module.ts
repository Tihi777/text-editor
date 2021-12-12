import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TextEditorComponent } from './modules/text-editor/text-editor.component';
import { TextEditorRowComponent } from './modules/text-editor/components/text-editor-row/text-editor-row.component';

@NgModule({
  declarations: [
    AppComponent,
    TextEditorComponent,
    TextEditorRowComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
