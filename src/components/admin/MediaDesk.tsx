"use client";

import MediaLibrary from "./MediaLibrary";
import { DeskHeader } from "./ui";

export default function MediaDesk() {
  return (
    <>
      <DeskHeader
        sheet="X-920"
        title="Photographs"
        lead="Every image the site can use. Upload the originals here — the size is measured on upload so pages never jump while a photograph loads."
      />
      <MediaLibrary />
    </>
  );
}
