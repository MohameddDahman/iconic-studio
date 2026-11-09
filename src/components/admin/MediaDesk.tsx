"use client";

import MediaLibrary from "./MediaLibrary";
import { DeskHeader } from "./ui";

export default function MediaDesk() {
  return (
    <>
      <DeskHeader
        sheet="X-920"
        title="Photographs"
        lead="Every image the site can use. Each photograph is resized for the web as it uploads, so keep your full-size files somewhere safe."
      />
      <MediaLibrary />
    </>
  );
}
