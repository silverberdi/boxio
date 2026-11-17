import { bootstrapApplication } from "@angular/platform-browser";
import { Component } from "@angular/core";
import { createBoard } from "@boxio/engine";
import { soundCatalog } from "../../../assets/audio/boxio-sounds";

@Component({ selector: "boxio-root", standalone: true, template: `<main><img [src]="wordmark" alt="Boxio" /><p>{{ cells }} square cells · {{ sounds }} sounds</p><img [src]="appIcon" alt="" /></main>` })
class AppComponent { wordmark = "assets/branding/boxio-wordmark.svg"; appIcon = "assets/branding/boxio-app-icon.svg"; cells = createBoard([{ row: 0, column: 0 }]).cells.length; sounds = Object.keys(soundCatalog).length; }
bootstrapApplication(AppComponent);
