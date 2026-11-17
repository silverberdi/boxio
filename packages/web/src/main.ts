import { provideServiceWorker } from "@angular/service-worker";
import { bootstrapApplication } from "@angular/platform-browser";
import { isDevMode } from "@angular/core";
import { AppComponent } from "./app";

bootstrapApplication(AppComponent, {
  providers: [provideServiceWorker("ngsw-worker.js", { enabled: !isDevMode(), registrationStrategy: "registerWhenStable:30000" })],
}).catch((error) => console.error(error));
